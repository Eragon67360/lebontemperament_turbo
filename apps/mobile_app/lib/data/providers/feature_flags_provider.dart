import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

import '../services/feature_flags_service.dart';
import 'app_info_provider.dart';

final featureFlagsServiceProvider = Provider<FeatureFlagsService>((ref) {
  return FeatureFlagsService(logger: Logger());
});

/// The app's flags, read once per launch (the home screen watches it on its
/// first build). Never errors: an unreadable table means [MobileFlags.none].
final mobileFlagsProvider = FutureProvider<MobileFlags>((ref) async {
  return ref.watch(featureFlagsServiceProvider).getFlags();
});

/// True when `mobile_min_version` is enabled and newer than the installed
/// version: the home screen advises an update (never blocks).
final updateAdvisedProvider = FutureProvider<bool>((ref) async {
  final flags = await ref.watch(mobileFlagsProvider.future);
  final minVersion = flags.minVersion;
  if (minVersion == null) return false;
  try {
    final info = await ref.watch(packageInfoProvider.future);
    return isVersionBelow(info.version, minVersion);
  } catch (_) {
    return false;
  }
});
