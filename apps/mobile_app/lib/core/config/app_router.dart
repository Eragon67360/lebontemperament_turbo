import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/events/presentation/screens/event_detail_screen.dart';
import '../../features/events/presentation/screens/events_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/splash/presentation/screens/splash_screen.dart';

class AppRouter {
  static const String splash = '/';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String home = '/home';
  static const String events = '/events';
  static const String eventDetail = '/events/:id';
  static const String profile = '/profile';

  static final GoRouter router = GoRouter(
    initialLocation: splash,
    redirect: (context, state) {
      final container = ProviderScope.containerOf(context);
      final isAuthenticated = container.read(isAuthenticatedProvider);
      final isGoingToLogin = state.matchedLocation == login;
      final isGoingToSplash = state.matchedLocation == splash;

      // Debug logging
      print(
        'Router redirect - isAuthenticated: $isAuthenticated, location: ${state.matchedLocation}',
      );

      // If user is not authenticated and not going to login or splash, redirect to login
      if (!isAuthenticated && !isGoingToLogin && !isGoingToSplash) {
        print('Redirecting to login');
        return login;
      }

      // If user is authenticated and going to login, redirect to home
      if (isAuthenticated && isGoingToLogin) {
        print('Redirecting to home');
        return home;
      }

      // No redirect needed
      print('No redirect needed');
      return null;
    },
    routes: [
      // Splash Screen
      GoRoute(
        path: splash,
        name: 'splash',
        builder: (context, state) =>
            Consumer(builder: (context, ref, _) => const SplashScreen()),
      ),

      // Authentication Routes
      GoRoute(
        path: login,
        name: 'login',
        builder: (context, state) =>
            Consumer(builder: (context, ref, _) => const LoginScreen()),
      ),
      GoRoute(
        path: signup,
        name: 'signup',
        builder: (context, state) => const SignupScreen(),
      ),

      // Main App Routes (protected)
      GoRoute(
        path: home,
        name: 'home',
        builder: (context, state) =>
            Consumer(builder: (context, ref, _) => const HomeScreen()),
      ),
      GoRoute(
        path: events,
        name: 'events',
        builder: (context, state) =>
            Consumer(builder: (context, ref, _) => const EventsScreen()),
      ),
      GoRoute(
        path: eventDetail,
        name: 'eventDetail',
        builder: (context, state) {
          final eventId = state.pathParameters['id']!;
          return Consumer(
            builder: (context, ref, _) => EventDetailScreen(eventId: eventId),
          );
        },
      ),
      GoRoute(
        path: profile,
        name: 'profile',
        builder: (context, state) =>
            Consumer(builder: (context, ref, _) => const ProfileScreen()),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page non trouvée',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'La page que vous recherchez n\'existe pas.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go(home),
              child: const Text('Retour à l\'accueil'),
            ),
          ],
        ),
      ),
    ),
  );
}
