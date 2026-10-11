import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../../../../data/models/notification_settings.dart';
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/my_groups_provider.dart';
import '../../../../data/services/notification_service.dart';

class NotificationSettingsNotifier extends StateNotifier<NotificationSettings> {
  NotificationSettingsNotifier() : super(const NotificationSettings()) {
    _loadSettings();
  }

  static const String _settingsKey = 'notification_settings';

  /// The settings saved on this phone, or the defaults.
  static Future<NotificationSettings> readStored() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final settingsJson = prefs.getString(_settingsKey);
      if (settingsJson == null) return const NotificationSettings();
      return NotificationSettings.fromJson(
        json.decode(settingsJson) as Map<String, dynamic>,
      );
    } catch (e) {
      return const NotificationSettings();
    }
  }

  Future<void> _loadSettings() async {
    state = await readStored();
  }

  Future<void> _saveSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final settingsJson = json.encode(state.toJson());
      await prefs.setString(_settingsKey, settingsJson);
    } catch (e) {
      // Handle save error
    }
  }

  Future<void> toggleEnabled() async {
    state = state.copyWith(enabled: !state.enabled);
    await _saveSettings();
  }

  Future<void> setEnabled(bool value) async {
    state = state.copyWith(enabled: value);
    await _saveSettings();
  }

  Future<void> toggleConcertsEnabled() async {
    state = state.copyWith(concertsEnabled: !state.concertsEnabled);
    await _saveSettings();
  }

  Future<void> toggleRehearsalsEnabled() async {
    state = state.copyWith(rehearsalsEnabled: !state.rehearsalsEnabled);
    await _saveSettings();
  }

  Future<void> toggleRehearsalChangesEnabled() async {
    state = state.copyWith(
      rehearsalChangesEnabled: !state.rehearsalChangesEnabled,
    );
    await _saveSettings();
  }

  Future<void> toggleRealtimeEnabled() async {
    state = state.copyWith(realtimeEnabled: !state.realtimeEnabled);
    await _saveSettings();
  }

  Future<void> setRealtimeEnabled(bool value) async {
    state = state.copyWith(realtimeEnabled: value);
    await _saveSettings();
  }

  Future<void> toggleNotificationTime(NotificationTime time) async {
    final newTimes = List<NotificationTime>.from(state.selectedTimes);

    if (newTimes.contains(time)) {
      newTimes.remove(time);
    } else {
      newTimes.add(time);
    }

    // Sort times from longest to shortest duration
    newTimes.sort((a, b) => b.duration.compareTo(a.duration));

    state = state.copyWith(selectedTimes: newTimes);
    await _saveSettings();
  }

  Future<void> setSelectedTimes(List<NotificationTime> times) async {
    // Sort times from longest to shortest duration
    times.sort((a, b) => b.duration.compareTo(a.duration));

    state = state.copyWith(selectedTimes: times);
    await _saveSettings();
  }

  bool isTimeSelected(NotificationTime time) {
    return state.selectedTimes.contains(time);
  }
}

final notificationSettingsProvider =
    StateNotifierProvider<NotificationSettingsNotifier, NotificationSettings>(
      (ref) => NotificationSettingsNotifier(),
    );

/// The rehearsal groups whose pushes this phone listens to: those of the
/// member's ensembles, none when « Changements de l'agenda › Répétitions » is off.
final rehearsalPushGroupsProvider = Provider<Set<GroupType>>((ref) {
  final wanted = ref.watch(
    notificationSettingsProvider.select((s) => s.rehearsalChangesEnabled),
  );
  return wanted ? ref.watch(myRehearsalGroupsProvider) : const {};
});

/// The same, read from the phone's preferences before Riverpod runs.
Future<Set<GroupType>> readRehearsalPushGroups(
  Future<Set<GroupType>> Function() myGroups,
) async {
  final settings = await NotificationSettingsNotifier.readStored();
  if (!settings.rehearsalChangesEnabled) return const {};
  return groupsConcerning(await myGroups());
}

/// Remembers that the member answered (or skipped) the explanatory
/// notification screen, so a signed-out cold start goes straight to the
/// login instead of asking again every time.
class NotificationPermissionPrompt {
  static const String _answeredKey = 'notification_permission_answered';

  static Future<bool> wasAnswered() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_answeredKey) ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> markAnswered() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_answeredKey, true);
    } catch (_) {
      // Asking once more on the next start is the only consequence.
    }
  }
}

final notificationServiceProvider = Provider<NotificationService>(
  (ref) => NotificationService(),
);
