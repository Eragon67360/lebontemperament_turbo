import 'package:shared_preferences/shared_preferences.dart';

/// The visitor's « Prochains concerts » switch in « À propos » (#593): on by
/// default, kept on the phone only. While it is on and nobody is signed in,
/// the phone listens to the public concert topic
/// ([SessionNotifications.publicTopic]): the announcement of each concert and
/// a reminder two days before.
class PublicConcertNotifications {
  static const String _key = 'public_concert_notifications';

  static Future<bool> isEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_key) ?? true;
  }

  static Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_key, enabled);
  }
}
