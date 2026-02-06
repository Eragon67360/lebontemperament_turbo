import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../widgets/concert_anniversaire_section.dart';

class ConcertsEventsScreen extends ConsumerStatefulWidget {
  const ConcertsEventsScreen({super.key});

  @override
  ConsumerState<ConcertsEventsScreen> createState() =>
      _ConcertsEventsScreenState();
}

class _ConcertsEventsScreenState extends ConsumerState<ConcertsEventsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    ref.invalidate(realtimeConcertsProvider);
    ref.invalidate(realtimeEventsProvider);
    ref.invalidate(refreshTriggerProvider);
  }

  /// Helper to wrap non-list content (Loading/Error) so it sits correctly
  /// under the pinned AppBar in a NestedScrollView.
  Widget _buildScrollableContent(BuildContext context, Widget child) {
    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverOverlapInjector(
          handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
        ),
        SliverFillRemaining(hasScrollBody: false, child: child),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final concertsAsync = ref.watch(upcomingConcertsProvider);
    final eventsAsync = ref.watch(upcomingEventsProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: NestedScrollView(
        // IMPORTANT: The header must contain a SliverOverlapAbsorber
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverOverlapAbsorber(
            handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
            sliver: _ConcertsEventsAppBar(
              onCalendar: () async {
                HapticFeedback.lightImpact();
                final uri = Uri.parse(kGoogleCalendarUrl);
                try {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Impossible d\'ouvrir le calendrier.'),
                      ),
                    );
                  }
                }
              },
              onLogout: () async {
                try {
                  await ref.read(authServiceProvider).signOut();
                  if (!context.mounted) return;
                  context.go('/login');
                } catch (e) {
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur lors de la déconnexion: $e'),
                      backgroundColor: theme.colorScheme.error,
                    ),
                  );
                }
              },
            ),
          ),
          SliverPersistentHeader(
            pinned: true,
            delegate: _SliverTabBarDelegate(
              TabBar(
                controller: _tabController,
                labelColor: theme.colorScheme.primary,
                unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
                indicatorColor: theme.colorScheme.primary,
                indicatorSize: TabBarIndicatorSize.label,
                dividerColor: theme.colorScheme.outlineVariant.withValues(
                  alpha: 0.2,
                ),
                labelStyle: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                unselectedLabelStyle: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                tabs: const [
                  Tab(text: 'Concerts'),
                  Tab(text: 'Évènements'),
                ],
              ),
              theme.colorScheme.surface,
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            // --- TAB 1: CONCERTS ---
            RefreshIndicator(
              onRefresh: _onRefresh,
              color: theme.colorScheme.primary,
              backgroundColor: theme.colorScheme.surfaceContainerHighest,
              // We use Builder here to ensure the context passed to _buildScrollableContent
              // is a descendant of NestedScrollView
              child: Builder(
                builder: (BuildContext context) {
                  return concertsAsync.when(
                    data: (concerts) => _ConcertsList(concerts: concerts),
                    loading: () =>
                        _buildScrollableContent(context, const _LoadingState()),
                    error: (_, __) => _buildScrollableContent(
                      context,
                      _ErrorState(onRetry: _onRefresh),
                    ),
                  );
                },
              ),
            ),
            // --- TAB 2: EVENTS ---
            RefreshIndicator(
              onRefresh: _onRefresh,
              color: theme.colorScheme.primary,
              backgroundColor: theme.colorScheme.surfaceContainerHighest,
              child: Builder(
                builder: (BuildContext context) {
                  return eventsAsync.when(
                    data: (events) => _EventsList(events: events),
                    loading: () =>
                        _buildScrollableContent(context, const _LoadingState()),
                    error: (_, __) => _buildScrollableContent(
                      context,
                      _ErrorState(onRetry: _onRefresh),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - App Bar

class _ConcertsEventsAppBar extends StatelessWidget {
  final VoidCallback onCalendar;
  final VoidCallback onLogout;

  const _ConcertsEventsAppBar({
    required this.onCalendar,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SliverAppBar(
      backgroundColor: theme.colorScheme.surface,
      surfaceTintColor: theme.colorScheme.surface,
      pinned: true,
      floating: true,
      expandedHeight: 120.0,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        centerTitle: false,
        title: Text(
          'Concerts & Évènements',
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.calendar_month_rounded),
          color: theme.colorScheme.onSurfaceVariant,
          tooltip: 'Calendrier complet',
          onPressed: onCalendar,
        ),
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: IconButton(
            icon: const Icon(Icons.logout_outlined),
            color: theme.colorScheme.onSurfaceVariant,
            tooltip: 'Déconnexion',
            onPressed: () {
              HapticFeedback.lightImpact();
              onLogout();
            },
          ),
        ),
      ],
    );
  }
}

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  final Color backgroundColor;

  _SliverTabBarDelegate(this.tabBar, this.backgroundColor);

  @override
  double get minExtent => 48;

  @override
  double get maxExtent => 48;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(color: backgroundColor, child: tabBar);
  }

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) =>
      false;
}

// MARK: - Tab Content Lists

class _ConcertsList extends StatelessWidget {
  final List<Concert> concerts;
  const _ConcertsList({required this.concerts});

  @override
  Widget build(BuildContext context) {
    if (concerts.isEmpty) {
      return CustomScrollView(
        key: const PageStorageKey('concerts_empty'),
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverOverlapInjector(
            handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
          ),
          const SliverFillRemaining(
            hasScrollBody: false,
            child: _EmptyState(
              icon: Icons.music_off_outlined,
              message: 'Aucun concert à venir',
              subMessage: 'Les prochains concerts apparaîtront ici.',
            ),
          ),
        ],
      );
    }

    return CustomScrollView(
      key: const PageStorageKey('concerts_list'),
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverOverlapInjector(
          handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            20,
            16,
            20,
            kFloatingNavBarBottomPadding,
          ),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                // Handle the Anniversaire Section at the end
                if (index == concerts.length) {
                  return const Padding(
                    padding: EdgeInsets.only(top: 8.0),
                    child: ConcertAnniversaireSection(),
                  );
                }

                final concert = concerts[index];
                return FadeInUp(
                  delay: 100 + (index * 50),
                  child: _ConcertCard(
                    concert: concert,
                    isLast: index == concerts.length - 1,
                  ),
                );
              },
              childCount: concerts.length + 1, // +1 for AnniversaireSection
            ),
          ),
        ),
      ],
    );
  }
}

