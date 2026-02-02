import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_app/core/constants/ui_constants.dart';
import 'package:mobile_app/data/models/concert.dart';
import 'package:mobile_app/data/models/rehearsal.dart';
import 'package:mobile_app/data/providers/data_providers.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../../../main/presentation/providers/main_navigation_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              20.0,
              60.0,
              20.0,
              kFloatingNavBarBottomPadding,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate(
                [
                  const _WelcomeHeader(),
                  const SizedBox(height: 40),
                  const _SectionTitle(title: 'Prochains événements'),
                  const SizedBox(height: 16),
                  const _UpcomingEvents(), // Renamed for clarity
                  const SizedBox(height: 40),
                  const _InfoCard(),
                  const SizedBox(height: 24),
                  const _BetaNoticeCard(),
                ],
              ),
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

// --- THE NEW DYNAMIC WIDGET ---
class _UpcomingEvents extends ConsumerWidget {
  const _UpcomingEvents();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationNotifier = ref.read(mainNavigationProvider.notifier);
    final isSuperadmin = ref.watch(isSuperadminProvider).valueOrNull ?? false;

    // Watch our new providers from data_providers.dart
    final nextRehearsals = ref.watch(homeUpcomingRehearsalsProvider);
    final nextConcerts = ref.watch(homeUpcomingConcertsProvider);

    return FadeInUp(
      delay: 300,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- Upcoming Rehearsals Section ---
          Row(
            children: [
              if (nextRehearsals.isNotEmpty)
                Expanded(
                  // Rehearsals are on tab index 3.
                  child: _buildRehearsalCard(context, nextRehearsals[0],
                      () => navigationNotifier.setTab(3)),
                )
              else
                Expanded(
                    child: _buildPlaceholderCard(
                        context, 'Aucune répétition à venir')),
              const SizedBox(width: 16),
              if (nextRehearsals.length > 1)
                Expanded(
                  child: _buildRehearsalCard(context, nextRehearsals[1],
                      () => navigationNotifier.setTab(3)),
                )
              else
                Expanded(
                    child: _buildPlaceholderCard(
                        context, 'Pas d\'autre répétition')),
            ],
          ),
          const SizedBox(height: 16),
          // --- Upcoming Concerts Section ---
          Row(
            children: [
              if (nextConcerts.isNotEmpty)
                Expanded(
                  // Concerts are on tab index 2. Adjust if needed.
                  child: _buildConcertCard(context, nextConcerts[0],
                      () => navigationNotifier.setTab(2)),
                )
              else
                Expanded(
                    child: _buildPlaceholderCard(
                        context, 'Aucun concert à venir')),
              const SizedBox(width: 16),
              if (nextConcerts.length > 1)
                Expanded(
                  child: _buildConcertCard(context, nextConcerts[1],
                      () => navigationNotifier.setTab(2)),
                )
              else
                Expanded(
                    child:
                        _buildPlaceholderCard(context, 'Pas d\'autre concert')),
            ],
          ),

          // --- Existing Conditional Admin Card ---
          if (isSuperadmin) ...[
            const SizedBox(height: 16),
            _NavigationCard(
              icon: Icons.local_shipping_outlined,
              title: 'Suivi Livraison',
              subtitle: 'Partager votre position en temps réel',
              onTap: () => context.push('/driver-tracking'),
              isHighlighted: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildRehearsalCard(
      BuildContext context, Rehearsal rehearsal, VoidCallback onTap) {
    return _EventNavigationCard(
      icon: Icons.repeat_rounded,
      title: formatDate(rehearsal.date!),
      subtitle:
          '${rehearsal.startTime ?? ""} · ${rehearsal.place ?? "Lieu non défini"}',
      onTap: onTap,
    );
  }

  Widget _buildConcertCard(
      BuildContext context, Concert concert, VoidCallback onTap) {
    return _EventNavigationCard(
      icon: Icons.celebration_outlined,
      title: formatDate(concert.date),
      subtitle: '${concert.time} · ${concert.place}',
      onTap: onTap,
    );
  }

  Widget _buildPlaceholderCard(BuildContext context, String text) {
    final theme = Theme.of(context);
    return Container(
      height: 112, // Match the height of a regular card
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.1)),
      ),
      child: Center(
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurfaceVariant,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _EventNavigationCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _EventNavigationCard({
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
        height: 112, // Fixed height for layout consistency
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: theme.colorScheme.primary, size: 22),
            ),
            const Spacer(),
            Text(
              title,
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onSurface,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
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

class _NavigationCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool isHighlighted;

  const _NavigationCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.isHighlighted = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final bgColor = isHighlighted
        ? theme.colorScheme.primaryContainer
        : theme.colorScheme.surfaceVariant.withOpacity(0.5);
    final iconColor = isHighlighted
        ? theme.colorScheme.onPrimaryContainer
        : theme.colorScheme.primary;

    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
          ],
        ),
      ),
    );
  }
}

