import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/models/rehearsal.dart';

/// What the welcome tour remembers on this phone: whether it was seen, the
/// ensemble the member picked (the calendar opens on it) and the one-time
/// tips already dismissed.
///
/// Every read and write is best effort: if the preferences can't be read the
/// tour and tips simply stay hidden, and the app works as before.
class WelcomePrefs {
  WelcomePrefs._();

  static const tourSeenKey = 'welcome_tour_seen_v1';
  static const myGroupKey = 'welcome_my_group';
  static const _tipPrefix = 'first_time_tip_';

  /// `null` when the preferences can't be read (no tour then).
  static Future<bool?> tourSeen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(tourSeenKey) ?? false;
    } catch (_) {
      return null;
    }
  }

  static Future<void> markTourSeen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(tourSeenKey, true);
    } catch (_) {}
  }

  /// The ensemble picked in the tour, or `null` for « everything ».
  static Future<GroupType?> myGroup() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final name = prefs.getString(myGroupKey);
      if (name == null) return null;
      for (final g in GroupType.values) {
        if (g.name == name) return g;
      }
    } catch (_) {}
    return null;
  }

  static Future<void> setMyGroup(GroupType? group) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (group == null) {
        await prefs.remove(myGroupKey);
      } else {
        await prefs.setString(myGroupKey, group.name);
      }
    } catch (_) {}
  }

  /// `null` when the preferences can't be read (the tip stays hidden).
  static Future<bool?> tipSeen(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('$_tipPrefix$id') ?? false;
    } catch (_) {
      return null;
    }
  }

  static Future<void> markTipSeen(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('$_tipPrefix$id', true);
    } catch (_) {}
  }

  /// Replaying the tour shows the tips again too.
  static Future<void> resetTips() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final key in prefs.getKeys().toList()) {
        if (key.startsWith(_tipPrefix)) await prefs.remove(key);
      }
    } catch (_) {}
  }
}
