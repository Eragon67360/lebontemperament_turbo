import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/auth/data/services/auth_service.dart';
import 'package:lebontemperament/features/auth/presentation/providers/auth_provider.dart';
import 'package:lebontemperament/features/auth/presentation/screens/login_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Login failures used to all read « Email ou mot de passe incorrect »,
/// even in a tunnel; and a failed token refresh used to log the member out
/// of the UI while Supabase still held their session.
void main() {
  group('classifySignInError', () {
    test('a 400 invalid_credentials answer is the member\'s typo', () {
      expect(
        classifySignInError(
          AuthApiException(
            'Invalid login credentials',
            statusCode: '400',
            code: 'invalid_credentials',
          ),
        ),
        SignInFailure.invalidCredentials,
      );
    });

    test('a fetch failure is the network', () {
      expect(
        classifySignInError(
          AuthRetryableFetchException(message: 'SocketException'),
        ),
        SignInFailure.network,
      );
      expect(
        classifySignInError(const SocketException('no route')),
        SignInFailure.network,
      );
    });

    test('a 5xx answer or an unknown error is the server', () {
      expect(
        classifySignInError(
          AuthApiException('Internal error', statusCode: '500'),
        ),
        SignInFailure.server,
      );
      expect(classifySignInError(StateError('?')), SignInFailure.server);
    });

    test('each failure has its own French sentence', () {
      final messages = SignInFailure.values
          .map((f) => SignInException(f).message)
          .toSet();
      expect(messages.length, SignInFailure.values.length);
      expect(
        const SignInException(SignInFailure.invalidCredentials).message,
        'E-mail ou mot de passe incorrect.',
      );
      expect(
        const SignInException(SignInFailure.network).message,
        contains('connexion'),
      );
    });
  });

  group('isValidEmail', () {
    test('accepts long TLDs and + tags', () {
      expect(isValidEmail('membre+choeur@example.museum'), isTrue);
      expect(isValidEmail('prenom.nom@sous.domaine.fr'), isTrue);
      expect(isValidEmail('  membre@example.fr '), isTrue);
    });

    test('rejects the obvious typos', () {
      expect(isValidEmail('membre'), isFalse);
      expect(isValidEmail('membre@'), isFalse);
      expect(isValidEmail('membre@example'), isFalse);
      expect(isValidEmail('mem bre@example.fr'), isFalse);
    });
  });

  test('forgotPasswordUri points at the website\'s reset page', () {
    final uri = forgotPasswordUri();
    expect(uri.scheme, 'https');
    expect(uri.host, 'www.lebontemperament.com');
    expect(uri.path, '/auth/reset-password');
  });

  group('resolveCurrentUser', () {
    final persisted = User(
      id: 'user-test-0001',
      appMetadata: const {},
      userMetadata: const {},
      aud: 'authenticated',
      createdAt: '2026-01-01T00:00:00Z',
    );

    test('a stream error keeps the user Supabase still holds', () {
      final user = resolveCurrentUser(
        AsyncValue<AuthState>.error(
          AuthRetryableFetchException(message: 'offline'),
          StackTrace.empty,
        ),
        () => persisted,
      );
      expect(user?.id, persisted.id);
    });

    test('before the first event, the persisted session counts', () {
      expect(
        resolveCurrentUser(const AsyncValue.loading(), () => persisted)?.id,
        persisted.id,
      );
      expect(resolveCurrentUser(const AsyncValue.loading(), () => null), null);
    });

    test('a signed-out event wins over the persisted user', () {
      final user = resolveCurrentUser(
        const AsyncValue.data(AuthState(AuthChangeEvent.signedOut, null)),
        () => persisted,
      );
      expect(user, isNull);
    });
  });
}
