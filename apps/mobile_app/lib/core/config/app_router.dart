import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/services/auth_service.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/events/presentation/screens/event_detail_screen.dart';
import '../../features/main/presentation/screens/main_screen.dart';
import '../../features/notifications/presentation/screens/permission_request_screen.dart';
import '../../features/splash/presentation/screens/splash_screen.dart';

// Global auth state listener
class AuthStateListener extends ChangeNotifier {
  static final AuthStateListener _instance = AuthStateListener._internal();
  factory AuthStateListener() => _instance;
  AuthStateListener._internal();

  void notifyAuthStateChanged() {
    notifyListeners();
  }
}

class AppRouter {
  static const String splash = '/';
  static const String permissions = '/permissions';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String main = '/main';
  static const String eventDetail = '/events/:id';

  static GoRouter createRouter() {
    return GoRouter(
      initialLocation: splash,
      redirect: (context, state) {
        // Use the auth service directly to check authentication state
        final authService = AuthService();
        final isAuthenticated = authService.isAuthenticated;
        final isGoingToLogin = state.matchedLocation == login;
        final isGoingToSplash = state.matchedLocation == splash;
        final isGoingToPermissions = state.matchedLocation == permissions;

        // If user is not authenticated and not going to login, splash, or permissions, redirect to login
        if (!isAuthenticated &&
            !isGoingToLogin &&
            !isGoingToSplash &&
            !isGoingToPermissions) {
          return login;
        }

        // If user is authenticated and going to login, redirect to main
        if (isAuthenticated && isGoingToLogin) {
          return main;
        }

        // No redirect needed
        return null;
      },
      refreshListenable: AuthStateListener(),
      routes: [
        // Splash Screen
        GoRoute(
          path: splash,
          name: 'splash',
          builder: (context, state) =>
              Consumer(builder: (context, ref, _) => const SplashScreen()),
        ),

        // Permission Request Screen
        GoRoute(
          path: permissions,
          name: 'permissions',
          builder: (context, state) => Consumer(
            builder: (context, ref, _) => const PermissionRequestScreen(),
          ),
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

        // Main App Route (protected) - contains bottom navigation
        GoRoute(
          path: main,
          name: 'main',
          builder: (context, state) =>
              Consumer(builder: (context, ref, _) => const MainScreen()),
        ),

        // Event Detail Route (protected)
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
                onPressed: () => context.go(main),
                child: const Text('Retour à l\'accueil'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static final router = createRouter();
}
