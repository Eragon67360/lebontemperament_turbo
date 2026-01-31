import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import '../../../../data/models/notification_settings.dart';
import '../../../../data/services/notification_service.dart';

class NotificationSettingsNotifier extends StateNotifier<NotificationSettings> {
  NotificationSettingsNotifier() : super(const NotificationSettings()) {
    _loadSettings();
  }

  static const String _settingsKey = 'notification_settings';

  Future<void> _loadSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final settingsJson = prefs.getString(_settingsKey);

      if (settingsJson != null) {
        final settingsMap = json.decode(settingsJson) as Map<String, dynamic>;
        state = NotificationSettings.fromJson(settingsMap);
      }
    } catch (e) {
      // Use default settings if loading fails
      state = const NotificationSettings();
    }
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

  Future<void> toggleConcertsEnabled() async {
    state = state.copyWith(concertsEnabled: !state.concertsEnabled);
    await _saveSettings();
  }

  Future<void> toggleRehearsalsEnabled() async {
    state = state.copyWith(rehearsalsEnabled: !state.rehearsalsEnabled);
    await _saveSettings();
  }

  Future<void> toggleRealtimeEnabled() async {
    state = state.copyWith(realtimeEnabled: !state.realtimeEnabled);
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

final notificationServiceProvider = Provider<NotificationService>(
  (ref) => NotificationService(),
);
