import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/dependency_injection.dart';
import 'fcm_notification_handler.dart';
import 'storage_service.dart';

/// Keeps push notifications and the local cache tied to the member's session.
///
/// - with a session (app start, sign-in): subscribed to the `all_users` topic;
/// - without a session at app start: unsubscribed (devices that subscribed
///   while signed out with older builds stop receiving pushes);
/// - on sign-out (explicit, or a session Supabase could no longer refresh):
///   unsubscribed, the FCM token deleted, the local cache cleared.
///
/// The server side (topic name, payloads) is unchanged.
class SessionNotifications {
  SessionNotifications({
    required Future<void> Function(String topic) subscribe,
    required Future<void> Function(String topic) unsubscribe,
    required Future<void> Function() deleteToken,
    required Future<void> Function() clearCache,
    Logger? logger,
  }) : _subscribe = subscribe,
       _unsubscribe = unsubscribe,
       _deleteToken = deleteToken,
       _clearCache = clearCache,
       _logger = logger ?? Logger();

  /// The FCM topic the server sends internal notifications to.
  static const String topic = 'all_users';

  final Future<void> Function(String topic) _subscribe;
  final Future<void> Function(String topic) _unsubscribe;
  final Future<void> Function() _deleteToken;
  final Future<void> Function() _clearCache;
  final Logger _logger;

  StreamSubscription<AuthState>? _subscription;

  /// Wires the real FCM, Firebase and Hive dependencies.
  factory SessionNotifications.production() {
    return SessionNotifications(
      subscribe: FcmNotificationHandler.subscribeToTopic,
      unsubscribe: FcmNotificationHandler.unsubscribeFromTopic,
      deleteToken: () => FirebaseMessaging.instance.deleteToken(),
      clearCache: () => DependencyInjection.getIt<StorageService>().clearAll(),
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
    unawaited(handle(AuthChangeEvent.initialSession, currentSession));
    _subscription?.cancel();
    _subscription = authStateChanges.listen((state) {
      if (state.event == AuthChangeEvent.initialSession) return;
      unawaited(handle(state.event, state.session));
    }, onError: (Object e) => _logger.w('Auth state stream error: $e'));
  }

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
  }

  /// Reacts to one auth event. Each step is independent: a failing step is
  /// logged and the others still run.
  Future<void> handle(AuthChangeEvent event, Session? session) async {
    switch (event) {
      case AuthChangeEvent.initialSession:
        if (session != null) {
          await _run('subscribe', () => _subscribe(topic));
        } else {
          await _run('unsubscribe', () => _unsubscribe(topic));
        }
      case AuthChangeEvent.signedIn:
        await _run('subscribe', () => _subscribe(topic));
      case AuthChangeEvent.signedOut:
        await _run('unsubscribe', () => _unsubscribe(topic));
        await _run('deleteToken', _deleteToken);
        await _run('clearCache', _clearCache);
      case AuthChangeEvent.tokenRefreshed:
      case AuthChangeEvent.userUpdated:
      case AuthChangeEvent.passwordRecovery:
      case AuthChangeEvent.mfaChallengeVerified:
      // ignore: deprecated_member_use
      case AuthChangeEvent.userDeleted:
        break;
    }
  }

  Future<void> _run(String step, Future<void> Function() action) async {
    try {
      await action();
    } catch (e) {
      _logger.w('SessionNotifications: $step failed: $e');
    }
  }
}
