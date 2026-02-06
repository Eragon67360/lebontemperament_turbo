import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/config/app_config.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../../../main/presentation/providers/main_navigation_provider.dart';
import '../../../profile/presentation/screens/about_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              20.0,
              60.0,
              20.0,
              kFloatingNavBarBottomPadding,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const _WelcomeHeader(),
                const SizedBox(height: 32),
                const _UpcomingEventsSection(),
                const SizedBox(height: 32),
                const _SectionHeader(
                  title: 'Espace Membres',
                  icon: Icons.grid_view_rounded,
                ),
                const SizedBox(height: 16),
                const _MembresGrid(),
                const SizedBox(height: 32),
                const _InfoCard(),
                const SizedBox(height: 24),
                const _BetaNoticeCard(),
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
    final photoUrl = ref.watch(profilePictureUrlProvider);
    final theme = Theme.of(context);

    // Dynamic greeting based on time of day
    final now = DateTime.now();
    final hour = now.hour;
    String greetingTime = hour < 18 ? 'Bonjour' : 'Bonsoir';

    return FadeInUp(
      delay: 100,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: theme.colorScheme.primary.withValues(alpha: 0.2),
                    width: 2,
                  ),
                ),
                child: ClipOval(
                  child: photoUrl != null && photoUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: photoUrl,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => _buildInitialsAvatar(
                            theme,
                            displayName.isNotEmpty
                                ? displayName[0].toUpperCase()
                                : '?',
                          ),
                          errorWidget: (_, __, ___) => _buildInitialsAvatar(
                            theme,
                            displayName.isNotEmpty
                                ? displayName[0].toUpperCase()
                                : '?',
                          ),
                        )
                      : _buildInitialsAvatar(
                          theme,
                          displayName.isNotEmpty
                              ? displayName[0].toUpperCase()
                              : '?',
                        ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$greetingTime,',
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      displayName,
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.onSurface,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        height: 1.1,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _buildInitialsAvatar(ThemeData theme, String initial) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: GoogleFonts.poppins(
          color: theme.colorScheme.onPrimaryContainer,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData? icon;
  final VoidCallback? onMoreTap;

  const _SectionHeader({required this.title, this.icon, this.onMoreTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      delay: 200,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
              ],
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.onSurface,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          if (onMoreTap != null)
            InkWell(
              onTap: onMoreTap,
              borderRadius: BorderRadius.circular(20),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Text(
                  'Voir tout',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// MARK: - Event Section (Redesigned)

class _UpcomingEventsSection extends ConsumerWidget {
  const _UpcomingEventsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationNotifier = ref.read(mainNavigationProvider.notifier);
    final isSuperadmin = ref.watch(isSuperadminProvider).value ?? false;

    final nextRehearsals = ref.watch(homeUpcomingRehearsalsProvider);
    final nextConcerts = ref.watch(homeUpcomingConcertsProvider);

    return FadeInUp(
      delay: 300,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. REHEARSALS
          const _SectionHeader(
            title: 'Prochaines répétitions',
            icon: Icons.music_note_rounded,
          ),
          const SizedBox(height: 12),
          if (nextRehearsals.isNotEmpty)
            SizedBox(
              height: 165, // Fixed height for scrolling cards
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                clipBehavior: Clip.none, // Allow shadows to paint outside
                itemCount: nextRehearsals.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  return _RehearsalTicketCard(
                    rehearsal: nextRehearsals[index],
                    onTap: () => navigationNotifier.setTab(2),
                  );
                },
              ),
            )
          else
            _EmptyStateCard(
              message: 'Aucune répétition programmée',
              icon: Icons.event_busy_rounded,
            ),

          const SizedBox(height: 24),

          // 2. CONCERTS
          const _SectionHeader(
            title: 'Concerts & Événements',
            icon: Icons.celebration_rounded,
          ),
          const SizedBox(height: 12),
          if (nextConcerts.isNotEmpty)
            SizedBox(
              height: 155, // Slightly taller for concerts
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                clipBehavior: Clip.none,
                itemCount: nextConcerts.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  return _ConcertTicketCard(
                    concert: nextConcerts[index],
                    onTap: () => navigationNotifier.setTab(1),
                  );
                },
              ),
            )
          else
            _EmptyStateCard(
              message: 'Aucun concert à venir',
              icon: Icons.piano_off_rounded,
            ),

          // 3. ADMIN SPECIAL
          if (isSuperadmin) ...[
            const SizedBox(height: 24),
            _AdminActionCard(
              icon: Icons.local_shipping_outlined,
              title: 'Mode Livraison',
              subtitle: 'Suivi de position en temps réel',
              onTap: () => context.push('/driver-tracking'),
            ),
          ],
        ],
      ),
    );
  }
}

