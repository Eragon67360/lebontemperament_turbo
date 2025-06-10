import 'package:flutter_riverpod/flutter_riverpod.dart';
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
