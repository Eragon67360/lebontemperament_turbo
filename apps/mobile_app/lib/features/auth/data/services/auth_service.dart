import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:flutter/services.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:logger/logger.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/config/dependency_injection.dart';
import '../../../../core/config/supabase_config.dart';
import '../../../../data/services/session_notifications.dart';

final _authLogger = Logger();

/// Why a sign-in failed, so the screen can say the right thing: a wrong
/// password is not a tunnel, and a tunnel is not a server outage.
enum SignInFailure { invalidCredentials, notMember, network, server }

class SignInException implements Exception {
  final SignInFailure failure;
  const SignInException(this.failure);

  /// What the member reads. Never the raw error.
  String get message => switch (failure) {
    SignInFailure.invalidCredentials => 'E-mail ou mot de passe incorrect.',
    SignInFailure.notMember =>
      'Ce compte n\'est relié à aucun membre. Utilisez l\'adresse e-mail '
          'que vous avez donnée à l\'association.',
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
    // Sign-ups are closed: a Google or Apple account whose e-mail matches no
    // member is refused before any account is created.
    if (error.code == 'signup_disabled') return SignInFailure.notMember;
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

/// Where Supabase sends the browser back after Google: the app's own
/// scheme, caught by the sign-in sheet (ASWebAuthenticationSession on iOS,
/// flutter_web_auth_2's CallbackActivity on Android). Must be listed in
/// Supabase › Authentication › URL Configuration › Redirect URLs.
const oauthCallbackScheme = 'com.lebontemperament.app';
const oauthRedirectUrl = '$oauthCallbackScheme://login-callback';

/// What the browser came back with: a PKCE code to exchange, or an error
/// code (`signup_disabled` when the account matches no member). Supabase puts
/// errors in the query or in the fragment, so both are read.
({String? code, String? error}) parseOAuthCallback(String url) {
  final uri = Uri.parse(url);
  final params = {
    ...uri.queryParameters,
    if (uri.fragment.isNotEmpty) ...Uri.splitQueryString(uri.fragment),
  };
  final code = params['code'];
  return (
    code: (code == null || code.isEmpty) ? null : code,
    error: params['error_code'] ?? params['error'],
  );
}

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

  /// « Continuer avec Google », on Android and iOS: the same Supabase Google
  /// provider as the website, opened in the system's sign-in sheet. Returns
  /// false when the member closes the sheet. Throws a [SignInException].
  Future<bool> signInWithGoogle() async {
    try {
      final oauth = await _client.auth.getOAuthSignInUrl(
        provider: OAuthProvider.google,
        redirectTo: oauthRedirectUrl,
        // Members with several Google accounts pick the right one.
        queryParams: const {'prompt': 'select_account'},
      );
      final String result;
      try {
        result = await FlutterWebAuth2.authenticate(
          url: oauth.url,
          callbackUrlScheme: oauthCallbackScheme,
        );
      } on PlatformException catch (e) {
        if (e.code == 'CANCELED') return false;
        rethrow;
      }
      final callback = parseOAuthCallback(result);
      if (callback.code == null) {
        _authLogger.w('AuthService Google callback error: ${callback.error}');
        throw SignInException(
          callback.error == 'signup_disabled'
              ? SignInFailure.notMember
              : SignInFailure.server,
        );
      }
      await _client.auth.exchangeCodeForSession(callback.code!);
      await _ensureMember();
      return true;
    } on SignInException {
      rethrow;
    } catch (e) {
      throw _socialFailure('Google', e);
    }
  }

  /// « Continuer avec Apple », iOS only: Apple's native sheet, then its ID
  /// token goes to the Supabase Apple provider. Returns false when the
  /// member cancels. Throws a [SignInException].
  Future<bool> signInWithApple() async {
    try {
      final rawNonce = _client.auth.generateRawNonce();
      final AuthorizationCredentialAppleID credential;
      try {
        credential = await SignInWithApple.getAppleIDCredential(
          scopes: const [AppleIDAuthorizationScopes.email],
          nonce: sha256.convert(utf8.encode(rawNonce)).toString(),
        );
      } on SignInWithAppleAuthorizationException catch (e) {
        if (e.code == AuthorizationErrorCode.canceled) return false;
        rethrow;
      }
      final idToken = credential.identityToken;
      if (idToken == null) {
        throw const SignInException(SignInFailure.server);
      }
      await _client.auth.signInWithIdToken(
        provider: OAuthProvider.apple,
        idToken: idToken,
        nonce: rawNonce,
      );
      await _ensureMember();
      return true;
    } on SignInException {
      rethrow;
    } catch (e) {
      throw _socialFailure('Apple', e);
    }
  }

  /// Same rule as the website's /auth/callback: a session without a
  /// `profiles` row is not a member's, so it is closed at once.
  Future<void> _ensureMember() async {
    final userId = currentUser?.id;
    Map<String, dynamic>? profile;
    try {
      profile = userId == null
          ? null
          : await _client
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .maybeSingle();
    } catch (e) {
      await _signOutQuietly();
      rethrow;
    }
    if (profile == null) {
      await _signOutQuietly();
      throw const SignInException(SignInFailure.notMember);
    }
  }

  SignInException _socialFailure(String provider, Object error) {
    final failure = classifySignInError(error);
    _authLogger.w(
      'AuthService $provider sign-in failed ($failure): ${error.runtimeType}',
    );
    return SignInException(
      // A wrong password does not exist here: a 400 is the provider's refusal.
      failure == SignInFailure.invalidCredentials
          ? SignInFailure.server
          : failure,
    );
  }

  Future<void> _signOutQuietly() async {
    try {
      await _client.auth.signOut();
    } catch (_) {}
  }

  // Sign out
  Future<void> signOut() async {
    // While the session still exists: the server only lets a member remove
    // their own phone from the alerts list (#364).
    final getIt = DependencyInjection.getIt;
    if (getIt.isRegistered<SessionNotifications>()) {
      await getIt<SessionNotifications>().beforeSignOut();
    }
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
