import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../data/services/auth_service.dart';
import '../../../../core/config/app_router.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});

final authStateProvider = StreamProvider<AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.authStateChanges;
});

final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.when(
    data: (authState) => authState.session?.user,
    loading: () => null,
    error: (_, __) => null,
  );
});

/// Profile from database (profiles table). Fetched when user is logged in.
final userProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final user = ref.watch(currentUserProvider);
  if (user == null) return null;
  final authService = ref.watch(authServiceProvider);
  return authService.getUserProfile();
});

/// Display name: profile.display_name first, then auth userMetadata, then fallback.
final displayNameProvider = Provider<String>((ref) {
  final user = ref.watch(currentUserProvider);
  final profileAsync = ref.watch(userProfileProvider);
  final fromProfile = profileAsync.value?['display_name']?.toString();
  if (fromProfile != null && fromProfile.trim().isNotEmpty) {
    return fromProfile.trim();
  }
  final fromAuth = user?.userMetadata?['display_name']?.toString();
  if (fromAuth != null && fromAuth.trim().isNotEmpty) {
    return fromAuth.trim();
  }
  return 'Utilisateur';
});

/// Profile picture URL: profile.profile_picture_url first, then auth avatar_url (Google).
final profilePictureUrlProvider = Provider<String?>((ref) {
  final profileAsync = ref.watch(userProfileProvider);
  final fromProfile =
      profileAsync.value?['profile_picture_url']?.toString();
  if (fromProfile != null && fromProfile.trim().isNotEmpty) {
    return fromProfile.trim();
  }
  final user = ref.watch(currentUserProvider);
  final fromAuth = user?.userMetadata?['avatar_url']?.toString();
  if (fromAuth != null && fromAuth.trim().isNotEmpty) {
    return fromAuth.trim();
  }
  return null;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  final user = ref.watch(currentUserProvider);
  return user != null;
});

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<void>>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthController(authService, ref);
});

class AuthController extends StateNotifier<AsyncValue<void>> {
  final AuthService _authService;
  final Ref _ref;

  AuthController(this._authService, this._ref)
      : super(const AsyncValue.data(null));

  Future<void> signIn(String email, String password) async {
    try {
      state = const AsyncValue.loading();

      await _authService.signInWithEmail(email: email, password: password);

      state = const AsyncValue.data(null);

      // Force a refresh of the auth state
      _ref.invalidate(authStateProvider);

      // Notify the router that auth state has changed
      AuthStateListener().notifyAuthStateChanged();
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      state = const AsyncValue.loading();

      await _authService.signOut();

      state = const AsyncValue.data(null);

      // Force a refresh of the auth state
      _ref.invalidate(authStateProvider);

      // Notify the router that auth state has changed
      AuthStateListener().notifyAuthStateChanged();
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      rethrow;
    }
  }
}
