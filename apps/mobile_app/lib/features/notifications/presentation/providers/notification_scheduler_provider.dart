import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/models/concert.dart';
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';
import 'notification_settings_provider.dart';

class NotificationSchedulerNotifier extends StateNotifier<void> {
  NotificationSchedulerNotifier(this.ref) : super(null);

  final Ref ref;
  DateTime? _lastSchedulingTime;

  Future<void> scheduleNotifications() async {
    try {
      // Add debounce to prevent too frequent scheduling
      final now = DateTime.now();
      if (_lastSchedulingTime != null &&
          now.difference(_lastSchedulingTime!).inSeconds < 5) {
        return; // Skip if last scheduling was less than 5 seconds ago
      }
      _lastSchedulingTime = now;

      final notificationService = ref.read(notificationServiceProvider);
      final settings = ref.read(notificationSettingsProvider);

      // Get concerts and rehearsals
      final concertsAsync = ref.read(realtimeConcertsProvider);
      final rehearsalsAsync = ref.read(realtimeRehearsalsProvider);

      List<Concert> concerts = [];
      List<Rehearsal> rehearsals = [];

      // Extract data from async values
      concertsAsync.whenData((data) => concerts = data);
      rehearsalsAsync.whenData((data) => rehearsals = data);

      // Schedule notifications
      await notificationService.scheduleEventNotifications(
        concerts,
        rehearsals,
        settings,
      );
    } catch (e) {
      // Handle error silently
    }
  }
}

final notificationSchedulerProvider =
    StateNotifierProvider<NotificationSchedulerNotifier, void>(
      (ref) => NotificationSchedulerNotifier(ref),
    );

// Provider that automatically schedules notifications when data changes
final autoScheduleNotificationsProvider = Provider<void>((ref) {
  // Watch for data changes to trigger scheduling
  final concertsAsync = ref.watch(realtimeConcertsProvider);
  final rehearsalsAsync = ref.watch(realtimeRehearsalsProvider);
  final settings = ref.watch(notificationSettingsProvider);

  // Schedule notifications when data is available and settings change
  if (concertsAsync.hasValue || rehearsalsAsync.hasValue) {
    // Use Future.microtask to avoid calling during build
    Future.microtask(() {
      ref.read(notificationSchedulerProvider.notifier).scheduleNotifications();
    });
  }
});
