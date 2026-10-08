import 'dart:async';
import 'dart:io' show Platform;

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/dependency_injection.dart';
import '../../core/config/supabase_config.dart';
import '../../features/public/data/public_concert_notifications.dart';
import 'fcm_notification_handler.dart';
import 'storage_service.dart';

/// Keeps push notifications and the local cache tied to the member's session.
///
/// - with a session (app start, sign-in): subscribed to the `all_users` topic,
///   and the phone's FCM token registered with `register_push_device`, again
///   whenever FCM rotates it. The server keeps it only for superadmins, who
///   get the production alerts on it (#364). A member gets concerts through
///   `all_users`, so the public concert topic is left;
/// - without a session at app start: unsubscribed from `all_users` (devices
///   that subscribed while signed out with older builds stop receiving
///   pushes), and subscribed to [publicTopic] while the visitor keeps
///   « Prochains concerts » on (#593);
/// - just before an explicit sign-out ([beforeSignOut], while the session can
///   still call the server): the token unregistered;
/// - on sign-out (explicit, or a session Supabase could no longer refresh):
///   unsubscribed, the FCM token deleted, the local cache cleared, then back
///   on [publicTopic] like any visitor. A deleted token that was still
///   registered is dropped by the server at its next send.
class SessionNotifications {
  SessionNotifications({
    required Future<void> Function(String topic) subscribe,
    required Future<void> Function(String topic) unsubscribe,
    required Future<void> Function() deleteToken,
    required Future<void> Function() clearCache,
    required Future<String?> Function() readToken,
    required Stream<String> tokenRefreshes,
    required Future<void> Function(String token) registerDevice,
    required Future<void> Function(String token) unregisterDevice,
    Future<bool> Function()? publicConcertsWanted,
    Logger? logger,
  }) : _publicConcertsWanted = publicConcertsWanted ?? _never,
       _subscribe = subscribe,
       _unsubscribe = unsubscribe,
       _deleteToken = deleteToken,
       _clearCache = clearCache,
       _readToken = readToken,
       _tokenRefreshes = tokenRefreshes,
       _registerDevice = registerDevice,
       _unregisterDevice = unregisterDevice,
       _logger = logger ?? Logger();

  /// The FCM topic the server sends internal notifications to.
  static const String topic = 'all_users';

  /// The FCM topic of the concert announcements for visitors (#593): no
  /// token or personal data is stored for them.
  static const String publicTopic = 'public_concerts';

  static Future<bool> _never() async => false;

  final Future<void> Function(String topic) _subscribe;
  final Future<void> Function(String topic) _unsubscribe;
  final Future<void> Function() _deleteToken;
  final Future<void> Function() _clearCache;
  final Future<String?> Function() _readToken;
  final Stream<String> _tokenRefreshes;
  final Future<void> Function(String token) _registerDevice;
  final Future<void> Function(String token) _unregisterDevice;
  final Future<bool> Function() _publicConcertsWanted;
  final Logger _logger;

  StreamSubscription<AuthState>? _subscription;
  StreamSubscription<String>? _refreshSubscription;
  bool _signedIn = false;

  /// Wires the real FCM, Firebase and Hive dependencies.
  factory SessionNotifications.production() {
    return SessionNotifications(
      subscribe: FcmNotificationHandler.subscribeToTopic,
      unsubscribe: FcmNotificationHandler.unsubscribeFromTopic,
      deleteToken: () => FirebaseMessaging.instance.deleteToken(),
      clearCache: () => DependencyInjection.getIt<StorageService>().clearAll(),
      readToken: FcmNotificationHandler.currentToken,
      tokenRefreshes: FirebaseMessaging.instance.onTokenRefresh,
      registerDevice: (token) async {
        await SupabaseConfig.client.rpc(
          'register_push_device',
          params: {
            'p_token': token,
            'p_platform': Platform.isIOS ? 'ios' : 'android',
          },
        );
      },
      unregisterDevice: (token) async {
        await SupabaseConfig.client.rpc(
          'unregister_push_device',
          params: {'p_token': token},
        );
      },
      publicConcertsWanted: PublicConcertNotifications.isEnabled,
    );
  }