class _EventsList extends StatelessWidget {
  final List<Event> events;
  const _EventsList({required this.events});

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return CustomScrollView(
        key: const PageStorageKey('events_empty'),
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverOverlapInjector(
            handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
          ),
          const SliverFillRemaining(
            hasScrollBody: false,
            child: _EmptyState(
              icon: Icons.event_busy_outlined,
              message: 'Aucun évènement',
              subMessage: 'Aucun événement planifié pour le moment.',
            ),
          ),
        ],
      );
    }

    return CustomScrollView(
      key: const PageStorageKey('events_list'),
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverOverlapInjector(
          handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            20,
            16,
            20,
            kFloatingNavBarBottomPadding,
          ),
          sliver: SliverList.builder(
            itemCount: events.length,
            itemBuilder: (context, index) {
              return FadeInUp(
                delay: 100 + (index * 50),
                child: _EventCard(
                  event: events[index],
                  isLast: index == events.length - 1,
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// MARK: - Cards

class _ConcertCard extends StatelessWidget {
  final Concert concert;
  final bool isLast;

  const _ConcertCard({required this.concert, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    String day = '-';
    String month = '-';
    if (concert.date.isNotEmpty) {
      try {
        final dateTime = DateTime.parse(concert.date);
        day = DateFormat('d', 'fr_FR').format(dateTime);
        month = DateFormat('MMM', 'fr_FR').format(dateTime).toUpperCase();
      } catch (_) {}
    }

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          context.push('/concerts/${concert.id}');
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.5,
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: theme.colorScheme.outline.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              // --- Date Section ---
              SizedBox(
                width: 55,
                child: Column(
                  children: [
                    Text(
                      month,
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      day,
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.bold,
                        fontSize: 32,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Container(
                width: 1,
                height: 60,
                color: theme.colorScheme.outline.withValues(alpha: 0.3),
              ),
              const SizedBox(width: 16),

              // --- Info Section ---
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      concert.name ?? 'Concert sans titre',
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                        fontSize: 17,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    _InfoRow(
                      icon: Icons.location_on_outlined,
                      text: concert.place.isNotEmpty
                          ? concert.place
                          : 'Lieu non spécifié',
                    ),
                    if (concert.time.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      _InfoRow(
                        icon: Icons.access_time_outlined,
                        text: _formatTime(concert.time),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(String time) {
    try {
      final timeParts = time.split(':');
      if (timeParts.length >= 2) {
        return '${timeParts[0]}h${timeParts[1]}';
      }
    } catch (_) {}
    return time;
  }
}

class _EventCard extends StatelessWidget {
  final Event event;
  final bool isLast;

  const _EventCard({required this.event, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final eventTheme = _getEventTypeTheme(event.eventType, theme);

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(
            alpha: 0.5,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: theme.colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            context.push('/events/${event.id}');
          },
          borderRadius: BorderRadius.circular(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: eventTheme.backgroundColor,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        eventTheme.icon,
                        color: eventTheme.iconColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            event.title ?? 'Événement sans titre',
                            style: GoogleFonts.poppins(
                              color: theme.colorScheme.onSurface,
                              fontWeight: FontWeight.w600,
                              fontSize: 17,
                              height: 1.3,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _formatEventDateTime(event.dateFrom, event.time),
                            style: GoogleFonts.poppins(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              if (event.description != null &&
                  event.description!.trim().isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  child: Text(
                    event.description ?? '',
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurfaceVariant.withValues(
                        alpha: 0.8,
                      ),
                      fontSize: 13,
                      height: 1.5,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              Divider(
                height: 1,
                color: theme.colorScheme.outline.withValues(alpha: 0.2),
              ),
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      'Voir les détails',
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Icon(
                      Icons.arrow_forward,
                      size: 16,
                      color: theme.colorScheme.primary,
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

// MARK: - States & Animations

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String subMessage;

  const _EmptyState({
    required this.icon,
    required this.message,
    required this.subMessage,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 72,
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.5,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                message,
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                subMessage,
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.cloud_off_outlined,
                size: 72,
                color: theme.colorScheme.error.withValues(alpha: 0.7),
              ),
              const SizedBox(height: 24),
              Text(
                'Oups, une erreur est survenue',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nous n\'avons pas pu charger les données. Vérifiez votre connexion et réessayez.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: FilledButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

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
      if (mounted) _controller.forward();
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

// MARK: - Helpers

class _EventTypeTheme {
  final IconData icon;
  final Color backgroundColor;
  final Color iconColor;
  _EventTypeTheme({
    required this.icon,
    required this.backgroundColor,
    required this.iconColor,
  });
}

_EventTypeTheme _getEventTypeTheme(EventType eventType, ThemeData theme) {
  switch (eventType) {
    case EventType.concert:
      return _EventTypeTheme(
        icon: Icons.music_note_outlined,
        backgroundColor: theme.colorScheme.primaryContainer,
        iconColor: theme.colorScheme.onPrimaryContainer,
      );
    case EventType.vente:
      return _EventTypeTheme(
        icon: Icons.shopping_cart_outlined,
        backgroundColor: Colors.green.shade100,
        iconColor: Colors.green.shade800,
      );
    case EventType.repetition:
      return _EventTypeTheme(
        icon: Icons.repeat_rounded,
        backgroundColor: Colors.orange.shade100,
        iconColor: Colors.orange.shade800,
      );
    case EventType.sejour:
      return _EventTypeTheme(
        icon: Icons.terrain_outlined,
        backgroundColor: Colors.amber.shade100,
        iconColor: Colors.amber.shade800,
      );
    case EventType.autre:
      return _EventTypeTheme(
        icon: Icons.event_outlined,
        backgroundColor: theme.colorScheme.secondaryContainer,
        iconColor: theme.colorScheme.onSecondaryContainer,
      );
  }
}

String _formatEventDateTime(String? dateFrom, String? time) {
  if (dateFrom == null) return 'Date non spécifiée';
  try {
    final date = DateTime.parse(dateFrom);
    final formattedDate = DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(date);
    if (time != null && time.isNotEmpty) {
      final timeParts = time.split(':');
      if (timeParts.length >= 2) {
        return '$formattedDate à ${timeParts[0]}h${timeParts[1]}';
      }
    }
    return formattedDate;
  } catch (_) {
    return dateFrom;
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.onSurfaceVariant, size: 14),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
