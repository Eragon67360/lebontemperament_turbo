import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform, SocketException;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/supabase_config.dart';
import '../../../data/services/fcm_notification_handler.dart';
import '../../../data/services/notification_service.dart';
import 'delivery_code.dart';
import 'delivery_pass.dart';
import 'delivery_tracking.dart';

/// What redeeming a code came to.
sealed class RedeemResult {
  const RedeemResult();
}

class RedeemOk extends RedeemResult {
  const RedeemOk(this.pass);
  final DeliveryPass pass;
}

/// Unknown code, or a round that is over.
class RedeemNotFound extends RedeemResult {
  const RedeemNotFound();
}

/// Too many wrong codes from this phone (or from everyone) lately.
class RedeemRateLimited extends RedeemResult {
  const RedeemRateLimited();
}

/// Not 8 characters of the alphabet.
class RedeemInvalid extends RedeemResult {
  const RedeemInvalid();
}

/// The server could not be reached (offline, or down).
class RedeemUnreachable extends RedeemResult {
  const RedeemUnreachable();
}

/// The server answered something unexpected.
class RedeemFailed extends RedeemResult {
  const RedeemFailed();
}

/// The sentence shown under the code field for a failed [result].
String redeemErrorMessage(RedeemResult result) => switch (result) {
  RedeemOk() => '',
  RedeemNotFound() =>
    'Ce code ne correspond à aucune livraison en cours. Vérifiez-le dans '
        'le SMS.',
  RedeemRateLimited() => 'Trop d’essais : réessayez dans une heure.',
  RedeemInvalid() =>
    'Le code comporte 8 lettres ou chiffres, par exemple K7MP-4XQ9.',
  RedeemUnreachable() =>
    'Impossible de vérifier le code. Vérifiez votre connexion et réessayez.',
  RedeemFailed() => 'Le serveur n’a pas répondu. Réessayez dans un instant.',
};

/// Thrown by the network step when the phone cannot reach the server.
class DeliveryUnreachable implements Exception {
  const DeliveryUnreachable();
}

/// What reading the tracking came to.
sealed class TrackingResult {
  const TrackingResult();
}

class TrackingOk extends TrackingResult {
  const TrackingOk(this.tracking);
  final DeliveryTracking tracking;
}

/// The server answered null: the round is over (or the token unknown).
class TrackingOver extends TrackingResult {
  const TrackingOver();
}

class TrackingUnavailable extends TrackingResult {
  const TrackingUnavailable();
}

/// Delivery passes on this phone (#593): redeeming a code with the
/// `redeem-delivery-code` function, reading the tracking, forgetting a
/// delivery, and keeping the attached FCM token fresh. Every network step
/// is injected so tests use fakes.
class DeliveryPassService {
  DeliveryPassService({
    required Future<Map<String, dynamic>> Function(Map<String, dynamic> body)
    invoke,
    required Future<Object?> Function(String token) tracking,
    required Future<void> Function() ensurePermission,
    required Future<bool> Function() hasPermission,
    required Future<String?> Function() readToken,
    required String Function() platform,
    Stream<String>? tokenRefreshes,
    DeliveryPassStore store = const DeliveryPassStore(),
    Logger? logger,
  }) : _invoke = invoke,
       _tracking = tracking,
       _ensurePermission = ensurePermission,
       _hasPermission = hasPermission,
       _readToken = readToken,
       _platform = platform,
       _tokenRefreshes = tokenRefreshes ?? const Stream.empty(),
       _store = store,
       _logger = logger ?? Logger();

  final Future<Map<String, dynamic>> Function(Map<String, dynamic> body)
  _invoke;
  final Future<Object?> Function(String token) _tracking;
  final Future<void> Function() _ensurePermission;
  final Future<bool> Function() _hasPermission;
  final Future<String?> Function() _readToken;
  final String Function() _platform;
  final Stream<String> _tokenRefreshes;
  final DeliveryPassStore _store;

  /// The passes on this phone.
  DeliveryPassStore get store => _store;
  final Logger _logger;
  StreamSubscription<String>? _refreshSubscription;

  static const String functionName = 'redeem-delivery-code';

  /// The real function, RPC, permission and FCM wiring.
  factory DeliveryPassService.production() {
    return DeliveryPassService(
      invoke: (body) async {
        try {
          final response = await SupabaseConfig.client.functions.invoke(
            functionName,
            body: body,
          );
          return _asJson(response.data) ?? const {};
        } on FunctionException catch (e) {
          // 404, 429 and 400 carry the status in their body.
          return _asJson(e.details) ?? {'status': 'error', 'http': e.status};
        } on SocketException {
          throw const DeliveryUnreachable();
        } on TimeoutException {
          throw const DeliveryUnreachable();
        } catch (_) {
          // http.ClientException (« Connection failed ») and the like.
          throw const DeliveryUnreachable();
        }
      },
      tracking: (token) => SupabaseConfig.client.rpc(
        'get_tracking_by_recipient_token',
        params: {'token': token},
      ),
      ensurePermission: () async {
        final service = NotificationService();
        if (!await service.hasPermissions()) {
          await service.requestPermissions();
        }
      },
      hasPermission: () => NotificationService().hasPermissions(),
      readToken: FcmNotificationHandler.currentToken,
      platform: () => Platform.isIOS ? 'ios' : 'android',
      tokenRefreshes: FirebaseMessaging.instance.onTokenRefresh,
    );
  }

