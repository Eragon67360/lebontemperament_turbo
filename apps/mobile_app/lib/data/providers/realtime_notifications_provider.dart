import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';
import 'package:logger/logger.dart';
import '../services/realtime_service.dart';
import '../services/notification_service.dart';
import '../services/storage_service.dart';
import '../models/rehearsal.dart';
import '../models/event.dart';
import '../models/concert.dart';
import '../../features/notifications/presentation/providers/notification_settings_provider.dart';
import 'data_providers.dart';

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  return RealtimeService();
});

// notificationServiceProvider: use the one from notification_settings_provider

// Use the shared storage service provider from data_providers.dart
// final storageServiceProvider = Provider<StorageService>((ref) {
//   return StorageService(logger: Logger());
// });

// Use the persisted setting from notification settings
final realtimeNotificationsProvider = Provider<bool>((ref) {
  final settings = ref.watch(notificationSettingsProvider);
  return settings.realtimeEnabled;
});

final realtimeNotificationsControllerProvider =
    StateNotifierProvider<RealtimeNotificationsNotifier, bool>((ref) {
      final realtimeService = ref.watch(realtimeServiceProvider);
      final notificationService = ref.watch(notificationServiceProvider);
      final storageService = ref.watch(storageServiceProvider);
      final logger = Logger();

      return RealtimeNotificationsNotifier(
        realtimeService: realtimeService,
        notificationService: notificationService,
        storageService: storageService,
        logger: logger,
        ref: ref,
      );
    });

class RealtimeNotificationsNotifier extends StateNotifier<bool> {
  final RealtimeService _realtimeService;
  final NotificationService _notificationService;
  final StorageService _storageService;
  final Logger _logger;
  final Ref _ref;

  RealtimeNotificationsNotifier({
    required RealtimeService realtimeService,
    required NotificationService notificationService,
    required StorageService storageService,
    required Logger logger,
    required Ref ref,
  }) : _realtimeService = realtimeService,
       _notificationService = notificationService,
       _storageService = storageService,
       _logger = logger,
       _ref = ref,
       super(false);

  /// Start listening for real-time changes
  Future<bool> startListening() async {
    if (state) {
      _logger.w('Already listening for real-time changes');
      return true;
    }

    try {
      _logger.i('Starting real-time listening...');

      // Ensure storage service is initialized
      if (!_storageService.isInitialized) {
        _logger.i('Initializing storage service...');
        await _storageService.initialize();
      }

      // Initialize notification service if not already done
      await _notificationService.initialize();
      _logger.i('Notification service initialized');

      // Subscribe regardless of permissions - list updates work without them.
      // Push notifications are gated in callbacks by realtimeEnabled + hasPermissions.
      _logger.i('Subscribing to all channels...');

      // Subscribe to rehearsals changes
      _realtimeService.subscribeToRehearsals(
        onRehearsalAdded: _onRehearsalAdded,
        onRehearsalUpdated: _onRehearsalUpdated,
        onRehearsalDeleted: _onRehearsalDeleted,
      );

      // Subscribe to events changes
      _realtimeService.subscribeToEvents(
        onEventAdded: _onEventAdded,
        onEventUpdated: _onEventUpdated,
        onEventDeleted: _onEventDeleted,
      );

      // Subscribe to concerts changes
      _realtimeService.subscribeToConcerts(
        onConcertAdded: _onConcertAdded,
        onConcertUpdated: _onConcertUpdated,
        onConcertDeleted: _onConcertDeleted,
      );

      state = true;
      _logger.i(
        'Started listening for real-time changes (rehearsals, events, concerts)',
      );
      return true;
    } catch (e) {
      _logger.e('Error starting real-time listening: $e');
      return false;
    }
  }

  /// Stop listening for real-time changes
  void stopListening() {
    if (!state) {
      _logger.w('Not currently listening for real-time changes');
      return;
    }

    _realtimeService.unsubscribeFromRehearsals();
    _realtimeService.unsubscribeFromEvents();
    _realtimeService.unsubscribeFromConcerts();
    state = false;
    _logger.i('Stopped listening for real-time changes');
  }

  /// Trigger a refresh of all real-time providers
  void _triggerRefresh() {
    _ref.read(refreshTriggerProvider.notifier).state++;
    _logger.i('Triggered refresh of real-time providers');
  }

