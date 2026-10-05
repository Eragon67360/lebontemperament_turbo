import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../../data/models/concert.dart';
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';
import 'notification_settings_provider.dart';

/// Runs an action at most once per [window], trailing: a call inside the
/// window is not dropped but deferred to the end of it (the latest call
/// wins), so the last settings or data change is always applied.
class TrailingDebouncer {
  TrailingDebouncer(this.window);

  final Duration window;

  /// Runs while the window opened by the last run is still open.
  Timer? _window;
  void Function()? _pending;

  void call(void Function() action) {
    if (_window != null) {
      _pending = action;
      return;
    }
    _run(action);
  }

  void _run(void Function() action) {
    _pending = null;
    _window = Timer(window, () {
      _window = null;
      final pending = _pending;
      if (pending != null) _run(pending);
    });
    action();
  }

  void dispose() {
    _window?.cancel();
    _window = null;
    _pending = null;
  }
}

class NotificationSchedulerNotifier extends StateNotifier<void> {
  NotificationSchedulerNotifier(this.ref) : super(null);

  final Ref ref;
  final _debouncer = TrailingDebouncer(const Duration(seconds: 5));

  Future<void> scheduleNotifications() async {
    // Debounce: the scheduler is called on mount, on every data change and
    // on every resume, often within the same second.
    _debouncer(_scheduleNow);
  }

  Future<void> _scheduleNow() async {
    try {
      final notificationService = ref.read(notificationServiceProvider);
      final settings = ref.read(notificationSettingsProvider);

      // Get concerts and rehearsals
      final concertsAsync = ref.read(realtimeConcertsProvider);
      final rehearsalsAsync = ref.read(realtimeRehearsalsProvider);

      List<Concert> concerts = [];
      List<Rehearsal> rehearsals = [];

      // Extract data from async values
      concertsAsync.whenData((data) => concerts = data.items);
      rehearsalsAsync.whenData((data) => rehearsals = data.items);

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

  @override
  void dispose() {
    _debouncer.dispose();
    super.dispose();
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
  ref.watch(notificationSettingsProvider); // Rebuild when settings change

  // Schedule notifications when data is available and settings change
  if (concertsAsync.hasValue || rehearsalsAsync.hasValue) {
    // Use Future.microtask to avoid calling during build
    Future.microtask(() {
      ref.read(notificationSchedulerProvider.notifier).scheduleNotifications();
    });
  }
});
