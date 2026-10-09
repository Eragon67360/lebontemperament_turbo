import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:geolocator/geolocator.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../data/models/delivery.dart';
import '../../../../data/models/delivery_recipient.dart';
import '../../../../data/services/delivery_service.dart';
import '../../data/delivery_invitations.dart';

/// Current position (lat, lng) for display.
class TrackingPosition {
  final double lat;
  final double lng;
  final double? accuracyMeters;

  const TrackingPosition({
    required this.lat,
    required this.lng,
    this.accuracyMeters,
  });
}

/// State for the driver tracking screen.
class DriverTrackingState {
  final Delivery? delivery;
  final List<DeliveryRecipient> recipients;

  /// Positions are being sent: a GPS stream runs in this process.
  final bool isTracking;

  /// The database says the round is live but no GPS stream runs here (the
  /// app was killed mid-round): the driver must resume or stop it.
  final bool isTrackingInterrupted;
  final TrackingPosition? position;
  final String? error;
  final bool isLoading;
  final bool isActionLoading;

  const DriverTrackingState({
    this.delivery,
    this.recipients = const [],
    this.isTracking = false,
    this.isTrackingInterrupted = false,
    this.position,
    this.error,
    this.isLoading = false,
    this.isActionLoading = false,
  });

  DriverTrackingState copyWith({
    Delivery? delivery,
    List<DeliveryRecipient>? recipients,
    bool? isTracking,
    bool? isTrackingInterrupted,
    TrackingPosition? position,
    String? error,
    bool? isLoading,
    bool? isActionLoading,
  }) {
    return DriverTrackingState(
      delivery: delivery ?? this.delivery,
      recipients: recipients ?? this.recipients,
      isTracking: isTracking ?? this.isTracking,
      isTrackingInterrupted:
          isTrackingInterrupted ?? this.isTrackingInterrupted,
      position: position ?? this.position,
      error: error,
      isLoading: isLoading ?? this.isLoading,
      isActionLoading: isActionLoading ?? this.isActionLoading,
    );
  }
}

final deliveryServiceProvider = Provider<DeliveryService>((ref) {
  return DeliveryService();
});

final driverTrackingProvider =
    StateNotifierProvider<DriverTrackingNotifier, DriverTrackingState>((ref) {
      final service = ref.watch(deliveryServiceProvider);
      return DriverTrackingNotifier(service);
    });

class DriverTrackingNotifier extends StateNotifier<DriverTrackingState> {
  final DeliveryService _service;
  final Logger _logger = Logger();

  StreamSubscription<Position>? _positionSubscription;
  Timer? _backupTimer;

  DriverTrackingNotifier(this._service) : super(const DriverTrackingState());