  /// Applies the current session once, then follows [authStateChanges].
  ///
  /// Supabase emits `initialSession` while it initialises, before anyone can
  /// listen, so the initial state is applied explicitly here and the stream's
  /// own `initialSession` event is ignored.
  void bind({
    required Session? currentSession,
    required Stream<AuthState> authStateChanges,
  }) {
    _enqueue(AuthChangeEvent.initialSession, currentSession);
    _subscription?.cancel();
    _subscription = authStateChanges.listen((state) {
      if (state.event == AuthChangeEvent.initialSession) return;
      _enqueue(state.event, state.session);
    }, onError: (Object e) => _logger.w('Auth state stream error: $e'));
    _refreshSubscription?.cancel();
    _refreshSubscription = _tokenRefreshes.listen((token) {
      if (!_signedIn) return;
      unawaited(_run('registerDevice', () => _registerDevice(token)));
    }, onError: (Object e) => _logger.w('FCM token refresh error: $e'));
  }

  /// Handles auth events one after the other, so a quick sign-out never
  /// runs while the sign-in is still registering the phone.
  void _enqueue(AuthChangeEvent event, Session? session) {
    _queue = _queue.then((_) => handle(event, session));
  }

  Future<void> _queue = Future<void>.value();

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
    await _refreshSubscription?.cancel();
    _refreshSubscription = null;
  }

  /// Unregisters this phone's token. Call it before signing out on purpose:
  /// once signed out, the server no longer knows whose token it is. Gives up
  /// after [unregisterTimeout] so a slow network never holds the sign-out.
  Future<void> beforeSignOut() async {
    await _run('unregisterDevice', () async {
      final token = await _readToken();
      if (token != null) await _unregisterDevice(token);
    }).timeout(
      unregisterTimeout,
      onTimeout: () {
        _logger.w('SessionNotifications: unregisterDevice timed out');
      },
    );
  }

  static const Duration unregisterTimeout = Duration(seconds: 5);

  /// Applies the visitor's « Prochains concerts » switch. A member's phone
  /// stays off the public topic whatever the switch says.
  Future<void> publicConcertsChanged() {
    final done = _queue.then((_) async {
      if (!_signedIn) await _applyPublicTopic();
    });
    _queue = done;
    return done;
  }

  Future<void> _applyPublicTopic() async {
    final wanted = await _publicConcertsWanted().catchError((_) => false);
    await _run(
      wanted ? 'subscribePublic' : 'unsubscribePublic',
      () => wanted ? _subscribe(publicTopic) : _unsubscribe(publicTopic),
    );
  }

  /// Reacts to one auth event. Each step is independent: a failing step is
  /// logged and the others still run.
  Future<void> handle(AuthChangeEvent event, Session? session) async {
    switch (event) {
      case AuthChangeEvent.initialSession:
        if (session != null) {
          await _signIn();
        } else {
          _signedIn = false;
          await _run('unsubscribe', () => _unsubscribe(topic));
          await _applyPublicTopic();
        }
      case AuthChangeEvent.signedIn:
        await _signIn();
      case AuthChangeEvent.signedOut:
        _signedIn = false;
        await _run('unsubscribe', () => _unsubscribe(topic));
        await _run('deleteToken', _deleteToken);
        await _run('clearCache', _clearCache);
        await _applyPublicTopic();
      case AuthChangeEvent.tokenRefreshed:
      case AuthChangeEvent.userUpdated:
      case AuthChangeEvent.passwordRecovery:
      case AuthChangeEvent.mfaChallengeVerified:
      // ignore: deprecated_member_use
      case AuthChangeEvent.userDeleted:
        break;
    }
  }

  Future<void> _signIn() async {
    _signedIn = true;
    await _run('unsubscribePublic', () => _unsubscribe(publicTopic));
    await _run('subscribe', () => _subscribe(topic));
    await _run('registerDevice', () async {
      final token = await _readToken();
      if (token != null) await _registerDevice(token);
    });
  }

  Future<void> _run(String step, Future<void> Function() action) async {
    try {
      await action();
    } catch (e) {
      _logger.w('SessionNotifications: $step failed: $e');
    }
  }
}
