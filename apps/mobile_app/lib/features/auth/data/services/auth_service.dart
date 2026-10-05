import 'dart:async';
import 'dart:io';

import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/config/supabase_config.dart';

final _authLogger = Logger();

/// Why a sign-in failed, so the screen can say the right thing: a wrong
/// password is not a tunnel, and a tunnel is not a server outage.
enum SignInFailure { invalidCredentials, network, server }

class SignInException implements Exception {
  final SignInFailure failure;
  const SignInException(this.failure);

  /// What the member reads. Never the raw error.
  String get message => switch (failure) {
    SignInFailure.invalidCredentials => 'E-mail ou mot de passe incorrect.',
    SignInFailure.network =>
      'Pas de connexion. Vérifiez votre réseau et réessayez.',
    SignInFailure.server =>
      'Le service de connexion ne répond pas. Réessayez dans quelques '
          'instants.',
  };

  @override
  String toString() => 'SignInException($failure)';
}

/// Sorts a `signInWithPassword` error: Supabase answers a wrong e-mail or
/// password with 400 `invalid_credentials`; the fetch layer wraps a network
/// failure in [AuthRetryableFetchException]; anything else is the server.
SignInFailure classifySignInError(Object error) {
  if (error is AuthRetryableFetchException) return SignInFailure.network;
  if (error is AuthApiException) {
    if (error.code == 'invalid_credentials' ||
        error.statusCode == '400' ||
        error.statusCode == '401') {
      return SignInFailure.invalidCredentials;
    }
    return SignInFailure.server;
  }
  if (error is SocketException ||
      error is TimeoutException ||
      error is HttpException) {
    return SignInFailure.network;
  }
  return SignInFailure.server;
}

/// The website's « Mot de passe oublié » page. The app does not call
/// `resetPasswordForEmail` itself: the Flutter client uses the PKCE flow, so
/// the e-mail link would carry a code only this app could exchange, while
/// the link opens the website's /auth/update-password page. Started from the
/// website, the whole flow stays in the browser and completes.
Uri forgotPasswordUri() =>
    Uri.parse('${AppConfig.siteUrl}/auth/reset-password');

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  SupabaseClient get _client => SupabaseConfig.client;

  // Get current user
  User? get currentUser => _client.auth.currentUser;

  // Get current session
  Session? get currentSession => _client.auth.currentSession;

  // Check if user is authenticated
  bool get isAuthenticated => currentUser != null;

  // Stream of auth state changes
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  // Sign in with email and password. Throws a [SignInException].
  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user == null) {
        throw const SignInException(SignInFailure.invalidCredentials);
      }

      return response;
    } on SignInException {
      rethrow;
    } catch (e) {
      final failure = classifySignInError(e);
      // The raw error may quote the e-mail: log the type only.
      _authLogger.w('AuthService signIn failed ($failure): ${e.runtimeType}');
      throw SignInException(failure);
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } catch (e) {
      throw Exception('Erreur lors de la déconnexion: ${e.toString()}');
    }
  }

  // Get user profile (database profiles table)
  Future<Map<String, dynamic>?> getUserProfile() async {
    if (currentUser == null) return null;

    try {
      final response = await _client
          .from('profiles')
          .select()
          .eq('id', currentUser!.id)
          .single();

      // Never log the row: it holds the member's personal data (#362).
      return response;
    } catch (e) {
      _authLogger.w(
        'AuthService getUserProfile failed (profile may not exist): $e',
      );
      return null;
    }
  }
}
