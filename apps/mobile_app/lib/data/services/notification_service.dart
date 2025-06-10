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
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        payload: payload,
      );

      _logger.i(
        'Scheduled notification: $title at ${scheduledDate.toIso8601String()}',
      );
    } catch (e) {
      _logger.e('Error scheduling notification: $e');
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
}
