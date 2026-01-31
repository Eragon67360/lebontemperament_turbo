import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';

/// Fetches the current user's profile and exposes role.
final userProfileProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final auth = ref.watch(authServiceProvider);
  return auth.getUserProfile();
});

/// True if the current user has role 'superadmin'.
final isSuperadminProvider = FutureProvider<bool>((ref) async {
  final profile = await ref.watch(userProfileProvider.future);
  final role = profile?['role'] as String?;
  return role == 'superadmin';
});
