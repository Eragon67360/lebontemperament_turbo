import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:logger/logger.dart';

import '../models/notification_settings.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  final Logger _logger = Logger();

  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    // Initialize timezone
    tz.initializeTimeZones();

    // Initialize notifications
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initializationSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    _isInitialized = true;
    _logger.i('Notification service initialized');
  }

  Future<bool> requestPermissions() async {
    try {
      final status = await Permission.notification.request();
      _logger.i('Notification permission status: $status');

      // For Android 12+, also request exact alarm permission
      if (status.isGranted) {
        try {
          // This will open system settings for exact alarms on Android 12+
          await _notifications
              .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin
              >()
              ?.requestExactAlarmsPermission();
        } catch (e) {
          _logger.w('Could not request exact alarm permission: $e');
        }
      }

      return status.isGranted;
    } catch (e) {
      _logger.e('Error requesting notification permissions: $e');
      return false;
    }
  }

  Future<bool> hasPermissions() async {
    try {
      final status = await Permission.notification.status;
      return status.isGranted;
    } catch (e) {
      _logger.e('Error checking notification permissions: $e');
      return false;
    }
  }

  void _onNotificationTapped(NotificationResponse response) {
    _logger.i('Notification tapped: ${response.payload}');
    // TODO: Navigate to specific event/rehearsal detail
  }

  Future<void> scheduleEventNotifications(
    List<Concert> concerts,
    List<Rehearsal> rehearsals,
    NotificationSettings settings,
  ) async {
    if (!settings.enabled) {
      _logger.i('Notifications disabled, skipping scheduling');
      return;
    }

    // Cancel existing notifications
    await cancelAllNotifications();

    // Schedule concert notifications
    if (settings.concertsEnabled) {
      for (final concert in concerts) {
        await _scheduleConcertNotifications(concert, settings);
      }
    }

    // Schedule rehearsal notifications
    if (settings.rehearsalsEnabled) {
      for (final rehearsal in rehearsals) {
        await _scheduleRehearsalNotifications(rehearsal, settings);
      }
    }

    _logger.i(
      'Scheduled notifications for ${concerts.length} concerts and ${rehearsals.length} rehearsals',
    );
  }

  Future<void> _scheduleConcertNotifications(
    Concert concert,
    NotificationSettings settings,
  ) async {
    try {
      final eventDateTime = _parseEventDateTime(concert.date, concert.time);
      if (eventDateTime == null) return;

      for (final notificationTime in settings.selectedTimes) {
        final scheduledTime = eventDateTime.subtract(notificationTime.duration);

        // Only schedule if the time hasn't passed
        if (scheduledTime.isAfter(DateTime.now())) {
          await _scheduleNotification(
            id: _generateNotificationId(
              'concert',
              concert.id,
              notificationTime,
            ),
            title: 'Concert à venir',
            body: '${concert.name} dans ${notificationTime.displayName}',
            scheduledDate: scheduledTime,
            payload: 'concert_${concert.id}',
          );
        }
      }
    } catch (e) {
      _logger.e('Error scheduling concert notifications: $e');
    }
  }

  Future<void> _scheduleRehearsalNotifications(
    Rehearsal rehearsal,
    NotificationSettings settings,
  ) async {
    try {
      final eventDateTime = _parseEventDateTime(
        rehearsal.date,
        rehearsal.startTime,
      );
      if (eventDateTime == null) return;

      for (final notificationTime in settings.selectedTimes) {
        final scheduledTime = eventDateTime.subtract(notificationTime.duration);

        // Only schedule if the time hasn't passed
        if (scheduledTime.isAfter(DateTime.now())) {
          await _scheduleNotification(
            id: _generateNotificationId(
              'rehearsal',
              rehearsal.id,
              notificationTime,
            ),
            title: 'Répétition à venir',
            body: '${rehearsal.name} dans ${notificationTime.displayName}',
            scheduledDate: scheduledTime,
            payload: 'rehearsal_${rehearsal.id}',
          );
        }
      }
    } catch (e) {
      _logger.e('Error scheduling rehearsal notifications: $e');
    }
  }

  Future<void> _scheduleNotification({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
    String? payload,
  }) async {
    try {
      await _notifications.zonedSchedule(
        id,
        title,
        body,
        tz.TZDateTime.from(scheduledDate, tz.local),
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'event_reminders',
            'Rappels d\'événements',
            channelDescription:
                'Notifications pour les concerts et répétitions',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: payload,
      );

      _logger.i(
        'Scheduled notification: $title at ${scheduledDate.toIso8601String()}',
      );
    } catch (e) {
      // Handle exact alarm permission error on Android 12+
      if (e.toString().contains('exact_alarms_not_permitted')) {
        _logger.w('Exact alarms not permitted, trying with inexact scheduling');
        try {
          await _notifications.zonedSchedule(
            id,
            title,
            body,
            tz.TZDateTime.from(scheduledDate, tz.local),
            const NotificationDetails(
              android: AndroidNotificationDetails(
                'event_reminders',
                'Rappels d\'événements',
                channelDescription:
                    'Notifications pour les concerts et répétitions',
                importance: Importance.high,
                priority: Priority.high,
              ),
              iOS: DarwinNotificationDetails(
                presentAlert: true,
                presentBadge: true,
                presentSound: true,
              ),
            ),
            androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
            payload: payload,
          );
          _logger.i(
            'Scheduled notification with inexact timing: $title at ${scheduledDate.toIso8601String()}',
          );
        } catch (fallbackError) {
          _logger.e(
            'Error scheduling notification with fallback: $fallbackError',
          );
        }
      } else {
        _logger.e('Error scheduling notification: $e');
      }
    }
  }

  DateTime? _parseEventDateTime(String? date, String? time) {
    try {
      if (date == null) return null;

      final dateTime = DateTime.parse(date);

      if (time != null && time.isNotEmpty) {
        final timeParts = time.split(':');
        if (timeParts.length >= 2) {
          return DateTime(
            dateTime.year,
            dateTime.month,
            dateTime.day,
            int.parse(timeParts[0]),
            int.parse(timeParts[1]),
          );
        }
      }

      return dateTime;
    } catch (e) {
      _logger.e('Error parsing event datetime: $e');
      return null;
    }
  }

  int _generateNotificationId(
    String type,
    String eventId,
    NotificationTime notificationTime,
  ) {
    // Create a unique ID based on event type, ID, and notification time
    final hash = '$type-$eventId-${notificationTime.name}'.hashCode;
    return hash.abs();
  }

  Future<void> cancelAllNotifications() async {
    try {
      await _notifications.cancelAll();
      _logger.i('Cancelled all notifications');
    } catch (e) {
      _logger.e('Error cancelling notifications: $e');
    }
  }

  Future<void> cancelEventNotifications(String eventId) async {
    try {
      // Cancel all notifications for this event
      for (final notificationTime in NotificationTime.values) {
        final concertId = _generateNotificationId(
          'concert',
          eventId,
          notificationTime,
        );
        final rehearsalId = _generateNotificationId(
          'rehearsal',
          eventId,
          notificationTime,
        );

        await _notifications.cancel(concertId);
        await _notifications.cancel(rehearsalId);
      }

      _logger.i('Cancelled notifications for event: $eventId');
    } catch (e) {
      _logger.e('Error cancelling event notifications: $e');
    }
  }

  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    try {
      return await _notifications.pendingNotificationRequests();
    } catch (e) {
      _logger.e('Error getting pending notifications: $e');
      return [];
    }
  }

  /// Check if notifications can be shown
  Future<bool> canShowNotifications() async {
    try {
      final permissionsGranted = await hasPermissions();
      if (!permissionsGranted) {
        return false;
      }

      // If we have permissions, we should be able to show notifications
      return true;
    } catch (e) {
      _logger.e('Error checking if notifications can be shown: $e');
      return false;
    }
  }

  /// Show immediate notification for new rehearsal
  Future<void> showRehearsalAddedNotification(Rehearsal rehearsal) async {
    try {
      _logger.i(
        'Attempting to show notification for rehearsal: ${rehearsal.name} (ID: ${rehearsal.id})',
      );

      // Check if we can show notifications
      final canShow = await canShowNotifications();
      if (!canShow) {
        _logger.w('Cannot show notifications - permissions may not be granted');
        return;
      }

      // Generate a smaller notification ID that fits in 32-bit integer
      final notificationId = _generateRealtimeNotificationId(rehearsal.id);
      _logger.i(
        'Generated notification ID: $notificationId for rehearsal: ${rehearsal.id}',
      );

      final notificationBody = _buildRehearsalNotificationBody(rehearsal);
      _logger.i('Notification body: $notificationBody');

      await _notifications.show(
        notificationId,
        'Nouvelle répétition ajoutée',
        notificationBody,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'new_rehearsals',
            'Nouvelles répétitions',
            channelDescription: 'Notifications pour les nouvelles répétitions',
            importance: Importance.high,
            priority: Priority.high,
            showWhen: true,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: 'rehearsal_${rehearsal.id}',
      );

      _logger.i(
        'Successfully showed immediate notification for new rehearsal: ${rehearsal.name}',
      );
    } catch (e) {
      _logger.e('Error showing rehearsal added notification: $e');
      _logger.e('Rehearsal details: ${rehearsal.toJson()}');
    }
  }

  /// Generate a notification ID for real-time notifications that fits in 32-bit integer
  int _generateRealtimeNotificationId(String rehearsalId) {
    // Use a hash of the rehearsal ID to generate a smaller number
    final hash = rehearsalId.hashCode;
    // Ensure it's positive and within 32-bit range
    final notificationId =
        (hash.abs() % 2147483647) + 1000000; // Start from 1M to avoid conflicts

    // Validate the ID is within correct range
    if (notificationId < 0 || notificationId > 2147483647) {
      _logger.e(
        'Generated notification ID $notificationId is out of range! Using fallback ID.',
      );
      return 1000000; // Fallback to a safe ID
    }

    _logger.d(
      'Generated notification ID: $notificationId from rehearsal ID: $rehearsalId (hash: $hash)',
    );
    return notificationId;
  }

  /// Build notification body for rehearsal
  String _buildRehearsalNotificationBody(Rehearsal rehearsal) {
    final parts = <String>[];

    if (rehearsal.name != null && rehearsal.name!.isNotEmpty) {
      parts.add(rehearsal.name!);
    }

    if (rehearsal.date != null) {
      try {
        final date = DateTime.parse(rehearsal.date!);
        final monthNames = [
          'janvier',
          'février',
          'mars',
          'avril',
          'mai',
          'juin',
          'juillet',
          'août',
          'septembre',
          'octobre',
          'novembre',
          'décembre',
        ];
        final formattedDate =
            'le ${date.day} ${monthNames[date.month - 1]} ${date.year}';
        parts.add(formattedDate);
      } catch (e) {
        _logger.w('Error parsing rehearsal date: $e');
      }
    }

    if (rehearsal.startTime != null && rehearsal.startTime!.isNotEmpty) {
      try {
        final timeParts = rehearsal.startTime!.split(':');
        if (timeParts.length >= 2) {
          final hour = timeParts[0];
          final minute = timeParts[1];
          final formattedTime = 'à ${hour}h$minute';
          parts.add(formattedTime);
        }
      } catch (e) {
        _logger.w('Error parsing rehearsal time: $e');
      }
    }

    if (rehearsal.place != null && rehearsal.place!.isNotEmpty) {
      parts.add('Lieu : ${rehearsal.place}');
    }

    if (parts.isEmpty) {
      return 'Nouvelle répétition ajoutée';
    }

    return parts.join(' ');
  }
}
