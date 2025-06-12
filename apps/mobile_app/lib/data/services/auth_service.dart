import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../models/user.dart' as app_user;

class AuthService {
  final supabase.SupabaseClient _supabaseClient;
  final Logger _logger;

  AuthService({
    required supabase.SupabaseClient supabaseClient,
    required Logger logger,
  }) : _supabaseClient = supabaseClient,
       _logger = logger;

  // Get current user
  supabase.User? get currentUser => _supabaseClient.auth.currentUser;

  // Get current session
  supabase.Session? get currentSession => _supabaseClient.auth.currentSession;

  // Check if user is authenticated
  bool get isAuthenticated => currentUser != null;

  // Sign in with email and password
  Future<supabase.AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _supabaseClient.auth.signInWithPassword(
        email: email,
        password: password,
      );
      _logger.i('User signed in: ${response.user?.email}');
      return response;
    } catch (e) {
      _logger.e('Error signing in: $e');
      rethrow;
    }
  }

  // Sign up with email and password
  Future<supabase.AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    Map<String, dynamic>? data,
  }) async {
    try {
      final response = await _supabaseClient.auth.signUp(
        email: email,
        password: password,
        data: data,
      );
      _logger.i('User signed up: ${response.user?.email}');
      return response;
    } catch (e) {
      _logger.e('Error signing up: $e');
      rethrow;
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _supabaseClient.auth.signOut();
      _logger.i('User signed out');
    } catch (e) {
      _logger.e('Error signing out: $e');
      rethrow;
    }
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _supabaseClient.auth.resetPasswordForEmail(email);
      _logger.i('Password reset email sent to: $email');
    } catch (e) {
      _logger.e('Error resetting password: $e');
      rethrow;
    }
  }

  // Update user profile
  Future<supabase.UserResponse> updateProfile({
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await _supabaseClient.auth.updateUser(
        supabase.UserAttributes(
          data: {'first_name': firstName, 'last_name': lastName},
        ),
      );
      _logger.i('Profile updated for user: ${response.user?.email}');
      return response;
    } catch (e) {
      _logger.e('Error updating profile: $e');
      rethrow;
    }
  }

  // Get user profile from database
  Future<app_user.User?> getUserProfile(String userId) async {
    try {
      final response = await _supabaseClient
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();

      return app_user.User.fromJson(response);
    } catch (e) {
      _logger.e('Error fetching user profile: $e');
      return null;
    }
  }

  // Auth state changes stream
  Stream<supabase.AuthState> get authStateChanges =>
      _supabaseClient.auth.onAuthStateChange;
}
