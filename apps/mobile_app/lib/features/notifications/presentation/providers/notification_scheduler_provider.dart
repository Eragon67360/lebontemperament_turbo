import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/models/notification_settings.dart';
import '../../../../data/models/concert.dart';
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../../data/services/notification_service.dart';
import 'notification_settings_provider.dart';

class NotificationSchedulerNotifier extends StateNotifier<void> {
  NotificationSchedulerNotifier(this.ref) : super(null);

  final Ref ref;

  Future<void> scheduleNotifications() async {
    try {
      final notificationService = ref.read(notificationServiceProvider);
      final settings = ref.read(notificationSettingsProvider);

      // Get concerts and rehearsals
      final concertsAsync = ref.read(concertsProvider);
      final rehearsalsAsync = ref.read(rehearsalsProvider);

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
  final concertsAsync = ref.watch(concertsProvider);
  final rehearsalsAsync = ref.watch(rehearsalsProvider);
  final settings = ref.watch(notificationSettingsProvider);

  // Schedule notifications when data is available and settings change
  if (concertsAsync.hasValue || rehearsalsAsync.hasValue) {
    ref.read(notificationSchedulerProvider.notifier).scheduleNotifications();
  }
});
