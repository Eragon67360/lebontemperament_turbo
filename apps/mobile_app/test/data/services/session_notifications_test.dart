import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
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

  /// The visitor's « Prochains concerts » switch (on by default).
  bool publicWanted = true;

  /// The rehearsal groups concerning the member: a woman of the choir.
  Set<GroupType> groups = {
    GroupType.femmes,
    GroupType.choeurComplet,
    GroupType.tous,
  };
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
    publicConcertsWanted: () async => publicWanted,
    rehearsalGroups: () async => groups,
    logger: Logger(level: Level.off),
  );
}

/// The member topics of a woman of the choir, then leaving the topic older
/// apps listened to for everything.
const _womanTopics = [
  'subscribe:members',
  'unsubscribe:rehearsals_orchestre',
  'unsubscribe:rehearsals_hommes',
  'subscribe:rehearsals_femmes',
  'unsubscribe:rehearsals_jeunesEnfants',
  'subscribe:rehearsals_choeurComplet',
  'subscribe:rehearsals_tous',
  'unsubscribe:all_users',
];

/// Leaving every member topic.
const _leaveMemberTopics = [
  'unsubscribe:all_users',
  'unsubscribe:members',
  'unsubscribe:rehearsals_orchestre',
  'unsubscribe:rehearsals_hommes',
  'unsubscribe:rehearsals_femmes',
  'unsubscribe:rehearsals_jeunesEnfants',
  'unsubscribe:rehearsals_choeurComplet',
  'unsubscribe:rehearsals_tous',
];

