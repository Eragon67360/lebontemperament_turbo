import 'dart:async';

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:logger/logger.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';

import '../models/notification_settings.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';
import '../models/event.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  static const String _tag = 'NotificationService';
  final _logger = Logger();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();
  bool _isInitialized = false;
  bool _isScheduling =
      false; // Add flag to prevent multiple simultaneous scheduling

  Future<void> initialize() async {
    if (_isInitialized) {
      return;
    }

    try {
      _logger.i('Initializing notification service...');

      // Initialize timezone
      tz.initializeTimeZones();

      // Set the local timezone to the device's timezone
      final String timeZoneName = DateTime.now().timeZoneName;
      _logger.i('Device timezone: $timeZoneName');

      // Try to set the local timezone
      try {
        tz.setLocalLocation(tz.getLocation('Europe/Paris'));
        _logger.i('Set timezone to Europe/Paris');
      } catch (e) {
        _logger.w('Could not set specific timezone, using device default: $e');
      }

      // Set up notification channels for Android
      const androidSettings = AndroidInitializationSettings(
        '@mipmap/ic_launcher',
      );
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );

      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      // Initialize with callback to track when notifications are triggered
      final initialized = await _notifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          _logger.i('🔔 Notification received: ${response.payload}');
          _logger.i('🔔 Notification ID: ${response.id}');
          _logger.i('🔔 Notification action: ${response.actionId}');
        },
      );

      if (initialized == true) {
        _logger.i('Notification service initialized successfully');
        _isInitialized = true;
      } else {
        _logger.e('Failed to initialize notification service');
      }
    } catch (e) {
      _logger.e('Error initializing notification service: $e');
      rethrow;
    }
  }

  Future<bool> requestPermissions() async {
    try {
      _logger.i('Requesting notification permissions...');

      // Check current status first
      final currentStatus = await Permission.notification.status;
      _logger.i('Current notification permission status: $currentStatus');

      // For iOS, use the flutter_local_notifications plugin directly
      // This is more reliable than using permission_handler on iOS
      try {
        final iosPlugin = _notifications
            .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin
            >();
        if (iosPlugin != null) {
          _logger.i('Using iOS-specific permission request...');
          final iosSettings = await iosPlugin.requestPermissions(
            alert: true,
            badge: true,
            sound: true,
          );
          _logger.i('iOS notification permissions result: $iosSettings');

          // If iOS permissions were granted, we're good
          if (iosSettings != null) {
            _logger.i('iOS permissions granted successfully');
            return true;
          }
        }
      } catch (e) {
        _logger.w('Could not request iOS notification permissions: $e');
      }

      // Fallback to permission_handler for Android or if iOS method fails
      _logger.i('Using permission_handler fallback...');
      final status = await Permission.notification.request();
      _logger.i('Permission handler request result: $status');

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
      // For iOS, check using flutter_local_notifications first
      try {
        final iosPlugin = _notifications
            .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin
            >();
        if (iosPlugin != null) {
          _logger.i(
            'Checking iOS permissions using flutter_local_notifications...',
          );
          final iosSettings = await iosPlugin.checkPermissions();
          _logger.i('iOS notification settings: $iosSettings');

          // If we can get the settings and they're not null, permissions are granted
          if (iosSettings != null) {
            _logger.i(
              'iOS permissions confirmed via flutter_local_notifications',
            );
            return true;
          }
        }
      } catch (e) {
        _logger.w('Could not check iOS notification settings: $e');
      }

      // Fallback to permission_handler
      final status = await Permission.notification.status;
      _logger.i(
        'Current notification permission status (permission_handler): $status',
      );

      final result = status.isGranted;
      _logger.i('Permission check result: $result');
      return result;
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
    // Prevent multiple simultaneous scheduling operations
    if (_isScheduling) {
      _logger.w('Scheduling already in progress, skipping...');
      return;
    }

    _isScheduling = true;
    try {
      _logger.i('Starting to schedule event notifications...');
      _logger.i(
        'Settings: enabled=${settings.enabled}, concerts=${settings.concertsEnabled}, rehearsals=${settings.rehearsalsEnabled}',
      );
      _logger.i(
        'Data: ${concerts.length} concerts, ${rehearsals.length} rehearsals',
      );

      if (!settings.enabled) {
        _logger.i('Notifications disabled, skipping scheduling');
        return;
      }

      // Ensure service is initialized
      if (!_isInitialized) {
        _logger.i('Notification service not initialized, initializing now...');
        await initialize();
      }

      // Check permissions
      final permissionsGranted = await hasPermissions();
      if (!permissionsGranted) {
        _logger.w('No notification permissions, requesting...');
        final granted = await requestPermissions();
        if (!granted) {
          _logger.e(
            'Notification permissions not granted, cannot schedule notifications',
          );
          return;
        }
      }

      // Cancel existing notifications
      await cancelAllNotifications();
      _logger.i('Cancelled existing notifications');

      int scheduledCount = 0;

      // Schedule concert notifications
      if (settings.concertsEnabled) {
        _logger.i(
          'Scheduling notifications for ${concerts.length} concerts...',
        );
        for (final concert in concerts) {
          final count = await _scheduleConcertNotifications(concert, settings);
          scheduledCount += count;
        }
      }

      // Schedule rehearsal notifications
      if (settings.rehearsalsEnabled) {
        _logger.i(
          'Scheduling notifications for ${rehearsals.length} rehearsals...',
        );
        for (final rehearsal in rehearsals) {
          final count = await _scheduleRehearsalNotifications(
            rehearsal,
            settings,
          );
          scheduledCount += count;
        }
      }

      _logger.i(
        'Successfully scheduled $scheduledCount notifications for ${concerts.length} concerts and ${rehearsals.length} rehearsals',
      );
    } catch (e) {
      _logger.e('Error scheduling event notifications: $e');
      rethrow;
    } finally {
      _isScheduling = false;
    }
  }

  Future<int> _scheduleConcertNotifications(
    Concert concert,
    NotificationSettings settings,
  ) async {
    try {
      _logger.i('Scheduling notifications for concert: ${concert.name}');
      _logger.i('Concert date: ${concert.date}, time: ${concert.time}');

      final eventDateTime = _parseEventDateTime(concert.date, concert.time);
      if (eventDateTime == null) {
        _logger.w('Could not parse datetime for concert: ${concert.name}');
        return 0;
      }

      _logger.i('Event datetime: ${eventDateTime.toIso8601String()}');
      _logger.i('Current time: ${DateTime.now().toIso8601String()}');

      int scheduledCount = 0;
      for (final notificationTime in settings.selectedTimes) {
        final scheduledTime = eventDateTime.subtract(notificationTime.duration);

        _logger.i('Notification time: ${notificationTime.displayName}');
        _logger.i('Scheduled time: ${scheduledTime.toIso8601String()}');
        _logger.i(
          'Is scheduled time in future: ${scheduledTime.isAfter(DateTime.now())}',
        );

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
          scheduledCount++;
          _logger.i(
            'Successfully scheduled concert notification: ${concert.name} at ${scheduledTime.toIso8601String()}',
          );
        } else {
          _logger.w(
            'Skipping past notification for concert: ${concert.name} at ${scheduledTime.toIso8601String()}',
          );
        }
      }
      return scheduledCount;
    } catch (e) {
      _logger.e('Error scheduling concert notifications: $e');
      return 0;
    }
  }

  Future<int> _scheduleRehearsalNotifications(
    Rehearsal rehearsal,
    NotificationSettings settings,
  ) async {
    try {
      _logger.i('Scheduling notifications for rehearsal: ${rehearsal.name}');
      _logger.i(
        'Rehearsal date: ${rehearsal.date}, time: ${rehearsal.startTime}',
      );

      final eventDateTime = _parseEventDateTime(
        rehearsal.date,
        rehearsal.startTime,
      );
      if (eventDateTime == null) {
        _logger.w('Could not parse datetime for rehearsal: ${rehearsal.name}');
        return 0;
      }

      _logger.i('Event datetime: ${eventDateTime.toIso8601String()}');
      _logger.i('Current time: ${DateTime.now().toIso8601String()}');

      int scheduledCount = 0;
      for (final notificationTime in settings.selectedTimes) {
        final scheduledTime = eventDateTime.subtract(notificationTime.duration);

        _logger.i('Notification time: ${notificationTime.displayName}');
        _logger.i('Scheduled time: ${scheduledTime.toIso8601String()}');
        _logger.i(
          'Is scheduled time in future: ${scheduledTime.isAfter(DateTime.now())}',
        );

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
          scheduledCount++;
          _logger.i(
            'Successfully scheduled rehearsal notification: ${rehearsal.name} at ${scheduledTime.toIso8601String()}',
          );
        } else {
          _logger.w(
            'Skipping past notification for rehearsal: ${rehearsal.name} at ${scheduledTime.toIso8601String()}',
          );
        }
      }
      return scheduledCount;
    } catch (e) {
      _logger.e('Error scheduling rehearsal notifications: $e');
      return 0;
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
      // Try inexact scheduling first (more reliable on Android)
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
            enableVibration: true,
            playSound: true,
            showWhen: true,
            autoCancel: true,
            category: AndroidNotificationCategory.reminder,
            visibility: NotificationVisibility.public,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        // Use inexact scheduling which is more reliable on Android
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        payload: payload,
      );

      _logger.i(
        'Scheduled notification: $title at ${scheduledDate.toIso8601String()}',
      );
    } catch (e) {
      _logger.e('Error scheduling notification: $e');

      // If scheduling fails, we could implement a fallback using background tasks
      // For now, just log the error
      _logger.w(
        'Notification scheduling failed - consider implementing background task fallback',
      );
    }
  }

  DateTime? _parseEventDateTime(String? date, String? time) {
    try {
      if (date == null) return null;

      _logger.d('Parsing date: $date, time: $time');

      DateTime? dateTime;

      // Try different date formats
      try {
        // First try ISO format
        dateTime = DateTime.parse(date);
        _logger.d('Parsed as ISO format: ${dateTime.toIso8601String()}');
      } catch (e) {
        _logger.w('Failed to parse as ISO format, trying other formats: $e');

        // Try common date formats
        final formats = [
          'yyyy-MM-dd',
          'dd/MM/yyyy',
          'MM/dd/yyyy',
          'yyyy/MM/dd',
          'dd-MM-yyyy',
          'MM-dd-yyyy',
        ];

        bool parsed = false;
        for (final format in formats) {
          try {
            // For now, we'll use a simple approach
            // In a real app, you might want to use intl package for more robust parsing
            if (format == 'yyyy-MM-dd' && date.contains('-')) {
              final parts = date.split('-');
              if (parts.length == 3) {
                dateTime = DateTime(
                  int.parse(parts[0]),
                  int.parse(parts[1]),
                  int.parse(parts[2]),
                );
                parsed = true;
                _logger.d(
                  'Parsed as yyyy-MM-dd format: ${dateTime!.toIso8601String()}',
                );
                break;
              }
            }
          } catch (e) {
            _logger.d('Failed to parse with format $format: $e');
          }
        }

        if (!parsed) {
          _logger.e('Could not parse date with any known format: $date');
          return null;
        }
      }

      // Ensure dateTime is not null
      if (dateTime == null) {
        _logger.e('Failed to parse date: $date');
        return null;
      }

      // If time is provided, create a new DateTime with the time
      if (time != null && time.isNotEmpty) {
        final timeParts = time.split(':');
        if (timeParts.length >= 2) {
          final hour = int.parse(timeParts[0]);
          final minute = int.parse(timeParts[1]);

          // Create a new DateTime in local timezone
          final eventDateTime = DateTime(
            dateTime.year,
            dateTime.month,
            dateTime.day,
            hour,
            minute,
          );

          _logger.d(
            'Created event datetime: ${eventDateTime.toIso8601String()}',
          );
          _logger.d('Current time: ${DateTime.now().toIso8601String()}');
          _logger.d(
            'Is event in future: ${eventDateTime.isAfter(DateTime.now())}',
          );

          return eventDateTime;
        }
      }

      // If no time provided, use the date as is (assume start of day)
      _logger.d(
        'No time provided, using date as is: ${dateTime.toIso8601String()}',
      );
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

  /// Check pending notifications to verify scheduling
  Future<void> _checkPendingNotifications() async {
    try {
      final pendingNotifications = await _notifications
          .pendingNotificationRequests();
      _logger.i('Pending notifications count: ${pendingNotifications.length}');

      for (final notification in pendingNotifications) {
        _logger.i(
          'Pending notification: ID=${notification.id}, Title=${notification.title}',
        );
      }
    } catch (e) {
      _logger.e('Error checking pending notifications: $e');
    }
  }

  /// Get pending notifications (public method)
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

      // Note: iOS Simulator has limited notification support
      // Notifications may not appear visually on simulator but will work on real device
      _logger.i(
        'Note: On iOS Simulator, notifications may not appear visually but will work on real device',
      );

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
            presentBanner: true,
            presentList: true,
            interruptionLevel: InterruptionLevel.active,
            categoryIdentifier: 'new_rehearsal',
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

  /// Show immediate notification for new event
  Future<void> showEventAddedNotification(Event event) async {
    try {
      _logger.i(
        'Attempting to show notification for event: ${event.title} (ID: ${event.id})',
      );

      // Check if we can show notifications
      final canShow = await canShowNotifications();
      if (!canShow) {
        _logger.w('Cannot show notifications - permissions may not be granted');
        return;
      }

      // Note: iOS Simulator has limited notification support
      // Notifications may not appear visually on simulator but will work on real device
      _logger.i(
        'Note: On iOS Simulator, notifications may not appear visually but will work on real device',
      );

      // Generate a smaller notification ID that fits in 32-bit integer
      final notificationId = _generateRealtimeNotificationId(event.id);
      _logger.i(
        'Generated notification ID: $notificationId for event: ${event.id}',
      );

      final notificationBody = _buildEventNotificationBody(event);
      _logger.i('Notification body: $notificationBody');

      await _notifications.show(
        notificationId,
        'Nouvel événement ajouté',
        notificationBody,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'new_events',
            'Nouveaux événements',
            channelDescription: 'Notifications pour les nouveaux événements',
            importance: Importance.high,
            priority: Priority.high,
            showWhen: true,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
            presentBanner: true,
            presentList: true,
            interruptionLevel: InterruptionLevel.active,
            categoryIdentifier: 'new_event',
          ),
        ),
        payload: 'event_${event.id}',
      );

      _logger.i(
        'Successfully showed immediate notification for new event: ${event.title}',
      );
    } catch (e) {
      _logger.e('Error showing event added notification: $e');
      _logger.e('Event details: ${event.toJson()}');
    }
  }

  /// Show immediate notification for new concert
  Future<void> showConcertAddedNotification(Concert concert) async {
    try {
      _logger.i(
        'Attempting to show notification for concert: ${concert.name} (ID: ${concert.id})',
      );

      // Check if we can show notifications
      final canShow = await canShowNotifications();
      if (!canShow) {
        _logger.w('Cannot show notifications - permissions may not be granted');
        return;
      }

      // Note: iOS Simulator has limited notification support
      // Notifications may not appear visually on simulator but will work on real device
      _logger.i(
        'Note: On iOS Simulator, notifications may not appear visually but will work on real device',
      );

      // Generate a smaller notification ID that fits in 32-bit integer
      final notificationId = _generateRealtimeNotificationId(concert.id);
      _logger.i(
        'Generated notification ID: $notificationId for concert: ${concert.id}',
      );

      final notificationBody = _buildConcertNotificationBody(concert);
      _logger.i('Notification body: $notificationBody');

      await _notifications.show(
        notificationId,
        'Nouveau concert ajouté',
        notificationBody,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'new_concerts',
            'Nouveaux concerts',
            channelDescription: 'Notifications pour les nouveaux concerts',
            importance: Importance.high,
            priority: Priority.high,
            showWhen: true,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
            presentBanner: true,
            presentList: true,
            interruptionLevel: InterruptionLevel.active,
            categoryIdentifier: 'new_concert',
          ),
        ),
        payload: 'concert_${concert.id}',
      );

      _logger.i(
        'Successfully showed immediate notification for new concert: ${concert.name}',
      );
    } catch (e) {
      _logger.e('Error showing concert added notification: $e');
      _logger.e('Concert details: ${concert.toJson()}');
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

  /// Build notification body for event
  String _buildEventNotificationBody(Event event) {
    final parts = <String>[];

    if (event.title != null && event.title!.isNotEmpty) {
      parts.add(event.title!);
    }

    if (event.dateFrom != null) {
      try {
        final date = DateTime.parse(event.dateFrom!);
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
        _logger.w('Error parsing event date: $e');
      }
    }

    if (event.time != null && event.time!.isNotEmpty) {
      try {
        final timeParts = event.time!.split(':');
        if (timeParts.length >= 2) {
          final hour = timeParts[0];
          final minute = timeParts[1];
          final formattedTime = 'à ${hour}h$minute';
          parts.add(formattedTime);
        }
      } catch (e) {
        _logger.w('Error parsing event time: $e');
      }
    }

    if (event.location != null && event.location!.isNotEmpty) {
      parts.add('Lieu : ${event.location}');
    }

    if (parts.isEmpty) {
      return 'Nouvel événement ajouté';
    }

    return parts.join(' ');
  }

  /// Build notification body for concert
  String _buildConcertNotificationBody(Concert concert) {
    final parts = <String>[];

    if (concert.name != null && concert.name!.isNotEmpty) {
      parts.add(concert.name!);
    }

    if (concert.date.isNotEmpty) {
      try {
        final date = DateTime.parse(concert.date);
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
        _logger.w('Error parsing concert date: $e');
      }
    }

    if (concert.time.isNotEmpty) {
      try {
        final timeParts = concert.time.split(':');
        if (timeParts.length >= 2) {
          final hour = timeParts[0];
          final minute = timeParts[1];
          final formattedTime = 'à ${hour}h$minute';
          parts.add(formattedTime);
        }
      } catch (e) {
        _logger.w('Error parsing concert time: $e');
      }
    }

    if (concert.place.isNotEmpty) {
      parts.add('Lieu : ${concert.place}');
    }

    if (parts.isEmpty) {
      return 'Nouveau concert ajouté';
    }

    return parts.join(' ');
  }

  /// Test notification to verify permissions are working
  Future<void> showTestNotification() async {
    try {
      final canShow = await canShowNotifications();
      if (!canShow) {
        _logger.w(
          'Cannot show test notification - permissions may not be granted',
        );
        return;
      }

      await _notifications.show(
        999999,
        'Test Notification',
        'This is a test notification to verify permissions are working. Tap to test callback.',
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'test_channel',
            'Test Notifications',
            channelDescription: 'Test notifications for debugging',
            importance: Importance.high,
            priority: Priority.high,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: 'test_immediate_callback',
      );

      _logger.i('Test notification shown successfully');
    } catch (e) {
      _logger.e('Error showing test notification: $e');
    }
  }

  /// Test scheduled notification to verify scheduling works
  Future<void> showTestScheduledNotification() async {
    try {
      final canShow = await canShowNotifications();
      if (!canShow) {
        _logger.w(
          'Cannot show test scheduled notification - permissions may not be granted',
        );
        return;
      }

      // Clear all existing notifications first to avoid conflicts
      await cancelAllNotifications();

      // Use a unique ID for test notifications to avoid conflicts
      final testNotificationId =
          DateTime.now().millisecondsSinceEpoch % 1000000;

      // Schedule a notification for 10 seconds from now
      final scheduledTime = DateTime.now().add(const Duration(seconds: 10));
      final tzScheduledTime = tz.TZDateTime.from(scheduledTime, tz.local);

      await _notifications.zonedSchedule(
        testNotificationId,
        'Test Scheduled Notification',
        'This is a test scheduled notification - scheduled for 10 seconds from now.',
        tzScheduledTime,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'test_scheduled_channel',
            'Test Scheduled Notifications',
            channelDescription: 'Test scheduled notifications for debugging',
            importance: Importance.high,
            priority: Priority.high,
            enableVibration: true,
            playSound: true,
            showWhen: true,
            autoCancel: true,
            category: AndroidNotificationCategory.reminder,
            visibility: NotificationVisibility.public,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        payload: 'test_scheduled_$testNotificationId',
      );

      _logger.i(
        'Notification scheduled for: ${scheduledTime.toIso8601String()}',
      );
    } catch (e) {
      _logger.e('Scheduling error: $e');
    }
  }

  /// Test scheduled notification using timer (more reliable on Android)
  Future<void> showTestScheduledNotificationTimer() async {
    try {
      final canShow = await canShowNotifications();
      if (!canShow) {
        _logger.w(
          'Cannot show test scheduled notification - permissions may not be granted',
        );
        return;
      }

      // Clear all existing notifications first to avoid conflicts
      await cancelAllNotifications();

      // Use a unique ID for test notifications to avoid conflicts
      final testNotificationId =
          DateTime.now().millisecondsSinceEpoch % 1000000;

      // Schedule a notification for 10 seconds from now using timer
      final scheduledTime = DateTime.now().add(const Duration(seconds: 10));

      _logger.i(
        'Notification scheduled for: ${scheduledTime.toIso8601String()} (using timer)',
      );

      // Use a timer instead of exact alarm
      Timer(const Duration(seconds: 10), () async {
        try {
          await _notifications.show(
            testNotificationId,
            'Test Scheduled Notification (Timer)',
            'This is a test scheduled notification - fired after 10 seconds using timer.',
            const NotificationDetails(
              android: AndroidNotificationDetails(
                'test_scheduled_channel',
                'Test Scheduled Notifications',
                channelDescription:
                    'Test scheduled notifications for debugging',
                importance: Importance.high,
                priority: Priority.high,
                enableVibration: true,
                playSound: true,
                showWhen: true,
                autoCancel: true,
                category: AndroidNotificationCategory.reminder,
                visibility: NotificationVisibility.public,
              ),
              iOS: DarwinNotificationDetails(
                presentAlert: true,
                presentBadge: true,
                presentSound: true,
              ),
            ),
            payload: 'test_scheduled_timer_$testNotificationId',
          );

          _logger.i('🔔 Timer-based notification fired successfully');
        } catch (e) {
          _logger.e('Error firing timer-based notification: $e');
        }
      });
    } catch (e) {
      _logger.e('Scheduling error: $e');
    }
  }
}
