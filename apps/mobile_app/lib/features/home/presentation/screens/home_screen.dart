import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart'; // Add `google_fonts` to your pubspec.yaml
import 'package:mobile_app/core/constants/ui_constants.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../main/presentation/providers/main_navigation_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: CustomScrollView(
        slivers: [
          // We use Slivers for a more dynamic and flexible layout than a simple Column.
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              20.0, // Left padding
              60.0, // Top padding
              20.0, // Right padding
              kFloatingNavBarBottomPadding,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // --- 1. Welcome Header ---
                const _WelcomeHeader(),
                const SizedBox(height: 40),

                // --- 2. Quick Actions ---
                const _SectionTitle(title: 'Actions rapides'),
                const SizedBox(height: 16),
                const _QuickActions(),
                const SizedBox(height: 40),

                // --- 3. App Info & Beta Notice ---
                const _InfoCard(),
                const SizedBox(height: 24),
                const _BetaNoticeCard(),
                const SizedBox(height: 80), // Extra bottom padding for nav bar
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// MARK: - UI Components

class _WelcomeHeader extends ConsumerWidget {
  const _WelcomeHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final displayName = ref.watch(displayNameProvider);
    final theme = Theme.of(context);

    return FadeInUp(
      delay: 100,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary.withOpacity(0.8),
              theme.colorScheme.primary,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.primary.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Bienvenue,',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onPrimary.withOpacity(0.8),
                fontSize: 20,
              ),
            ),
            Text(
              displayName,
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onPrimary,
                fontSize: 28,
                fontWeight: FontWeight.w600,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Voici un aperçu de votre activité.',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onPrimary.withOpacity(0.9),
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      delay: 200,
      child: Text(
        title,
        style: GoogleFonts.poppins(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
    );
  }
}

class _QuickActions extends ConsumerWidget {
  const _QuickActions();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationNotifier = ref.read(mainNavigationProvider.notifier);
    return FadeInUp(
      delay: 300,
      child: Row(
        children: [
          Expanded(
            child: _NavigationCard(
              icon: Icons.music_note_outlined,
              title: 'Répétitions',
              subtitle: 'Voir les répétitions',
              onTap: () => navigationNotifier.setTab(3),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _NavigationCard(
              icon: Icons.person_outline,
              title: 'Profil',
              subtitle: 'Gérer votre profil',
              onTap: () => navigationNotifier.setTab(4),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavigationCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _NavigationCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: theme.colorScheme.primary, size: 24),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onSurface,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      delay: 400,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: theme.colorScheme.secondaryContainer.withOpacity(0.4),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(
              Icons.info_outline,
              color: theme.colorScheme.onSecondaryContainer,
              size: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'À propos',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSecondaryContainer,
                    ),
                  ),
                  Text(
                    'Le Bon Tempérament - Les infos de votre asso',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: theme.colorScheme.onSecondaryContainer.withOpacity(
                        0.8,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BetaNoticeCard extends StatelessWidget {
  const _BetaNoticeCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final betaBgColor = isDark
        ? Colors.yellow.shade900.withOpacity(0.3)
        : Colors.yellow.shade100;
    final betaTextColor =
        isDark ? Colors.yellow.shade200 : Colors.yellow.shade900;

    return FadeInUp(
      delay: 500,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: betaBgColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.bug_report_outlined, color: betaTextColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Application en version bêta',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    color: betaTextColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Cette application est en cours de développement. Merci de signaler tout bug ou suggestion pour nous aider à l\'améliorer.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: betaTextColor.withOpacity(0.8),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _ContactButton(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    onTap: () => _launchEmail(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ContactButton(
                    icon: Icons.message_outlined,
                    label: 'WhatsApp',
                    onTap: () => _launchWhatsApp(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchEmail() async {
    // ... same as your original implementation
  }
  Future<void> _launchWhatsApp() async {
    // ... same as your original implementation
  }
}

class _ContactButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ContactButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final buttonColor = isDark
        ? Colors.yellow.shade800.withOpacity(0.5)
        : Colors.yellow.shade200;
    final buttonTextColor =
        isDark ? Colors.yellow.shade200 : Colors.yellow.shade900;

    return ElevatedButton.icon(
      onPressed: onTap,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        foregroundColor: buttonTextColor,
        backgroundColor: buttonColor,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 12),
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600),
      ),
    );
  }
}

// MARK: - Animation Widget

class FadeInUp extends StatefulWidget {
  final Widget child;
  final int delay;

  const FadeInUp({super.key, required this.child, this.delay = 0});

  @override
  State<FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<FadeInUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<double> _translateY;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _opacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(
      begin: 30.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: _opacity.value,
          child: Transform.translate(
            offset: Offset(0, _translateY.value),
            child: widget.child,
          ),
        );
      },
    );
  }
}
