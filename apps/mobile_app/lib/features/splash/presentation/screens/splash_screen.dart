import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../auth/presentation/providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _textFade;
  late final Animation<double> _textSlide;

  bool _hasNavigated = false; // Flag to ensure navigation only happens once.
  static const _minDisplayTime = Duration(milliseconds: 2500);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _logoScale = Tween<double>(begin: 0.8, end: 1.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn)));
    _textFade = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOut)));
    _textSlide = Tween<double>(begin: 20.0, end: 0.0).animate(CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOut)));

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // --- THIS IS THE CORRECTED NAVIGATION LOGIC ---
  void _navigate() async {
    // Wait for the minimum display time to ensure animations are seen.
    await Future.delayed(_minDisplayTime);

    if (!mounted) return;

    final isAuthenticated = ref.read(isAuthenticatedProvider);
    if (isAuthenticated) {
      context.go('/main');
    } else {
      context.go('/permissions');
    }
  }

  @override
  Widget build(BuildContext context) {
    // We use ref.listen inside the build method. This is the recommended
    // way to handle side-effects like navigation in response to state changes.
    // Listen to authStateProvider (Supabase stream) so we react when the initial
    // auth state is known; authControllerProvider never changes on startup.
    ref.listen(authStateProvider, (previous, next) {
      // We only want to trigger navigation when the auth state is known (not loading),
      // and we haven't already started the navigation process.
      if (!next.isLoading && !_hasNavigated) {
        // Set the flag to true to prevent this from running again.
        setState(() {
          _hasNavigated = true;
        });
        // Start the navigation process.
        _navigate();
      }
    });

    final theme = Theme.of(context);
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary.withValues(alpha: 0.1),
              theme.colorScheme.surface,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  FadeTransition(
                    opacity: _logoFade,
                    child: ScaleTransition(
                      scale: _logoScale,
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: theme.colorScheme.primary,
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.primary
                                  .withValues(alpha: 0.3),
                              blurRadius: 20,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.music_note_rounded,
                          size: 60,
                          color: theme.colorScheme.onPrimary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) => FadeTransition(
                      opacity: _textFade,
                      child: Transform.translate(
                        offset: Offset(0, _textSlide.value),
                        child: child,
                      ),
                    ),
                    child: Column(
                      children: [
                        Text('Le Bon Tempérament',
                            style: GoogleFonts.poppins(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.onSurface,
                            )),
                        const SizedBox(height: 8),
                        Text('Application mobile',
                            style: GoogleFonts.poppins(
                              fontSize: 16,
                              color: theme.colorScheme.onSurfaceVariant,
                            )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              left: 20,
              right: 20,
              bottom: 40,
              child: FadeTransition(
                opacity: _textFade,
                child: const LinearProgressIndicator(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
