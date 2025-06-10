import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/config/dependency_injection.dart';
import 'core/config/supabase_config.dart';
import 'core/config/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_provider.dart';
import 'data/services/notification_service.dart';
import 'data/providers/realtime_notifications_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await SupabaseConfig.initialize();

  // Initialize dependency injection
  await DependencyInjection.init();

  // Initialize notification service
  await NotificationService().initialize();

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

    // Don't automatically start real-time notifications on app startup
    // Let the user control it from the notification settings
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

    switch (state) {
      case AppLifecycleState.resumed:
        // App came to foreground - check if real-time notifications were enabled
        final isListening = ref.read(realtimeNotificationsProvider);
        if (isListening) {
          // Restart listening if it was previously enabled
          ref
              .read(realtimeNotificationsControllerProvider.notifier)
              .startListening();
        }
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
