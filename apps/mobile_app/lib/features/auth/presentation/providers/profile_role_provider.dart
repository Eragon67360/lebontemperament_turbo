import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_provider.dart';

/// True if the current user has role 'superadmin'.
final isSuperadminProvider = FutureProvider<bool>((ref) async {
  final profile = await ref.watch(userProfileProvider.future);
  final role = profile?['role'] as String?;
  return role == 'superadmin';
});
