import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/config/supabase_config.dart';

final _authLogger = Logger();

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

  // Sign in with email and password
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
        throw Exception('Connexion échouée');
      }

      // Log backend (Supabase Auth) response for debugging display name
      final u = response.user!;
      _authLogger.i(
        'AuthService signIn response from backend: id=${u.id}, email=${u.email}, '
        'userMetadata=${u.userMetadata}, '
        'display_name=${u.userMetadata?['display_name']}, '
        'full_name=${u.userMetadata?['full_name']}',
      );

      return response;
    } catch (e) {
      throw Exception('Erreur de connexion: ${e.toString()}');
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

      _authLogger.i(
        'AuthService getUserProfile response from database: $response',
      );
      return response;
    } catch (e) {
      _authLogger.w('AuthService getUserProfile failed (profile may not exist): $e');
      return null;
    }
  }
}
