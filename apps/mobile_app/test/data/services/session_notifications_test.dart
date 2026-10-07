import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/services/session_notifications.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// A session with obviously fake values; only its presence matters here.
Session _fakeSession() => Session.fromJson({
  'access_token': 'test-access-token',
  'token_type': 'bearer',
  'expires_in': 3600,
  'refresh_token': 'test-refresh-token',
  'user': {
    'id': '00000000-0000-4000-8000-000000000000',
    'aud': 'authenticated',
    'email': 'member@example.com',
    'app_metadata': <String, dynamic>{},
    'user_metadata': <String, dynamic>{},
    'created_at': '2020-01-01T00:00:00Z',
  },
})!;

class _Recorder {
  final calls = <String>[];
  bool failSubscribe = false;
  bool failRegister = false;
  String? token = 'fcm-test-token';
  final refreshes = StreamController<String>.broadcast();

  late final SessionNotifications notifications = SessionNotifications(
    subscribe: (topic) async {
      if (failSubscribe) throw Exception('no network');
      calls.add('subscribe:$topic');
    },
    unsubscribe: (topic) async => calls.add('unsubscribe:$topic'),
    deleteToken: () async => calls.add('deleteToken'),
    clearCache: () async => calls.add('clearCache'),
    readToken: () async => token,
    tokenRefreshes: refreshes.stream,
    registerDevice: (token) async {
      if (failRegister) throw Exception('function not deployed');
      calls.add('register:$token');
    },
    unregisterDevice: (token) async => calls.add('unregister:$token'),
    logger: Logger(level: Level.off),
  );
}

void main() {
  test('subscribes at app start only when a session exists', () async {
    final signedIn = _Recorder();
    await signedIn.notifications.handle(
      AuthChangeEvent.initialSession,
      _fakeSession(),
    );
    expect(signedIn.calls, ['subscribe:all_users', 'register:fcm-test-token']);

    final signedOut = _Recorder();
    await signedOut.notifications.handle(AuthChangeEvent.initialSession, null);
    expect(signedOut.calls, ['unsubscribe:all_users']);
  });

  test('subscribes and registers the phone on sign-in', () async {
    final r = _Recorder();
    await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
    expect(r.calls, ['subscribe:all_users', 'register:fcm-test-token']);
  });

  test(
    'registers nothing without a token (iPhone without permission)',
    () async {
      final r = _Recorder()..token = null;
      await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
      expect(r.calls, ['subscribe:all_users']);
    },
  );

  test('a failing registration does not block the sign-in steps', () async {
    final r = _Recorder()..failRegister = true;
    await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
    expect(r.calls, ['subscribe:all_users']);
  });

  test('beforeSignOut unregisters the current token', () async {
    final r = _Recorder();
    await r.notifications.beforeSignOut();
    expect(r.calls, ['unregister:fcm-test-token']);

    final none = _Recorder()..token = null;
    await none.notifications.beforeSignOut();
    expect(none.calls, isEmpty);
  });

  test('a rotated token is registered only while signed in', () async {
    final r = _Recorder();
    final auth = StreamController<AuthState>();
    addTearDown(auth.close);
    r.notifications.bind(
      currentSession: _fakeSession(),
      authStateChanges: auth.stream,
    );
    await Future<void>.delayed(Duration.zero);
    r.calls.clear();

    r.refreshes.add('fcm-rotated-token');
    await Future<void>.delayed(Duration.zero);
    expect(r.calls, ['register:fcm-rotated-token']);

    auth.add(const AuthState(AuthChangeEvent.signedOut, null));
    await Future<void>.delayed(Duration.zero);
    r.calls.clear();
    r.refreshes.add('fcm-after-sign-out');
    await Future<void>.delayed(Duration.zero);
    expect(r.calls, isEmpty);
    await r.notifications.dispose();
  });

  test(
    'on sign-out: unsubscribes, deletes the token, clears the cache',
    () async {
      final r = _Recorder();
      await r.notifications.handle(AuthChangeEvent.signedOut, null);
      expect(r.calls, ['unsubscribe:all_users', 'deleteToken', 'clearCache']);
    },
  );

  test('ignores token refreshes and profile updates', () async {
    final r = _Recorder();
    await r.notifications.handle(
      AuthChangeEvent.tokenRefreshed,
      _fakeSession(),
    );
    await r.notifications.handle(AuthChangeEvent.userUpdated, _fakeSession());
    expect(r.calls, isEmpty);
  });

  test('a failing step does not block the others', () async {
    final r = _Recorder()..failSubscribe = true;
    await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
    expect(r.calls, ['register:fcm-test-token']);
    r.calls.clear();
    await r.notifications.handle(AuthChangeEvent.signedOut, null);
    expect(r.calls, ['unsubscribe:all_users', 'deleteToken', 'clearCache']);
  });

  test('bind applies the current session, then follows the stream', () async {
    final r = _Recorder();
    final controller = StreamController<AuthState>();
    addTearDown(controller.close);

    r.notifications.bind(
      currentSession: null,
      authStateChanges: controller.stream,
    );
    await Future<void>.delayed(Duration.zero);
    expect(r.calls, ['unsubscribe:all_users']);

    // The stream's own initialSession is ignored (already applied above).
    controller.add(const AuthState(AuthChangeEvent.initialSession, null));
    controller.add(AuthState(AuthChangeEvent.signedIn, _fakeSession()));
    controller.add(const AuthState(AuthChangeEvent.signedOut, null));
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);

    expect(r.calls, [
      'unsubscribe:all_users',
      'subscribe:all_users',
      'register:fcm-test-token',
      'unsubscribe:all_users',
      'deleteToken',
      'clearCache',
    ]);
    await r.notifications.dispose();
  });
}