// ... (The rest of your file: _InfoCard, _BetaNoticeCard, etc., can remain exactly the same)
// ... (omitting for brevity, just copy them from your original file)
class _InfoCard extends ConsumerWidget {
  const _InfoCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final navigationNotifier = ref.read(mainNavigationProvider.notifier);

    return FadeInUp(
      delay: 400,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          // Navigate to Profile -> About
          navigationNotifier.setTab(4);
          Navigator.of(context).push(MaterialPageRoute(builder: (context) {
            // Placeholder, assuming you have an AboutScreen
            // you might need to import it.
            return const Scaffold(body: Center(child: Text("About Screen")));
          }));
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: theme.colorScheme.secondaryContainer.withOpacity(0.4),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: theme.colorScheme.outline.withOpacity(0.15),
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.info_outline_rounded,
                color: theme.colorScheme.onSecondaryContainer,
                size: 24,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Le Bon Tempérament',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: theme.colorScheme.onSecondaryContainer,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Ensemble vocal et instrumental à Saverne depuis 1987. '
                      'Chœurs adultes, jeunes et enfants · Orchestre depuis 2023.',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        height: 1.35,
                        color: theme.colorScheme.onSecondaryContainer
                            .withOpacity(0.9),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Voir plus dans Profil → À propos',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 14,
                color: theme.colorScheme.onSecondaryContainer.withOpacity(0.6),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BetaNoticeCard extends StatelessWidget {
  const _BetaNoticeCard();

  Future<void> _launchEmail(BuildContext context) async {
    final uri = Uri(
      scheme: 'mailto',
      path:
          'contactlebontemperament@gmail.com', // Replace with your support email
      query: Uri(queryParameters: {
        'subject': 'Retour version bêta - Le Bon Tempérament',
      }).query,
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Impossible d\'ouvrir l\'application email.')),
      );
    }
  }

  Future<void> _launchWhatsApp(BuildContext context) async {
    final uri = Uri.parse(
      'https://wa.me/YOUR_PHONE_NUMBER', // Replace with your support WhatsApp number
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir WhatsApp.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FadeInUp(
      delay: 500,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.6),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: theme.colorScheme.primary.withOpacity(0.25),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.science_outlined,
                        size: 16,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Bêta',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'Application en version bêta',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Cette application est en cours de développement. '
              'Merci de signaler tout bug ou suggestion pour nous aider à l\'améliorer.',
              style: GoogleFonts.poppins(
                fontSize: 13,
                height: 1.4,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: _ContactButton(
                    icon: Icons.email_outlined,
                    label: 'Email',
                    onTap: () => _launchEmail(context),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ContactButton(
                    icon: Icons.message_outlined,
                    label: 'WhatsApp',
                    onTap: () => _launchWhatsApp(context),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
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
    return FilledButton.tonalIcon(
      onPressed: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      icon: Icon(icon, size: 18),
      label: Text(label),
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        textStyle: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
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
    _opacity = Tween<double>(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(begin: 30.0, end: 0.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

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
