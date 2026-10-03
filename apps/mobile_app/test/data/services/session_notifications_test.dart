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

  late final SessionNotifications notifications = SessionNotifications(
    subscribe: (topic) async {
      if (failSubscribe) throw Exception('no network');
      calls.add('subscribe:$topic');
    },
    unsubscribe: (topic) async => calls.add('unsubscribe:$topic'),
    deleteToken: () async => calls.add('deleteToken'),
    clearCache: () async => calls.add('clearCache'),
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
    expect(signedIn.calls, ['subscribe:all_users']);

    final signedOut = _Recorder();
    await signedOut.notifications.handle(AuthChangeEvent.initialSession, null);
    expect(signedOut.calls, ['unsubscribe:all_users']);
  });

  test('subscribes on sign-in', () async {
    final r = _Recorder();
    await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
    expect(r.calls, ['subscribe:all_users']);
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
    expect(r.calls, isEmpty);
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
      'unsubscribe:all_users',
      'deleteToken',
      'clearCache',
    ]);
    await r.notifications.dispose();
  });
}