  /// Handle new rehearsal added (storage + refresh only; push is sent via FCM by DB trigger)
  void _onRehearsalAdded(Rehearsal rehearsal) async {
    _logger.i(
      '[Realtime] Rehearsal ADDED: id=${rehearsal.id}, name=${rehearsal.name}, '
      'date=${rehearsal.date}, place=${rehearsal.place}, startTime=${rehearsal.startTime}',
    );

    try {
      await _storageService.saveRehearsal(rehearsal);
      _logger.i(
        '[Realtime] Rehearsal added: saved to local storage (id=${rehearsal.id})',
      );

      _triggerRefresh();
    } catch (e) {
      _logger.e('[Realtime] Rehearsal added: error - $e');
    }
  }

  /// Handle rehearsal updated (storage + refresh only; push via FCM)
  void _onRehearsalUpdated(Rehearsal old, Rehearsal updated) async {
    _logger.i(
      '[Realtime] Rehearsal UPDATED: id=${updated.id}, name=${updated.name}',
    );

    try {
      _storageService.saveRehearsal(updated);
      _logger.i(
        '[Realtime] Rehearsal updated: saved to local storage (id=${updated.id})',
      );

      _triggerRefresh();
    } catch (e) {
      _logger.e('[Realtime] Rehearsal updated: error - $e');
    }
  }

  /// Handle rehearsal deleted (storage + refresh only; push via FCM)
  void _onRehearsalDeleted(Rehearsal rehearsal) async {
    _logger.i(
      '[Realtime] Rehearsal DELETED: id=${rehearsal.id}, name=${rehearsal.name}',
    );

    try {
      _storageService.deleteRehearsal(rehearsal.id);
      _logger.i(
        '[Realtime] Rehearsal deleted: removed from local storage (id=${rehearsal.id})',
      );

      _triggerRefresh();
    } catch (e) {
      _logger.e('[Realtime] Rehearsal deleted: error - $e');
    }
  }

  /// Handle new event added (storage + refresh only; push via FCM)
  void _onEventAdded(Event event) async {
    _logger.i('New event detected: ${event.title}');

    try {
      await _storageService.saveEvent(event);
      _logger.i('Saved new event to local storage: ${event.title}');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could also trigger other actions here, like:
      // - Send analytics
      // - etc.
    } catch (e) {
      _logger.e('Error handling new event: $e');
    }
  }

  /// Handle event updated (storage + refresh only; push via FCM)
  void _onEventUpdated(Event old, Event updated) async {
    _logger.i('Event updated: ${updated.title}');

    try {
      _storageService.saveEvent(updated);
      _logger.i('Updated event in local storage: ${updated.title}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling event update: $e');
    }
  }

  /// Handle event deleted (storage + refresh only; push via FCM)
  void _onEventDeleted(Event event) async {
    _logger.i('Event deleted: ${event.title}');

    try {
      _storageService.deleteEvent(event.id);
      _logger.i('Deleted event from local storage: ${event.id}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling event deletion: $e');
    }
  }

  /// Handle new concert added (storage + refresh only; push via FCM)
  void _onConcertAdded(Concert concert) async {
    _logger.i('New concert detected: ${concert.name}');

    try {
      await _storageService.saveConcert(concert);
      _logger.i('Saved new concert to local storage: ${concert.name}');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could also trigger other actions here, like:
      // - Send analytics
      // - etc.
    } catch (e) {
      _logger.e('Error handling new concert: $e');
    }
  }

  /// Handle concert updated (storage + refresh only; push via FCM)
  void _onConcertUpdated(Concert old, Concert updated) async {
    _logger.i('Concert updated: ${updated.name}');

    try {
      _storageService.saveConcert(updated);
      _logger.i('Updated concert in local storage: ${updated.name}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling concert update: $e');
    }
  }

  /// Handle concert deleted (storage + refresh only; push via FCM)
  void _onConcertDeleted(Concert concert) async {
    _logger.i('Concert deleted: ${concert.name}');

    try {
      _storageService.deleteConcert(concert.id);
      _logger.i('Deleted concert from local storage: ${concert.id}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling concert deletion: $e');
    }
  }

  /// Dispose resources
  @override
  void dispose() {
    stopListening();
    _realtimeService.dispose();
    super.dispose();
  }
}
