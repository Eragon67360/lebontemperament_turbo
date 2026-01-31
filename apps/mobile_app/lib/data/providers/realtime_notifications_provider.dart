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
        final finalPermissionCheck = await _notificationService
            .hasPermissions();
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

  /// Handle new rehearsal added
  void _onRehearsalAdded(Rehearsal rehearsal) async {
    _logger.i('New rehearsal detected: ${rehearsal.name}');

    try {
      // Show immediate notification
      await _notificationService.showRehearsalAddedNotification(rehearsal);

      // Save to local storage
      await _storageService.saveRehearsal(rehearsal);
      _logger.i('Saved new rehearsal to local storage: ${rehearsal.name}');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could also trigger other actions here, like:
      // - Send analytics
      // - etc.
    } catch (e) {
      _logger.e('Error handling new rehearsal: $e');
    }
  }

  /// Handle rehearsal updated
  void _onRehearsalUpdated(Rehearsal rehearsal) {
    _logger.i('Rehearsal updated: ${rehearsal.name}');

    try {
      // Update in local storage
      _storageService.saveRehearsal(rehearsal);
      _logger.i('Updated rehearsal in local storage: ${rehearsal.name}');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could implement update notifications here if needed
    } catch (e) {
      _logger.e('Error handling rehearsal update: $e');
    }
  }

  /// Handle rehearsal deleted
  void _onRehearsalDeleted(String rehearsalId) {
    _logger.i('Rehearsal deleted: $rehearsalId');

    try {
      // Delete from local storage
      _storageService.deleteRehearsal(rehearsalId);
      _logger.i('Deleted rehearsal from local storage: $rehearsalId');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could implement deletion notifications here if needed
    } catch (e) {
      _logger.e('Error handling rehearsal deletion: $e');
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
  void _onEventUpdated(Event event) {
    _logger.i('Event updated: ${event.title}');

    try {
      // Update in local storage
      _storageService.saveEvent(event);
      _logger.i('Updated event in local storage: ${event.title}');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could implement update notifications here if needed
    } catch (e) {
      _logger.e('Error handling event update: $e');
    }
  }

  /// Handle event deleted
  void _onEventDeleted(String eventId) {
    _logger.i('Event deleted: $eventId');

    try {
      // Delete from local storage
      _storageService.deleteEvent(eventId);
      _logger.i('Deleted event from local storage: $eventId');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could implement deletion notifications here if needed
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
  void _onConcertUpdated(Concert concert) {
    _logger.i('Concert updated: ${concert.name}');

    try {
      // Update in local storage
      _storageService.saveConcert(concert);
      _logger.i('Updated concert in local storage: ${concert.name}');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could implement update notifications here if needed
    } catch (e) {
      _logger.e('Error handling concert update: $e');
    }
  }

  /// Handle concert deleted
  void _onConcertDeleted(String concertId) {
    _logger.i('Concert deleted: $concertId');

    try {
      // Delete from local storage
      _storageService.deleteConcert(concertId);
      _logger.i('Deleted concert from local storage: $concertId');

      // Trigger refresh of providers
      _triggerRefresh();

      // You could implement deletion notifications here if needed
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
