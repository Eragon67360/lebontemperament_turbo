import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show AuthChangeEvent;

import 'core/config/dependency_injection.dart';
import 'core/platform/liquid_glass_support.dart';
import 'core/config/supabase_config.dart';
import 'core/config/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'data/services/notification_service.dart';
import 'data/services/fcm_notification_handler.dart';
import 'data/services/session_notifications.dart';
import 'data/providers/realtime_notifications_provider.dart';
import 'features/notifications/presentation/providers/notification_scheduler_provider.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase (required for FCM)
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Register FCM background handler before runApp (must be top-level)
  FcmNotificationHandler.registerBackgroundHandler();

  // Initialize Supabase
  await SupabaseConfig.initialize();

  // Initialize dependency injection
  await DependencyInjection.init();

  // Initialize notification service (local + display for FCM)
  await NotificationService().initialize();

  // Push notifications follow the session: subscribed to the topic and the
  // phone registered for alerts only while a member is signed in;
  // unsubscribed, token deleted and cache cleared on sign-out (#358, #364).
  final auth = SupabaseConfig.client.auth;
  final sessionNotifications = SessionNotifications.production()
    ..bind(
      currentSession: auth.currentSession,
      authStateChanges: auth.onAuthStateChange,
    );
  DependencyInjection.getIt.registerSingleton(sessionNotifications);

  // Re-run the router's auth redirect on every sign-in and sign-out,
  // including a session the server ended (revoked or expired refresh
  // token), so a signed-out member lands on the login screen.
  auth.onAuthStateChange.listen((state) {
    if (state.event == AuthChangeEvent.signedIn ||
        state.event == AuthChangeEvent.signedOut) {
      AuthStateListener().notifyAuthStateChanged();
    }
  });

  // Liquid Glass tab bar on iOS 26 and later only (#549).
  await LiquidGlassSupport.init();

  runApp(const ProviderScope(child: LeBonTemperamentApp()));
}

class LeBonTemperamentApp extends ConsumerStatefulWidget {
  const LeBonTemperamentApp({super.key});

  @override
  ConsumerState<LeBonTemperamentApp> createState() =>
      _LeBonTemperamentAppState();
}

class _LeBonTemperamentAppState extends ConsumerState<LeBonTemperamentApp>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    NotificationService.updateLifecycleState(AppLifecycleState.resumed);

    // FCM: foreground listeners (the topic subscription follows the session,
    // see SessionNotifications in main()).
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FcmNotificationHandler.setupForegroundListeners();
    });

    // Start real-time subscription for list updates (always, regardless of settings)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref
          .read(realtimeNotificationsControllerProvider.notifier)
          .startListening();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Stop real-time notifications when app is disposed
    ref.read(realtimeNotificationsControllerProvider.notifier).stopListening();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    NotificationService.updateLifecycleState(state);

    switch (state) {
      case AppLifecycleState.resumed:
        // App came to foreground - ensure real-time subscription is active
        ref
            .read(realtimeNotificationsControllerProvider.notifier)
            .startListening();
        // Reschedule notifications to recover from OEM clearing alarms
        ref
            .read(notificationSchedulerProvider.notifier)
            .scheduleNotifications();
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
        // App went to background or was closed - keep listening for real-time notifications
        // Don't stop listening as we want notifications to work in background
        break;
      case AppLifecycleState.inactive:
        // App is inactive - keep listening
        break;
      case AppLifecycleState.hidden:
        // App is hidden - keep listening for real-time notifications
        // Don't stop listening as we want notifications to work in background
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'Le Bon Tempérament',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _getThemeMode(themeMode),
      routerConfig: AppRouter.router,
      debugShowCheckedModeBanner: false,
      locale: const Locale('fr', 'FR'),
      supportedLocales: const [
        Locale('en', 'US'), // Fallback to English
        Locale('fr', 'FR'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
    );
  }

  ThemeMode _getThemeMode(AppThemeMode appThemeMode) {
    switch (appThemeMode) {
      case AppThemeMode.light:
        return ThemeMode.light;
      case AppThemeMode.dark:
        return ThemeMode.dark;
      case AppThemeMode.system:
        return ThemeMode.system;
    }
  }
}
