import 'package:shared_preferences/shared_preferences.dart';

import '../../../data/models/rehearsal.dart';

/// What the welcome tour remembers on this phone: whether it was seen, the
/// ensembles the member picked (the home screen, the calendar and the
/// reminders follow them) and the one-time tips already dismissed.
///
/// Every read and write is best effort: if the preferences can't be read the
/// tour and tips simply stay hidden, and the app works as before.
class WelcomePrefs {
  WelcomePrefs._();

  static const tourSeenKey = 'welcome_tour_seen_v1';
  static const myGroupsKey = 'welcome_my_groups';

  /// Before 2.0.137 the tour kept a single ensemble.
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

  /// The ensembles picked in the tour or in Profil › Mes ensembles; empty
  /// for « everything ». A choice made before several were allowed (one
  /// ensemble under [myGroupKey]) still counts.
  static Future<Set<GroupType>> myGroups() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final names =
          prefs.getStringList(myGroupsKey) ??
          [if (prefs.getString(myGroupKey) case final String name) name];
      return {
        for (final g in GroupType.values)
          if (names.contains(g.name)) g,
      };
    } catch (_) {
      return const {};
    }
  }

  static Future<void> setMyGroups(Set<GroupType> groups) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(myGroupsKey, [for (final g in groups) g.name]);
      await prefs.remove(myGroupKey);
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
