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

  /// Register the background handler (must be called from main() before runApp).
  static void registerBackgroundHandler() {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }

  /// Top-level background handler (runs in separate isolate when app is background/killed).
  @pragma('vm:entry-point')
  static Future<void> _firebaseMessagingBackgroundHandler(
      RemoteMessage message) async {
    await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform);
    _logger.i(
        '[FCM Background] messageId=${message.messageId}, data=${message.data}');
    // When server sends "notification" block, system shows it; we only need to handle data-only or show fallback.
    final title = message.notification?.title ?? message.data['title'] ?? 'Notification';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    final type = message.data['type'] ?? '';
    final id = message.data['id'] ?? '';
    final payload = type.isNotEmpty && id.isNotEmpty ? '${type}_$id' : '${message.messageId ?? ''}';
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
      final title = message.notification?.title ?? message.data['title'] ?? 'Notification';
      final body = message.notification?.body ?? message.data['body'] ?? '';
      final type = message.data['type'] ?? '';
      final id = message.data['id'] ?? '';
      final payload = type.isNotEmpty && id.isNotEmpty ? '${type}_$id' : '${message.messageId ?? ''}';
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

    // Cold start from notification tap
    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        _logger.i('[FCM] getInitialMessage: ${message.data}');
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _navigateFromFcmData(message.data);
        });
      }
    });
  }

  static void _navigateFromFcmData(Map<String, dynamic> data) {
    final type = data['type']?.toString() ?? '';
    final id = data['id']?.toString() ?? '';
    final path = _pathFromTypeAndId(type, id);
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
    return _pathFromTypeAndId(type, id);
  }

  static String? _pathFromTypeAndId(String type, String id) {
    switch (type) {
      case 'rehearsal':
        return id.isNotEmpty ? AppRouter.rehearsals : null;
      case 'concert':
        return id.isNotEmpty ? '/concerts/$id' : null;
      case 'event':
        return id.isNotEmpty ? '/events/$id' : null;
      default:
        return null;
    }
  }

  static void _navigateTo(String path) {
    final context = AppRouter.navigatorKey.currentContext;
    if (context != null && context.mounted) {
      context.go(path);
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