void main() {
  test('subscribes at app start only when a session exists', () async {
    final signedIn = _Recorder();
    await signedIn.notifications.handle(
      AuthChangeEvent.initialSession,
      _fakeSession(),
    );
    expect(signedIn.calls, [
      'unsubscribe:public_concerts',
      ..._womanTopics,
      'register:fcm-test-token',
    ]);

    // A visitor listens to the public concert topic instead (#593).
    final signedOut = _Recorder();
    await signedOut.notifications.handle(AuthChangeEvent.initialSession, null);
    expect(signedOut.calls, [
      ..._leaveMemberTopics,
      'subscribe:public_concerts',
    ]);
  });

  test('subscribes and registers the phone on sign-in', () async {
    final r = _Recorder();
    await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
    expect(r.calls, [
      'unsubscribe:public_concerts',
      ..._womanTopics,
      'register:fcm-test-token',
    ]);
  });

  test(
    'registers nothing without a token (iPhone without permission)',
    () async {
      final r = _Recorder()..token = null;
      await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
      expect(r.calls, ['unsubscribe:public_concerts', ..._womanTopics]);
    },
  );

  test('a failing registration does not block the sign-in steps', () async {
    final r = _Recorder()..failRegister = true;
    await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
    expect(r.calls, ['unsubscribe:public_concerts', ..._womanTopics]);
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

  test('on sign-out: unsubscribes, deletes the token, clears the cache, '
      'then listens to the public concerts like any visitor', () async {
    final r = _Recorder();
    await r.notifications.handle(AuthChangeEvent.signedOut, null);
    expect(r.calls, [
      ..._leaveMemberTopics,
      'deleteToken',
      'clearCache',
      'subscribe:public_concerts',
    ]);
  });

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
    // Without its new topics, the phone stays on the one older apps use,
    // which still brings every push.
    expect(r.calls, [
      'unsubscribe:public_concerts',
      'unsubscribe:rehearsals_orchestre',
      'unsubscribe:rehearsals_hommes',
      'unsubscribe:rehearsals_jeunesEnfants',
      'register:fcm-test-token',
    ]);
    r.calls.clear();
    await r.notifications.handle(AuthChangeEvent.signedOut, null);
    expect(r.calls, [..._leaveMemberTopics, 'deleteToken', 'clearCache']);
  });

  test('bind applies the current session, then follows the stream', () async {
    final r = _Recorder();
    final controller = StreamController<AuthState>();
    addTearDown(controller.close);

    r.notifications.bind(
      currentSession: null,
      authStateChanges: controller.stream,
    );
    await pumpEventQueue();
    expect(r.calls, [..._leaveMemberTopics, 'subscribe:public_concerts']);

    // The stream's own initialSession is ignored (already applied above).
    controller.add(const AuthState(AuthChangeEvent.initialSession, null));
    controller.add(AuthState(AuthChangeEvent.signedIn, _fakeSession()));
    controller.add(const AuthState(AuthChangeEvent.signedOut, null));
    await pumpEventQueue();

    expect(r.calls, [
      ..._leaveMemberTopics,
      'subscribe:public_concerts',
      'unsubscribe:public_concerts',
      ..._womanTopics,
      'register:fcm-test-token',
      ..._leaveMemberTopics,
      'deleteToken',
      'clearCache',
      'subscribe:public_concerts',
    ]);
    await r.notifications.dispose();
  });

  group('rehearsal groups', () {
    test('a change of ensembles moves the phone to their topics', () async {
      final r = _Recorder();
      await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
      r.calls.clear();
      await r.notifications.rehearsalGroupsChanged({
        GroupType.hommes,
        GroupType.choeurComplet,
        GroupType.tous,
      });
      expect(r.calls, [
        'subscribe:members',
        'unsubscribe:rehearsals_orchestre',
        'subscribe:rehearsals_hommes',
        'unsubscribe:rehearsals_femmes',
        'unsubscribe:rehearsals_jeunesEnfants',
        'subscribe:rehearsals_choeurComplet',
        'subscribe:rehearsals_tous',
        'unsubscribe:all_users',
      ]);
    });

    test('the latest ensembles are kept for the next sign-in', () async {
      final r = _Recorder();
      await r.notifications.rehearsalGroupsChanged({GroupType.orchestre});
      expect(r.calls, isEmpty, reason: 'a visitor has no rehearsal topic');
      await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
      expect(r.calls, [
        'unsubscribe:public_concerts',
        'subscribe:members',
        'subscribe:rehearsals_orchestre',
        'unsubscribe:rehearsals_hommes',
        'unsubscribe:rehearsals_femmes',
        'unsubscribe:rehearsals_jeunesEnfants',
        'unsubscribe:rehearsals_choeurComplet',
        'unsubscribe:rehearsals_tous',
        'unsubscribe:all_users',
        'register:fcm-test-token',
      ]);
    });

    test('unreadable ensembles mean every rehearsal', () async {
      final calls = <String>[];
      final notifications = SessionNotifications(
        subscribe: (topic) async => calls.add('subscribe:$topic'),
        unsubscribe: (topic) async => calls.add('unsubscribe:$topic'),
        deleteToken: () async {},
        clearCache: () async {},
        readToken: () async => null,
        tokenRefreshes: const Stream.empty(),
        registerDevice: (_) async {},
        unregisterDevice: (_) async {},
        rehearsalGroups: () async => throw Exception('no preferences'),
        logger: Logger(level: Level.off),
      );
      await notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
      expect(calls, [
        'unsubscribe:public_concerts',
        'subscribe:members',
        for (final g in GroupType.values)
          'subscribe:${SessionNotifications.rehearsalTopic(g)}',
        'unsubscribe:all_users',
      ]);
    });
  });

  group('« Prochains concerts » (#593)', () {
    test('switched off: the visitor leaves the public topic', () async {
      final r = _Recorder()..publicWanted = false;
      await r.notifications.handle(AuthChangeEvent.initialSession, null);
      expect(r.calls, [..._leaveMemberTopics, 'unsubscribe:public_concerts']);
    });

    test('the switch applies at once for a visitor', () async {
      final r = _Recorder();
      await r.notifications.handle(AuthChangeEvent.initialSession, null);
      r.calls.clear();
      r.publicWanted = false;
      await r.notifications.publicConcertsChanged();
      expect(r.calls, ['unsubscribe:public_concerts']);
      r.publicWanted = true;
      await r.notifications.publicConcertsChanged();
      expect(r.calls, [
        'unsubscribe:public_concerts',
        'subscribe:public_concerts',
      ]);
    });

    test('a member stays off the public topic whatever the switch', () async {
      final r = _Recorder();
      await r.notifications.handle(AuthChangeEvent.signedIn, _fakeSession());
      r.calls.clear();
      await r.notifications.publicConcertsChanged();
      expect(r.calls, isEmpty);
    });
  });
}
