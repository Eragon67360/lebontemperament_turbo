import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:logger/logger.dart';
import '../models/event.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';

class BackgroundNotificationService {
  static final BackgroundNotificationService _instance =
      BackgroundNotificationService._internal();
  factory BackgroundNotificationService() => _instance;
  BackgroundNotificationService._internal();

  final Logger _logger = Logger();
  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  /// Initialize background notification service
  Future<void> initialize() async {
    try {
      _logger.i('Initializing background notification service...');

      // This service will be called when the app is completely closed
      // and a background notification is received

      _logger.i('Background notification service initialized');
    } catch (e) {
      _logger.e('Error initializing background notification service: $e');
    }
  }

  /// Handle background notification for new event
  static Future<void> handleBackgroundEventNotification(Event event) async {
    final logger = Logger();
    logger.i('Handling background event notification: ${event.title}');

    try {
      // Show notification even when app is closed
      await _showBackgroundNotification(
        'Nouvel événement ajouté',
        _buildEventNotificationBody(event),
        'event_${event.id}',
        'new_events',
      );

      logger.i('Background event notification shown successfully');
    } catch (e) {
      logger.e('Error showing background event notification: $e');
    }
  }

  /// Handle background notification for new concert
  static Future<void> handleBackgroundConcertNotification(
    Concert concert,
  ) async {
    final logger = Logger();
    logger.i('Handling background concert notification: ${concert.name}');

    try {
      // Show notification even when app is closed
      await _showBackgroundNotification(
        'Nouveau concert ajouté',
        _buildConcertNotificationBody(concert),
        'concert_${concert.id}',
        'new_concerts',
      );

      logger.i('Background concert notification shown successfully');
    } catch (e) {
      logger.e('Error showing background concert notification: $e');
    }
  }

  /// Handle background notification for new rehearsal
  static Future<void> handleBackgroundRehearsalNotification(
    Rehearsal rehearsal,
  ) async {
    final logger = Logger();
    logger.i('Handling background rehearsal notification: ${rehearsal.name}');

    try {
      // Show notification even when app is closed
      await _showBackgroundNotification(
        'Nouvelle répétition ajoutée',
        _buildRehearsalNotificationBody(rehearsal),
        'rehearsal_${rehearsal.id}',
        'new_rehearsals',
      );

      logger.i('Background rehearsal notification shown successfully');
    } catch (e) {
      logger.e('Error showing background rehearsal notification: $e');
    }
  }

  /// Show background notification
  static Future<void> _showBackgroundNotification(
    String title,
    String body,
    String payload,
    String channelId,
  ) async {
    try {
      final FlutterLocalNotificationsPlugin notifications =
          FlutterLocalNotificationsPlugin();

      // Initialize if not already done
      const androidSettings = AndroidInitializationSettings(
        '@mipmap/ic_launcher',
      );
      const iosSettings = DarwinInitializationSettings();
      const initializationSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await notifications.initialize(initializationSettings);

      // Show the notification
      await notifications.show(
        _generateNotificationId(payload),
        title,
        body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            channelId,
            _getChannelName(channelId),
            channelDescription: _getChannelDescription(channelId),
            importance: Importance.high,
            priority: Priority.high,
            showWhen: true,
            enableVibration: true,
            playSound: true,
          ),
          iOS: DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
            presentBanner: true,
            presentList: true,
            interruptionLevel: InterruptionLevel.active,
          ),
        ),
        payload: payload,
      );
    } catch (e) {
      Logger().e('Error showing background notification: $e');
    }
  }

  /// Generate notification ID from payload
  static int _generateNotificationId(String payload) {
    final hash = payload.hashCode;
    return (hash.abs() % 2147483647) + 1000000;
  }

  /// Get channel name
  static String _getChannelName(String channelId) {
    switch (channelId) {
      case 'new_events':
        return 'Nouveaux événements';
      case 'new_concerts':
        return 'Nouveaux concerts';
      case 'new_rehearsals':
        return 'Nouvelles répétitions';
      default:
        return 'Notifications';
    }
  }

  /// Get channel description
  static String _getChannelDescription(String channelId) {
    switch (channelId) {
      case 'new_events':
        return 'Notifications pour les nouveaux événements';
      case 'new_concerts':
        return 'Notifications pour les nouveaux concerts';
      case 'new_rehearsals':
        return 'Notifications pour les nouvelles répétitions';
      default:
        return 'Notifications générales';
    }
  }

  /// Build notification body for event
  static String _buildEventNotificationBody(Event event) {
    final parts = <String>[];

    if (event.title != null && event.title!.isNotEmpty) {
      parts.add(event.title!);
    }

    if (event.dateFrom != null && event.dateFrom!.isNotEmpty) {
      parts.add('Date: ${event.dateFrom}');
    }

    if (event.location != null && event.location!.isNotEmpty) {
      parts.add('Lieu: ${event.location}');
    }

    return parts.isEmpty ? 'Nouvel événement ajouté' : parts.join(' • ');
  }

  /// Build notification body for concert
  static String _buildConcertNotificationBody(Concert concert) {
    final parts = <String>[];

    if (concert.name != null && concert.name!.isNotEmpty) {
      parts.add(concert.name!);
    }

    if (concert.date != null && concert.date!.isNotEmpty) {
      parts.add('Date: ${concert.date}');
    }

    if (concert.place != null && concert.place!.isNotEmpty) {
      parts.add('Lieu: ${concert.place}');
    }

    return parts.isEmpty ? 'Nouveau concert ajouté' : parts.join(' • ');
  }

  /// Build notification body for rehearsal
  static String _buildRehearsalNotificationBody(Rehearsal rehearsal) {
    final parts = <String>[];

    if (rehearsal.name != null && rehearsal.name!.isNotEmpty) {
      parts.add(rehearsal.name!);
    }

    if (rehearsal.date != null && rehearsal.date!.isNotEmpty) {
      parts.add('Date: ${rehearsal.date}');
    }

    if (rehearsal.place != null && rehearsal.place!.isNotEmpty) {
      parts.add('Lieu: ${rehearsal.place}');
    }

    return parts.isEmpty ? 'Nouvelle répétition ajoutée' : parts.join(' • ');
  }
}