class _RehearsalTicketCard extends StatelessWidget {
  final Rehearsal rehearsal;
  final VoidCallback onTap;

  const _RehearsalTicketCard({required this.rehearsal, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Assuming rehearsal.date is a String based on your snippet
    final dateObj = DateTime.parse(rehearsal.date!);

    return SizedBox(
      width: 260,
      child: Card(
        elevation: 0,
        clipBehavior:
            Clip.antiAlias, // Ensures the child inkwell doesn't overflow
        color: theme.colorScheme.surfaceContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
          ),
        ),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- TOP SECTION (Date & Title) ---
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DateBadge(date: dateObj, color: theme.colorScheme.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary.withValues(
                                alpha: 0.1,
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Répétition',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            formatDate(rehearsal.date!),
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSurface,
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(), // <--- This pushes the bottom row down
              // --- BOTTOM SECTION (Footer style) ---
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHigh.withValues(
                    alpha: 0.3,
                  ),
                  border: Border(
                    top: BorderSide(
                      color: theme.colorScheme.outlineVariant.withValues(
                        alpha: 0.2,
                      ),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    // Time
                    Icon(
                      Icons.schedule_rounded,
                      size: 14,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      formatTime(rehearsal.startTime),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),

                    // Separator dot
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text(
                        '•',
                        style: TextStyle(color: theme.colorScheme.outline),
                      ),
                    ),

                    // Location
                    Expanded(
                      child: Row(
                        children: [
                          Icon(
                            Icons.place_outlined,
                            size: 14,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              rehearsal.place ?? "Lieu non défini",
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ConcertTicketCard extends StatelessWidget {
  final Concert concert;
  final VoidCallback onTap;

  const _ConcertTicketCard({required this.concert, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: 280,
      child: Card(
        elevation: 0,
        color: theme.colorScheme.secondaryContainer.withValues(alpha: 0.4),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: theme.colorScheme.secondary.withValues(alpha: 0.2),
          ),
        ),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _DateBadge(
                      date: DateTime.parse(concert.date),
                      color: theme.colorScheme.secondary,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            concert.name ?? 'Concert',
                            style: GoogleFonts.poppins(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSecondaryContainer,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.schedule,
                        size: 14,
                        color: theme.colorScheme.secondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        formatTime(concert.time),
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(
                        Icons.place,
                        size: 14,
                        color: theme.colorScheme.secondary,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          concert.place,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.onSurface,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _DateBadge extends StatelessWidget {
  final DateTime date;
  final Color color;

  const _DateBadge({required this.date, required this.color});

  @override
  Widget build(BuildContext context) {
    // Helper to get short month name
    final months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            date.day.toString(),
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
              height: 1.0,
            ),
          ),
          Text(
            months[date.month - 1],
            style: GoogleFonts.poppins(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: color,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyStateCard extends StatelessWidget {
  final String message;
  final IconData icon;

  const _EmptyStateCard({required this.message, required this.icon});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.05),
        ),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: theme.colorScheme.outline),
          const SizedBox(height: 8),
          Text(
            message,
            style: GoogleFonts.poppins(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _AdminActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _AdminActionCard({
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
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: theme.colorScheme.tertiaryContainer,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: theme.colorScheme.onTertiaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: theme.colorScheme.tertiaryContainer,
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onTertiaryContainer,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onTertiaryContainer.withValues(
                        alpha: 0.8,
                      ),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_rounded,
              color: theme.colorScheme.onTertiaryContainer,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - Membres Grid (Bento Style)

class _MembresGrid extends ConsumerWidget {
  const _MembresGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigationNotifier = ref.read(mainNavigationProvider.notifier);

    return FadeInUp(
      delay: 350,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final crossAxisCount = constraints.maxWidth > 500 ? 3 : 2;
          return GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
            children: [
              _MembresBentoCard(
                icon: Icons.library_music_rounded,
                title: 'Partitions',
                colorIndex: 0,
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push('/partitions');
                },
              ),
              _MembresBentoCard(
                icon: Icons.calendar_month_rounded,
                title: 'Calendrier',
                colorIndex: 1,
                onTap: () {
                  HapticFeedback.lightImpact();
                  navigationNotifier.setTab(2);
                },
              ),
              _MembresBentoCard(
                icon: Icons.group_rounded,
                title: 'Membres',
                colorIndex: 2,
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push('/members');
                },
              ),
              _MembresBentoCard(
                icon: Icons.description_rounded,
                title: 'Administration',
                colorIndex: 3,
                onTap: () {
                  HapticFeedback.lightImpact();
                  context.push('/administration');
                },
              ),
              _MembresBentoCard(
                icon: Icons.folder_copy_rounded,
                title: 'Drive',
                colorIndex: 4,
                onTap: () async {
                  HapticFeedback.lightImpact();
                  final uri = Uri.parse(AppConfig.driveFolderMain);
                  try {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  } catch (_) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Erreur lien Drive')),
                      );
                    }
                  }
                },
              ),
            ],
          );
        },
      ),
    );
  }
}

class _MembresBentoCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final int colorIndex;
  final VoidCallback onTap;

  const _MembresBentoCard({
    required this.icon,
    required this.title,
    required this.colorIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Generate subtle variations for the bento cards
    final colors = [
      theme.colorScheme.primaryContainer,
      theme.colorScheme.secondaryContainer,
      theme.colorScheme.tertiaryContainer,
      theme.colorScheme.surfaceContainerHigh,
    ];

    final onColors = [
      theme.colorScheme.onPrimaryContainer,
      theme.colorScheme.onSecondaryContainer,
      theme.colorScheme.onTertiaryContainer,
      theme.colorScheme.onSurface,
    ];

    final bgColor = colors[colorIndex % colors.length];
    final fgColor = onColors[colorIndex % onColors.length];

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        decoration: BoxDecoration(
          color: bgColor.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: theme.colorScheme.outline.withValues(alpha: 0.1),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.shadow.withValues(alpha: 0.05),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, size: 28, color: fgColor),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onSurface,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - Info & Footer

class _InfoCard extends StatelessWidget {
  const _InfoCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FadeInUp(
      delay: 400,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
              theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.2),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Le Bon Tempérament',
                    style: GoogleFonts.playfairDisplay(
                      // More elegant font for the name
                      fontWeight: FontWeight.w700,
                      fontSize: 18,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Ensemble vocal et instrumental. \nSaverne, depuis 1987.',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      height: 1.5,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(Icons.music_note, color: theme.colorScheme.primary),
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

    return FadeInUp(
      delay: 500,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: theme.colorScheme.outline.withValues(alpha: 0.1),
          ),
        ),
        child: Row(
          children: [
            Icon(Icons.science, size: 16, color: theme.colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Version Bêta - Signaler un bug',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
            TextButton(
              onPressed: () => _launchEmail(context),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: const Size(50, 30),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'Contacter',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchEmail(BuildContext context) async {
    final subject = Uri.encodeComponent('Feedback App - Le Bon Tempérament');
    final uri = Uri.parse('mailto:$kSupportEmail?subject=$subject');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d\'ouvrir l\'email.')),
        );
      }
    }
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
      duration: const Duration(milliseconds: 600),
    );
    _opacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutQuad));
    _translateY = Tween<double>(
      begin: 20.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutQuad));

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