  /// Load or create delivery. Call when screen opens.
  Future<void> loadDelivery() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final delivery = await _service.getOrCreateDelivery();
      List<DeliveryRecipient> recipients = const [];
      if (delivery != null) {
        try {
          recipients = await _service.getRecipients(delivery.id);
        } catch (_) {}
      }
      // "Active" in the database only means live when this process still
      // streams positions; after an app kill it is stale, and the screen
      // must not claim the position is shared (nothing is written here:
      // resuming or stopping is the driver's call).
      final dbActive = delivery?.isTrackingActive ?? false;
      final streaming = _positionSubscription != null;
      state = state.copyWith(
        delivery: delivery,
        recipients: recipients,
        isLoading: false,
        error: null,
        isTracking: dbActive && streaming,
        isTrackingInterrupted: dbActive && !streaming,
        position:
            delivery != null &&
                delivery.latitude != null &&
                delivery.longitude != null
            ? TrackingPosition(
                lat: delivery.latitude!,
                lng: delivery.longitude!,
              )
            : null,
      );
    } catch (e) {
      _logger.e('DriverTrackingNotifier loadDelivery', error: e);
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur lors du chargement de la livraison.',
      );
    }
  }

  /// Refresh recipients list for current delivery.
  Future<void> loadRecipients() async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final recipients = await _service.getRecipients(delivery.id);
      state = state.copyWith(recipients: recipients);
    } catch (e) {
      _logger.e('DriverTrackingNotifier loadRecipients', error: e);
    }
  }

  /// Update scheduled delivery time (start and optional end for time range).
  Future<void> updateScheduledRange({
    required DateTime? scheduledAt,
    DateTime? scheduledEndAt,
  }) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.updateScheduledRange(
        delivery.id,
        scheduledAt: scheduledAt,
        scheduledEndAt: scheduledEndAt,
      );
      if (updated != null)
        state = state.copyWith(delivery: updated, error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier updateScheduledRange', error: e);
      state = state.copyWith(
        error: 'Erreur lors de la mise à jour de l\'heure.',
      );
    }
  }

  /// Set delay flag and optional minutes.
  Future<void> setDelay({required bool isDelayed, int? delayMinutes}) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.setDelay(
        delivery.id,
        isDelayed: isDelayed,
        delayMinutes: delayMinutes,
      );
      if (updated != null)
        state = state.copyWith(delivery: updated, error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier setDelay', error: e);
      state = state.copyWith(error: 'Erreur lors de la mise à jour du retard.');
    }
  }

  /// Set or clear problem message.
  Future<void> setProblemMessage(String? message) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.setProblemMessage(delivery.id, message);
      if (updated != null)
        state = state.copyWith(delivery: updated, error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier setProblemMessage', error: e);
      state = state.copyWith(
        error: 'Erreur lors de la mise à jour du message.',
      );
    }
  }

  /// Add a recipient.
  Future<void> addRecipient({
    required String label,
    String? address,
    double? latitude,
    double? longitude,
    String? phoneNumber,
  }) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final list = state.recipients;
      final sortOrder = list.isEmpty
          ? 0
          : (list.map((r) => r.sortOrder).reduce((a, b) => a > b ? a : b) + 1);
      final added = await _service.addRecipient(
        delivery.id,
        label: label,
        sortOrder: sortOrder,
        address: address,
        latitude: latitude,
        longitude: longitude,
        phoneNumber: phoneNumber,
      );
      state = state.copyWith(recipients: [...list, added], error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier addRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors de l\'ajout de la personne.');
    }
  }

  /// Start driving to a recipient (sets current_recipient_id).
  Future<void> startDrivingToRecipient(String recipientId) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    state = state.copyWith(isActionLoading: true);
    try {
      // First, update the database and local state so the UI is fast.
      await _service.setCurrentRecipient(delivery.id, recipientId: recipientId);
      final updated = await _service.getDelivery(delivery.id);
      if (updated != null) {
        state = state.copyWith(delivery: updated, error: null);
      }

      // --- Tell the recipient they are next: a push to the phones that
      // follow the delivery in the app (no SMS since #593). Awaited to
      // prevent a double tap. ---
      _logger.i('Sending the « next » notification for recipient $recipientId');
      final response = await Supabase.instance.client.functions.invoke(
        'send-delivery-sms',
        body: {'recipientId': recipientId},
      );
      if (response.status != 200) {
        _logger.w(
          'Next-recipient notification failed with status: ${response.status}',
          error: response.data,
        );
      } else {
        _logger.i(
          'Next-recipient notification sent for recipient $recipientId',
        );
      }
    } catch (e) {
      _logger.e('DriverTrackingNotifier startDrivingToRecipient', error: e);
      state = state.copyWith(
        error: 'Erreur lors du démarrage de la livraison.',
      );
    } finally {
      state = state.copyWith(isActionLoading: false);
    }
  }

  /// Sends the invitation SMS (#593): to every recipient of the delivery
  /// with a phone number, not delivered and never invited, or, with
  /// [recipientIds], to those only (also when already invited: « Renvoyer
  /// l’invitation »). Refreshes the recipients so their invitation dates
  /// show. The server checks the role, the date and the numbers.
  Future<InvitationSendResult> sendInvitations({
    List<String>? recipientIds,
  }) async {
    final delivery = state.delivery;
    if (delivery == null) {
      return const InvitationSendResult(error: 'no_delivery');
    }
    state = state.copyWith(isActionLoading: true, error: null);
    InvitationSendResult result;
    try {
      final response = await Supabase.instance.client.functions.invoke(
        kSendDeliveryInvitationsFunction,
        body: {'deliveryId': delivery.id, 'recipientIds': ?recipientIds},
      );
      result = InvitationSendResult.fromResponse(
        response.status,
        response.data,
      );
    } on FunctionException catch (e) {
      // Non-2xx answers (400 no_date, 403) arrive here with their body.
      result = InvitationSendResult.fromResponse(e.status, e.details);
    } catch (e) {
      _logger.e('DriverTrackingNotifier sendInvitations', error: e);
      result = const InvitationSendResult(error: 'unreachable');
    }
    if (result.error != null) {
      _logger.w('send-delivery-invitations failed: ${result.error}');
    }
    // Some SMS may have gone out even when others failed: reload either way.
    await loadRecipients();
    state = state.copyWith(isActionLoading: false);
    return result;
  }

  /// Revert current recipient to pending (clears current_recipient_id).
  Future<void> revertToPending() async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      await _service.setCurrentRecipient(delivery.id, recipientId: null);
      final updated = await _service.getDelivery(delivery.id);
      if (updated != null) {
        state = state.copyWith(delivery: updated, error: null);
      }
    } catch (e) {
      _logger.e('DriverTrackingNotifier revertToPending', error: e);
      state = state.copyWith(error: 'Erreur lors du report en attente.');
    }
  }

  /// Reorder recipients (updates sort_order for each).
  Future<void> reorderRecipients(List<String> recipientIdsInOrder) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      await _service.reorderRecipients(delivery.id, recipientIdsInOrder);
      await loadRecipients();
      state = state.copyWith(error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier reorderRecipients', error: e);
      state = state.copyWith(error: 'Erreur lors du réordonnancement.');
    }
  }

  /// Optimize recipients route using nearest-neighbor heuristic.
  /// Optionally pass driver position (lat, lng) as start point.
  Future<void> optimizeRecipientsRoute({
    double? startLat,
    double? startLng,
  }) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    state = state.copyWith(isActionLoading: true, error: null);
    try {
      final body = <String, dynamic>{'deliveryId': delivery.id};
      if (startLat != null && startLng != null) {
        body['startLat'] = startLat;
        body['startLng'] = startLng;
      }
      final response = await Supabase.instance.client.functions.invoke(
        'optimize-recipients-route',
        body: body,
      );
      if (response.status != 200) {
        final msg = response.data is Map && response.data['error'] != null
            ? response.data['error'] as String
            : 'Erreur lors de l\'optimisation.';
        throw Exception(msg);
      }
      await loadRecipients();
      state = state.copyWith(error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier optimizeRecipientsRoute', error: e);
      state = state.copyWith(
        error: e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'Erreur lors de l\'optimisation de l\'itinéraire.',
      );
    } finally {
      state = state.copyWith(isActionLoading: false);
    }
  }

  /// Update a recipient.
  Future<void> updateRecipient(
    String recipientId, {
    String? label,
    int? sortOrder,
    String? address,
    double? latitude,
    double? longitude,
    String? phoneNumber,
  }) async {
    try {
      await _service.updateRecipient(
        recipientId,
        label: label,
        sortOrder: sortOrder,
        address: address,
        latitude: latitude,
        longitude: longitude,
        phoneNumber: phoneNumber,
      );
      await loadRecipients();
      state = state.copyWith(error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier updateRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors de la modification.');
    }
  }

  /// Delete a recipient.
  Future<void> deleteRecipient(String recipientId) async {
    try {
      await _service.deleteRecipient(recipientId);
      state = state.copyWith(
        recipients: state.recipients.where((r) => r.id != recipientId).toList(),
        error: null,
      );
    } catch (e) {
      _logger.e('DriverTrackingNotifier deleteRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors de la suppression.');
    }
  }

  /// Mark a recipient as delivered (also clears current_recipient_id on delivery).
  /// Triggers the send-delivery-complete-sms edge function, which notifies
  /// the recipient by push (the name stays for installed apps; no SMS).
  Future<void> markRecipientDelivered(String recipientId) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    state = state.copyWith(isActionLoading: true);
    try {
      final updated = await _service.markRecipientDelivered(recipientId);
      if (updated != null) {
        await loadRecipients();
        final refreshedDelivery = await _service.getDelivery(delivery.id);
        state = state.copyWith(
          delivery: refreshedDelivery ?? delivery,
          error: null,
        );

        // Push « livrée » to the recipient (await to prevent double-tap)
        final response = await Supabase.instance.client.functions.invoke(
          'send-delivery-complete-sms',
          body: {'recipientId': recipientId},
        );
        if (response.status != 200) {
          _logger.w(
            'Delivered notification failed with status: ${response.status}',
            error: response.data,
          );
        } else {
          _logger.i('Delivered notification sent for recipient $recipientId');
        }
      }
    } catch (e) {
      _logger.e('DriverTrackingNotifier markRecipientDelivered', error: e);
      state = state.copyWith(error: 'Erreur lors du marquage comme livré.');
    } finally {
      state = state.copyWith(isActionLoading: false);
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Check and request location permission. Returns true if granted, false otherwise.
  /// Call this before showing any modal so the system permission dialog can appear.
  Future<bool> ensureLocationPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      state = state.copyWith(
        error:
            'Permission de géolocalisation refusée. Autorisez l\'accès dans les paramètres.',
      );
      return false;
    }
    return true;
  }

  /// Start the delivery round: get position, call start-delivery-round
  /// (scheduled_at + optional « tournée commencée » notification), then
  /// start tracking. [notifyRecipients] goes to the function as `sendSms`,
  /// the name installed apps use; the server sends pushes only (#593).
  Future<void> startDeliveryRound({required bool notifyRecipients}) async {
    final delivery = state.delivery;
    if (delivery == null) {
      state = state.copyWith(error: 'Aucune livraison. Rechargez la page.');
      return;
    }

    state = state.copyWith(isActionLoading: true, error: null);

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      final response = await Supabase.instance.client.functions.invoke(
        'start-delivery-round',
        body: {
          'deliveryId': delivery.id,
          'startLat': position.latitude,
          'startLng': position.longitude,
          'sendSms': notifyRecipients,
        },
      );

      if (response.status != 200) {
        final msg = response.data is Map && response.data['error'] != null
            ? response.data['error'] as String
            : 'Erreur lors du démarrage de la livraison.';
        throw Exception(msg);
      }

      await loadRecipients();
      await startTracking();
      state = state.copyWith(error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier startDeliveryRound', error: e);
      state = state.copyWith(
        error: e is Exception
            ? e.toString().replaceFirst('Exception: ', '')
            : 'Erreur lors du démarrage de la livraison.',
      );
    } finally {
      state = state.copyWith(isActionLoading: false);
    }
  }

  /// Start tracking: request permission, start DB tracking, then position stream + backup timer.
  Future<void> startTracking() async {
    final delivery = state.delivery;
    if (delivery == null) {
      state = state.copyWith(error: 'Aucune livraison. Rechargez la page.');
      return;
    }

    state = state.copyWith(error: null);

    // Check / request location permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      state = state.copyWith(
        error:
            'Permission de géolocalisation refusée. Autorisez l\'accès dans les paramètres.',
      );
      return;
    }

    try {
      await _service.startTracking(delivery.id);
    } catch (e) {
      _logger.e('DriverTrackingNotifier startTracking DB', error: e);
      state = state.copyWith(error: 'Erreur lors du démarrage du suivi.');
      return;
    }

    state = state.copyWith(isTracking: true, isTrackingInterrupted: false);

    final deliveryId = delivery.id;

    Future<void> onPosition(Position position) async {
      state = state.copyWith(
        position: TrackingPosition(
          lat: position.latitude,
          lng: position.longitude,
          accuracyMeters: position.accuracy,
        ),
      );
      try {
        await _service.updatePosition(
          deliveryId,
          position.latitude,
          position.longitude,
        );
      } catch (e) {
        _logger.e('DriverTrackingNotifier updatePosition failed', error: e);
      }
    }

    final locationSettings = Platform.isAndroid
        ? AndroidSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 10,
            foregroundNotificationConfig: ForegroundNotificationConfig(
              notificationTitle: 'Suivi de livraison',
              notificationText: 'Votre position est partagée en temps réel.',
              notificationChannelName: 'Suivi de livraison',
              setOngoing: true,
              enableWakeLock: true,
            ),
          )
        // iOS only keeps delivering positions to a backgrounded app when the
        // location manager is told so explicitly; plain LocationSettings
        // stopped the stream as soon as the screen went off (#360).
        : AppleSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 10,
            allowBackgroundLocationUpdates: true,
            showBackgroundLocationIndicator: true,
            pauseLocationUpdatesAutomatically: false,
            activityType: ActivityType.automotiveNavigation,
          );

    _positionSubscription =
        Geolocator.getPositionStream(locationSettings: locationSettings).listen(
          onPosition,
          onError: (e) {
            _logger.w('DriverTrackingNotifier position stream error', error: e);
          },
        );

    // Fire one position update immediately, then every 10 seconds (stream may not emit if device hasn't moved 10m)
    void sendBackupPosition() async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 15),
          ),
        );
        await onPosition(pos);
      } catch (e) {
        _logger.w(
          'DriverTrackingNotifier backup getCurrentPosition failed',
          error: e,
        );
      }
    }

    sendBackupPosition();
    _backupTimer = Timer.periodic(
      const Duration(seconds: 10),
      (_) => sendBackupPosition(),
    );

    _logger.i('DriverTrackingNotifier: tracking started for $deliveryId');
  }

  /// Stop tracking: cancel stream and timer, update DB.
  Future<void> stopTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
    _backupTimer?.cancel();
    _backupTimer = null;

    final delivery = state.delivery;
    if (delivery != null) {
      try {
        await _service.stopTracking(delivery.id);
      } catch (e) {
        _logger.e('DriverTrackingNotifier stopTracking DB', error: e);
      }
    }

    state = state.copyWith(isTracking: false, isTrackingInterrupted: false);
    _logger.i('DriverTrackingNotifier: tracking stopped');
  }

  /// Reset token and extend expiry. Returns updated delivery or null.
  Future<Delivery?> resetToken() async {
    final delivery = state.delivery;
    if (delivery == null) return null;
    try {
      final updated = await _service.resetToken(delivery.id);
      if (updated != null) {
        state = state.copyWith(delivery: updated, error: null);
      }
      return updated;
    } catch (e) {
      _logger.e('DriverTrackingNotifier resetToken', error: e);
      state = state.copyWith(
        error: 'Erreur lors de la réinitialisation du lien de partage.',
      );
      return null;
    }
  }
}
