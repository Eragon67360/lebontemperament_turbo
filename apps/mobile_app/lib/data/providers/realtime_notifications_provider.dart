import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import '../services/realtime_service.dart';
import '../services/notification_service.dart';
import '../models/rehearsal.dart';
import '../../features/notifications/presentation/providers/notification_settings_provider.dart';

final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  return RealtimeService();
});

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

// Use the persisted setting from notification settings
final realtimeNotificationsProvider = Provider<bool>((ref) {
  final settings = ref.watch(notificationSettingsProvider);
  return settings.realtimeEnabled;
});

final realtimeNotificationsControllerProvider =
    StateNotifierProvider<RealtimeNotificationsNotifier, bool>((ref) {
      final realtimeService = ref.watch(realtimeServiceProvider);
      final notificationService = ref.watch(notificationServiceProvider);
      final logger = Logger();

      return RealtimeNotificationsNotifier(
        realtimeService: realtimeService,
        notificationService: notificationService,
        logger: logger,
        ref: ref,
      );
    });

class RealtimeNotificationsNotifier extends StateNotifier<bool> {
  final RealtimeService _realtimeService;
  final NotificationService _notificationService;
  final Logger _logger;
  final Ref _ref;

  RealtimeNotificationsNotifier({
    required RealtimeService realtimeService,
    required NotificationService notificationService,
    required Logger logger,
    required Ref ref,
  }) : _realtimeService = realtimeService,
       _notificationService = notificationService,
       _logger = logger,
       _ref = ref,
       super(false) {
    // Initialize based on persisted setting
    _initializeFromSettings();
  }

  void _initializeFromSettings() {
    final settings = _ref.read(notificationSettingsProvider);
    if (settings.realtimeEnabled && !state) {
      startListening();
    } else if (!settings.realtimeEnabled && state) {
      stopListening();
    }
  }

  /// Start listening for real-time changes
  Future<bool> startListening() async {
    if (state) {
      _logger.w('Already listening for real-time changes');
      return true;
    }

    try {
      _logger.i('Starting real-time listening...');

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

      _logger.i('Permissions confirmed, subscribing to rehearsals...');

      // Subscribe to rehearsals changes
      _realtimeService.subscribeToRehearsals(
        onRehearsalAdded: _onRehearsalAdded,
        onRehearsalUpdated: _onRehearsalUpdated,
        onRehearsalDeleted: _onRehearsalDeleted,
      );

      state = true;
      _logger.i('Started listening for real-time rehearsal changes');
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
    state = false;
    _logger.i('Stopped listening for real-time rehearsal changes');
  }

  /// Handle new rehearsal added
  void _onRehearsalAdded(Rehearsal rehearsal) async {
    _logger.i('New rehearsal detected: ${rehearsal.name}');

    try {
      // Show immediate notification
      await _notificationService.showRehearsalAddedNotification(rehearsal);

      // You could also trigger other actions here, like:
      // - Update local cache
      // - Refresh UI
      // - Send analytics
      // - etc.
    } catch (e) {
      _logger.e('Error handling new rehearsal: $e');
    }
  }

  /// Handle rehearsal updated
  void _onRehearsalUpdated(Rehearsal rehearsal) {
    _logger.i('Rehearsal updated: ${rehearsal.name}');
    // You could implement update notifications here if needed
  }

  /// Handle rehearsal deleted
  void _onRehearsalDeleted(String rehearsalId) {
    _logger.i('Rehearsal deleted: $rehearsalId');
    // You could implement deletion notifications here if needed
  }

  /// Dispose resources
  @override
  void dispose() {
    stopListening();
    _realtimeService.dispose();
    super.dispose();
  }
}
