import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Row keys in `feature_flags` read by the app (#361). The owner creates
/// them from the Supabase dashboard; see the README.
const kMaintenanceFlagKey = 'mobile_maintenance';
const kMinVersionFlagKey = 'mobile_min_version';

/// What the app learned from `feature_flags` at startup.
class MobileFlags {
  /// `mobile_maintenance.is_enabled`: show the maintenance banner.
  final bool maintenance;

  /// `mobile_min_version.description` while that row `is_enabled`, e.g.
  /// `2.1.0`. Null when the row is absent, disabled or not a version.
  final String? minVersion;

  const MobileFlags({this.maintenance = false, this.minVersion});

  /// What the app assumes when the table cannot be read: nothing to show.
  static const none = MobileFlags();
}

/// Reads the app's own feature flags. Never throws: a failed read (offline,
/// RLS, missing rows) means "no flag", so the flags can only add a banner,
/// never block the app.
class FeatureFlagsService {
  final Future<List<Map<String, dynamic>>> Function() _fetchRows;
  final Logger _logger;

  FeatureFlagsService({
    Future<List<Map<String, dynamic>>> Function()? fetchRows,
    Logger? logger,
  }) : _fetchRows = fetchRows ?? _fetchFromSupabase,
       _logger = logger ?? Logger();

  static Future<List<Map<String, dynamic>>> _fetchFromSupabase() {
    return Supabase.instance.client
        .from('feature_flags')
        .select('flag_key, is_enabled, description')
        .inFilter('flag_key', [kMaintenanceFlagKey, kMinVersionFlagKey]);
  }

  Future<MobileFlags> getFlags() async {
    try {
      final rows = await _fetchRows();
      var maintenance = false;
      String? minVersion;
      for (final row in rows) {
        final enabled = row['is_enabled'] == true;
        switch (row['flag_key']) {
          case kMaintenanceFlagKey:
            maintenance = enabled;
          case kMinVersionFlagKey:
            final value = (row['description'] as String?)?.trim();
            if (enabled && value != null && parseVersion(value) != null) {
              minVersion = value;
            }
        }
      }
      return MobileFlags(maintenance: maintenance, minVersion: minVersion);
    } catch (e) {
      _logger.w('feature_flags unreadable, assuming no flag: $e');
      return MobileFlags.none;
    }
  }
}

/// `2.0.117`, `2.0.117+133` or `v2.1` as numeric parts (`2.1` is `[2, 1]`);
/// null when any part is not a number.
List<int>? parseVersion(String version) {
  var core = version.trim();
  if (core.startsWith('v')) core = core.substring(1);
  final plus = core.indexOf('+');
  if (plus >= 0) core = core.substring(0, plus);
  if (core.isEmpty) return null;
  final parts = <int>[];
  for (final part in core.split('.')) {
    final n = int.tryParse(part);
    if (n == null) return null;
    parts.add(n);
  }
  return parts;
}

/// True when [current] is older than [minimum]; false when either does not
/// parse (an unreadable flag must not nag anyone).
bool isVersionBelow(String current, String minimum) {
  final a = parseVersion(current);
  final b = parseVersion(minimum);
  if (a == null || b == null) return false;
  final length = a.length > b.length ? a.length : b.length;
  for (var i = 0; i < length; i++) {
    final x = i < a.length ? a[i] : 0;
    final y = i < b.length ? b[i] : 0;
    if (x != y) return x < y;
  }
  return false;
}
