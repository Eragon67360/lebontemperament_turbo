import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:logger/logger.dart';

import 'package:lebontemperament/core/config/app_router.dart';
import 'package:lebontemperament/data/services/notification_service.dart';
import 'package:lebontemperament/firebase_options.dart';
import 'package:firebase_core/firebase_core.dart';

/// Handles FCM: background handler, foreground display, and tap navigation.
/// Call [registerBackgroundHandler] from main() and [setupForegroundListeners] when app has navigator.
class FcmNotificationHandler {
  FcmNotificationHandler._();

  static final _logger = Logger();
  static bool _foregroundSetupDone = false;

  /// A notification that launched the app, waiting for the splash to reach
  /// the home screen (opened earlier, the splash's own redirect would
  /// replace it).
  static String? _pendingLaunchPath;
  static bool _homeReached = false;

  /// Register the background handler (must be called from main() before runApp).
  static void registerBackgroundHandler() {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  /// Top-level background handler (runs in separate isolate when app is background/killed).
  @pragma('vm:entry-point')
  static Future<void> _firebaseMessagingBackgroundHandler(
    RemoteMessage message,
  ) async {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    _logger.i(
      '[FCM Background] messageId=${message.messageId}, data=${message.data}',
    );
    // A message with a "notification" block is displayed by the system while
    // the app is in the background: showing it again here produced duplicates.
    // Only data-only messages need a local notification.
    if (message.notification != null) {
      _logger.i('[FCM Background] notification message, system shows it');
      return;
    }
    final title = message.data['title'] ?? 'Notification';
    final body = message.data['body'] ?? '';
    final type = message.data['type'] ?? '';
    final id = message.data['id'] ?? '';
    final payload = type.isNotEmpty && id.isNotEmpty
        ? '${type}_$id'
        : '${message.messageId ?? ''}';
    try {
      final notificationService = NotificationService();
      await notificationService.initialize();
      await notificationService.showFromFcm(
        title: title,
        body: body,
        payload: payload,
      );
    } catch (e) {
      _logger.e('[FCM Background] Error showing notification: $e');
    }
  }

  /// Call once when app is built (e.g. from LeBonTemperamentApp.initState or first build).
  static void setupForegroundListeners() {
    if (_foregroundSetupDone) return;
    _foregroundSetupDone = true;

    // Tap callback for local notifications (scheduled + Realtime + FCM displayed via FLN)
    NotificationService.onNotificationTap = _navigateFromPayload;

    // Foreground: show local notification so it appears in tray with our channel
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      _logger.i('[FCM Foreground] onMessage: ${message.messageId}');
      final title =
          message.notification?.title ??
          message.data['title'] ??
          'Notification';
      final body = message.notification?.body ?? message.data['body'] ?? '';
      final type = message.data['type'] ?? '';
      final id = message.data['id'] ?? '';
      final payload = type.isNotEmpty && id.isNotEmpty
          ? '${type}_$id'
          : '${message.messageId ?? ''}';
      NotificationService().showFromFcm(
        title: title,
        body: body,
        payload: payload,
      );
    });

    // Opened from background (user tapped notification)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _logger.i('[FCM] onMessageOpenedApp: ${message.data}');
      _navigateFromFcmData(message.data);
    });

    // Cold start from a tap on an FCM notification message
    FirebaseMessaging.instance.getInitialMessage().then((
      RemoteMessage? message,
    ) {
      if (message != null) {
        _logger.i('[FCM] getInitialMessage: ${message.data}');
        _openFromLaunch(
          pathFor(
            message.data['type']?.toString() ?? '',
            message.data['id']?.toString() ?? '',
          ),
        );
      }
    });

    // Cold start from a tap on a local notification (reminders, data-only
    // pushes shown by the app): the plugin doesn't call its tap callback for
    // the notification that launched the app, it has to be asked.
    NotificationService().launchPayload().then((payload) {
      if (payload != null && payload.isNotEmpty) {
        _logger.i('[FCM] launched from local notification: $payload');
        _openFromLaunch(_pathFromPayload(payload));
      }
    });
  }

  static void _openFromLaunch(String? path) {
    if (path == null) return;
    if (_homeReached) {
      _navigateTo(path);
    } else {
      _pendingLaunchPath = path;
    }
  }

  /// Called by the splash once it has sent a signed-in member to the home
  /// screen: opens the notification that launched the app, if any, on top
  /// of it (so back returns home).
  static void onHomeReached() {
    _homeReached = true;
    final path = _pendingLaunchPath;
    _pendingLaunchPath = null;
    if (path != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _navigateTo(path));
    }
  }

  static void _navigateFromFcmData(Map<String, dynamic> data) {
    final type = data['type']?.toString() ?? '';
    final id = data['id']?.toString() ?? '';
    final path = pathFor(type, id);
    if (path != null) _navigateTo(path);
  }

  static void _navigateFromPayload(String? payload) {
    if (payload == null || payload.isEmpty) return;
    final path = _pathFromPayload(payload);
    if (path != null) _navigateTo(path);
  }

  static String? _pathFromPayload(String payload) {
    final parts = payload.split('_');
    if (parts.length < 2) return null;
    final type = parts[0];
    final id = parts.sublist(1).join('_');
    return pathFor(type, id);
  }

  /// The screen a push's data `type` and `id` open, or null when the app has
  /// none for it (`delivery` carries the recipient id, #593).
  static String? pathFor(String type, String id) {
    switch (type) {
      case 'rehearsal':
        return id.isNotEmpty ? AppRouter.rehearsals : null;
      case 'concert':
        return id.isNotEmpty ? '/concerts/$id' : null;
      case 'event':
        return id.isNotEmpty ? '/events/$id' : null;
      case 'report':
        return id.isNotEmpty ? '/reports/$id' : null;
      case 'delivery':
        return id.isNotEmpty ? '/delivery/$id' : null;
      default:
        return null;
    }
  }

  static void _navigateTo(String path) {
    final context = AppRouter.navigatorKey.currentContext;
    if (context != null && context.mounted) {
      // Pushed over the current screen so back returns to it instead of
      // leaving the app.
      context.push(path);
    } else {
      _logger.w('[FCM] No context for navigation to $path');
    }
  }

  /// Subscribe to FCM topic for server-sent notifications (e.g. all app users).
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.subscribeToTopic(topic);
      _logger.i('[FCM] Subscribed to topic: $topic');
    } catch (e) {
      _logger.e('[FCM] Subscribe to topic failed: $e');
    }
  }

  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await FirebaseMessaging.instance.unsubscribeFromTopic(topic);
      _logger.i('[FCM] Unsubscribed from topic: $topic');
    } catch (e) {
      _logger.e('[FCM] Unsubscribe from topic failed: $e');
    }
  }

  /// The current FCM token without asking for permission: null on an iPhone
  /// where notifications aren't allowed (yet). Used to register the phone
  /// for the superadmins' alerts (#364).
  static Future<String?> currentToken() async {
    if (Platform.isIOS) {
      final settings = await FirebaseMessaging.instance
          .getNotificationSettings();
      if (settings.authorizationStatus != AuthorizationStatus.authorized &&
          settings.authorizationStatus != AuthorizationStatus.provisional) {
        return null;
      }
    }
    return FirebaseMessaging.instance.getToken();
  }

  /// Get current FCM token (for optional server-side targeting).
  static Future<String?> getToken() async {
    if (Platform.isIOS) {
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      if (settings.authorizationStatus != AuthorizationStatus.authorized &&
          settings.authorizationStatus != AuthorizationStatus.provisional) {
        return null;
      }
    }
    return await FirebaseMessaging.instance.getToken();
  }
}