  static Map<String, dynamic>? _asJson(Object? data) {
    if (data is Map) return data.cast<String, dynamic>();
    if (data is String && data.isNotEmpty) {
      try {
        final decoded = jsonDecode(data);
        if (decoded is Map) return decoded.cast<String, dynamic>();
      } catch (_) {}
    }
    return null;
  }

  Future<List<DeliveryPass>> passes() => store.all();

  /// Whether the phone will show the delivery pushes.
  Future<bool> notificationsAllowed() async {
    try {
      return await _hasPermission();
    } catch (_) {
      return false;
    }
  }

  /// Redeems [rawCode] (typed or from a link): asks the notification
  /// permission when it was never given, attaches this phone's token to the
  /// recipient and keeps the pass. Redeeming a pass's own code again is how
  /// a token obtained later gets attached.
  Future<RedeemResult> redeem(String rawCode) async {
    final code = normalizeDeliveryCode(rawCode);
    if (!isValidDeliveryCode(code)) return const RedeemInvalid();
    try {
      await _ensurePermission();
    } catch (e) {
      _logger.w('DeliveryPassService: permission step failed: $e');
    }
    final token = await _token();
    final Map<String, dynamic> json;
    try {
      json = await _invoke({
        'code': code,
        'fcm_token': ?token,
        'platform': _platform(),
      });
    } on DeliveryUnreachable {
      return const RedeemUnreachable();
    } catch (e) {
      _logger.w('DeliveryPassService: redeem failed: $e');
      return const RedeemFailed();
    }
    switch (json['status']) {
      case 'ok':
        final recipientId = json['recipient_id']?.toString() ?? '';
        final trackingToken = json['tracking_token']?.toString() ?? '';
        if (recipientId.isEmpty || trackingToken.isEmpty) {
          return const RedeemFailed();
        }
        final pass = DeliveryPass(
          recipientId: recipientId,
          trackingToken: trackingToken,
          code: code,
          label: json['label']?.toString().trim() ?? '',
          addedAt: DateTime.now().toUtc(),
        );
        await store.save(pass);
        return RedeemOk(pass);
      case 'not_found':
        return const RedeemNotFound();
      case 'rate_limited':
        return const RedeemRateLimited();
      case 'invalid':
        return const RedeemInvalid();
      default:
        return const RedeemFailed();
    }
  }

  /// « Activer les notifications » on the delivery screen: asks the phone,
  /// and attaches the token when it says yes. Returns whether pushes may be
  /// shown now.
  Future<bool> enableNotifications(DeliveryPass pass) async {
    try {
      await _ensurePermission();
    } catch (e) {
      _logger.w('DeliveryPassService: permission step failed: $e');
    }
    final allowed = await notificationsAllowed();
    if (allowed) await attachToken(pass);
    return allowed;
  }

  /// Attaches this phone's current token to [pass] (after the permission
  /// was granted, or when FCM rotated the token). Quiet on failure.
  Future<void> attachToken(DeliveryPass pass, {String? token}) async {
    final t = token ?? await _token();
    if (t == null || pass.code.isEmpty) return;
    try {
      await _invoke({
        'code': pass.code,
        'fcm_token': t,
        'platform': _platform(),
      });
    } catch (e) {
      _logger.w('DeliveryPassService: attachToken failed: $e');
    }
  }

  /// Tells the server this phone no longer wants the pushes, then drops the
  /// pass. The pass goes even when the server cannot be reached.
  Future<void> forget(DeliveryPass pass) async {
    final token = await _token();
    try {
      await _invoke({
        'action': 'forget',
        'tracking_token': pass.trackingToken,
        'fcm_token': ?token,
      });
    } catch (e) {
      _logger.w('DeliveryPassService: forget failed: $e');
    }
    await store.remove(pass.recipientId);
  }

  /// The delivery's state. [TrackingOver] means the round ended: the pass
  /// is dropped on the way.
  Future<TrackingResult> tracking(DeliveryPass pass) async {
    final Object? json;
    try {
      json = await _tracking(pass.trackingToken);
    } catch (e) {
      _logger.w('DeliveryPassService: tracking failed: $e');
      return const TrackingUnavailable();
    }
    if (json == null) {
      await store.remove(pass.recipientId);
      return const TrackingOver();
    }
    final tracking = DeliveryTracking.fromJson(json);
    if (tracking == null) return const TrackingUnavailable();
    if (tracking.isExpired()) {
      await store.remove(pass.recipientId);
      return const TrackingOver();
    }
    return TrackingOk(tracking);
  }

  /// Re-attaches every pass whenever FCM rotates the token, so the pushes
  /// keep reaching this phone.
  void bindTokenRefreshes() {
    _refreshSubscription?.cancel();
    _refreshSubscription = _tokenRefreshes.listen(
      (token) => unawaited(onTokenRefreshed(token)),
      onError: (Object e) =>
          _logger.w('DeliveryPassService: refresh error: $e'),
    );
  }

  Future<void> onTokenRefreshed(String token) async {
    for (final pass in await store.all()) {
      await attachToken(pass, token: token);
    }
  }

  Future<void> dispose() async {
    await _refreshSubscription?.cancel();
    _refreshSubscription = null;
  }

  Future<String?> _token() async {
    try {
      return await _readToken();
    } catch (e) {
      _logger.w('DeliveryPassService: no FCM token: $e');
      return null;
    }
  }
}
