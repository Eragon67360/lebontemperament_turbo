import 'package:flutter_riverpod/flutter_riverpod.dart';
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

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

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
  })  : _realtimeService = realtimeService,
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

      // Check and request permissions
      final hasPermissions = await _notificationService.hasPermissions();
      _logger.i('Initial permission check result: $hasPermissions');

      if (!hasPermissions) {
        _logger.i('Requesting notification permissions...');
        final granted = await _notificationService.requestPermissions();
        _logger.i('Permission request result: $granted');

        if (!granted) {
          _logger.w('Notification permissions not granted by user');
          return false;
        }

        // Check permissions again after request
        final finalPermissionCheck =
            await _notificationService.hasPermissions();
        _logger.i(
          'Final permission check after request: $finalPermissionCheck',
        );

        if (!finalPermissionCheck) {
          _logger.w('Permissions still not available after request');
          return false;
        }
      }

      _logger.i('Permissions confirmed, subscribing to all channels...');

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

  static bool _rehearsalTimeOrPlaceChanged(Rehearsal old, Rehearsal updated) {
    return old.place != updated.place ||
        old.date != updated.date ||
        old.startTime != updated.startTime ||
        old.endTime != updated.endTime;
  }

  static bool _eventTimeOrPlaceChanged(Event old, Event updated) {
    return old.location != updated.location ||
        old.dateFrom != updated.dateFrom ||
        old.dateTo != updated.dateTo ||
        old.time != updated.time;
  }

  static bool _concertTimeOrPlaceChanged(Concert old, Concert updated) {
    return old.place != updated.place ||
        old.date != updated.date ||
        old.time != updated.time;
  }

  /// Handle new rehearsal added
  void _onRehearsalAdded(Rehearsal rehearsal) async {
    _logger.i(
      '[Realtime] Rehearsal ADDED: id=${rehearsal.id}, name=${rehearsal.name}, '
      'date=${rehearsal.date}, place=${rehearsal.place}, startTime=${rehearsal.startTime}',
    );

    try {
      await _notificationService.showRehearsalAddedNotification(rehearsal);
      _logger.i(
          '[Realtime] Rehearsal added: notification sent for ${rehearsal.name}');

      await _storageService.saveRehearsal(rehearsal);
      _logger.i(
          '[Realtime] Rehearsal added: saved to local storage (id=${rehearsal.id})');

      _triggerRefresh();
    } catch (e) {
      _logger.e('[Realtime] Rehearsal added: error - $e');
    }
  }

  /// Handle rehearsal updated
  void _onRehearsalUpdated(Rehearsal old, Rehearsal updated) async {
    final timeOrPlaceChanged = _rehearsalTimeOrPlaceChanged(old, updated);
    _logger.i(
      '[Realtime] Rehearsal UPDATED: id=${updated.id}, name=${updated.name}, '
      'timeOrPlaceChanged=$timeOrPlaceChanged',
    );
    if (timeOrPlaceChanged) {
      _logger.i(
        '[Realtime] Rehearsal updated: changes - place ${old.place}->${updated.place}, '
        'date ${old.date}->${updated.date}, startTime ${old.startTime}->${updated.startTime}, '
        'endTime ${old.endTime}->${updated.endTime}',
      );
    }

    try {
      if (timeOrPlaceChanged) {
        await _notificationService.showRehearsalUpdatedNotification(updated);
        _logger.i(
            '[Realtime] Rehearsal updated: notification sent for ${updated.name}');
      }

      _storageService.saveRehearsal(updated);
      _logger.i(
          '[Realtime] Rehearsal updated: saved to local storage (id=${updated.id})');

      _triggerRefresh();
    } catch (e) {
      _logger.e('[Realtime] Rehearsal updated: error - $e');
    }
  }

  /// Handle rehearsal deleted
  void _onRehearsalDeleted(Rehearsal rehearsal) async {
    _logger.i(
      '[Realtime] Rehearsal DELETED: id=${rehearsal.id}, name=${rehearsal.name}, '
      'date=${rehearsal.date}, place=${rehearsal.place}',
    );

    try {
      await _notificationService.showRehearsalDeletedNotification(rehearsal);
      _logger.i(
          '[Realtime] Rehearsal deleted: notification sent for ${rehearsal.name}');

      _storageService.deleteRehearsal(rehearsal.id);
      _logger.i(
          '[Realtime] Rehearsal deleted: removed from local storage (id=${rehearsal.id})');

      _triggerRefresh();
    } catch (e) {
      _logger.e('[Realtime] Rehearsal deleted: error - $e');
    }
  }

  /// Handle new event added
  void _onEventAdded(Event event) async {
    _logger.i('New event detected: ${event.title}');

    try {
      // Show immediate notification
      await _notificationService.showEventAddedNotification(event);

      // Save to local storage
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

  /// Handle event updated
  void _onEventUpdated(Event old, Event updated) async {
    _logger.i('Event updated: ${updated.title}');

    try {
      if (_eventTimeOrPlaceChanged(old, updated)) {
        await _notificationService.showEventUpdatedNotification(updated);
      }

      _storageService.saveEvent(updated);
      _logger.i('Updated event in local storage: ${updated.title}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling event update: $e');
    }
  }

  /// Handle event deleted
  void _onEventDeleted(Event event) async {
    _logger.i('Event deleted: ${event.title}');

    try {
      await _notificationService.showEventDeletedNotification(event);
      _storageService.deleteEvent(event.id);
      _logger.i('Deleted event from local storage: ${event.id}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling event deletion: $e');
    }
  }

  /// Handle new concert added
  void _onConcertAdded(Concert concert) async {
    _logger.i('New concert detected: ${concert.name}');

    try {
      // Show immediate notification
      await _notificationService.showConcertAddedNotification(concert);

      // Save to local storage
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

  /// Handle concert updated
  void _onConcertUpdated(Concert old, Concert updated) async {
    _logger.i('Concert updated: ${updated.name}');

    try {
      if (_concertTimeOrPlaceChanged(old, updated)) {
        await _notificationService.showConcertUpdatedNotification(updated);
      }

      _storageService.saveConcert(updated);
      _logger.i('Updated concert in local storage: ${updated.name}');
      _triggerRefresh();
    } catch (e) {
      _logger.e('Error handling concert update: $e');
    }
  }

  /// Handle concert deleted
  void _onConcertDeleted(Concert concert) async {
    _logger.i('Concert deleted: ${concert.name}');

    try {
      await _notificationService.showConcertDeletedNotification(concert);
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
