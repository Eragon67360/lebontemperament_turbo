import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../auth/data/services/auth_service.dart';
import '../../auth/presentation/providers/auth_provider.dart';

/// Supabase's minimum, and the website's (« Changer mon mot de passe »).
const kMinPasswordLength = 6;

enum PasswordChangeFailure {
  wrongCurrent,
  samePassword,
  weak,
  reauthenticate,
  network,
  server,
}

class PasswordChangeException implements Exception {
  const PasswordChangeException(this.failure);
  final PasswordChangeFailure failure;

  /// What the member reads. Never the raw error.
  String get message => switch (failure) {
    PasswordChangeFailure.wrongCurrent => 'Mot de passe actuel incorrect.',
    PasswordChangeFailure.samePassword =>
      'Le nouveau mot de passe doit être différent de l’ancien.',
    PasswordChangeFailure.weak =>
      'Ce mot de passe est trop simple. Choisissez-en un plus long, '
          'avec des lettres et des chiffres.',
    PasswordChangeFailure.reauthenticate =>
      'Par sécurité, déconnectez-vous puis reconnectez-vous, '
          'et réessayez juste après.',
    PasswordChangeFailure.network =>
      'Pas de connexion. Vérifiez votre réseau et réessayez.',
    PasswordChangeFailure.server =>
      'Le mot de passe n’a pas pu être changé. Réessayez dans quelques '
          'instants.',
  };

  @override
  String toString() => 'PasswordChangeException($failure)';
}

/// The form's own checks, before anything is sent: null when [next] and
/// [confirmation] can be saved.
String? newPasswordProblem(String next, String confirmation) {
  if (next.length < kMinPasswordLength) {
    return 'Au moins $kMinPasswordLength caractères.';
  }
  if (next != confirmation) {
    return 'Les deux mots de passe ne correspondent pas.';
  }
  return null;
}

/// Sorts an `updateUser` error from Supabase Auth.
PasswordChangeFailure classifyPasswordUpdateError(Object error) {
  if (error is AuthRetryableFetchException) {
    return PasswordChangeFailure.network;
  }
  if (error is AuthWeakPasswordException) return PasswordChangeFailure.weak;
  if (error is AuthException) {
    return switch (error.code) {
      'same_password' => PasswordChangeFailure.samePassword,
      'weak_password' => PasswordChangeFailure.weak,
      'reauthentication_needed' ||
      'reauthentication_not_valid' => PasswordChangeFailure.reauthenticate,
      _ => PasswordChangeFailure.server,
    };
  }
  return PasswordChangeFailure.server;
}

/// False for an account that only ever signed in with Google or Apple:
/// there is no current password to ask for, the member creates one.
bool hasPasswordSignIn(User? user) {
  final providers = user?.appMetadata['providers'];
  if (providers is! List) return true;
  return providers.contains('email');
}

final accountHasPasswordProvider = Provider<bool>(
  (ref) => hasPasswordSignIn(ref.watch(currentUserProvider)),
);

/// Profil › Mot de passe. The member's name is not theirs to change (the
/// association's roster owns it); their password is.
class PasswordService {
  PasswordService({GoTrueClient? auth}) : _authOverride = auth;

  final GoTrueClient? _authOverride;
  GoTrueClient get _auth => _authOverride ?? Supabase.instance.client.auth;

  /// Checks [current] (when the account has a password), then saves [next].
  /// Throws a [PasswordChangeException].
  Future<void> change({String? current, required String next}) async {
    if (current != null) {
      final email = _auth.currentUser?.email;
      if (email == null || email.isEmpty) {
        throw const PasswordChangeException(PasswordChangeFailure.server);
      }
      try {
        // Signing in again checks the password and gives a fresh session,
        // which Supabase asks for before a password change.
        await _auth.signInWithPassword(email: email, password: current);
      } catch (e) {
        throw PasswordChangeException(switch (classifySignInError(e)) {
          SignInFailure.invalidCredentials =>
            PasswordChangeFailure.wrongCurrent,
          SignInFailure.network => PasswordChangeFailure.network,
          _ => PasswordChangeFailure.server,
        });
      }
    }
    try {
      await _auth.updateUser(UserAttributes(password: next));
    } catch (e) {
      throw PasswordChangeException(classifyPasswordUpdateError(e));
    }
  }
}

final passwordServiceProvider = Provider<PasswordService>(
  (ref) => PasswordService(),
);
