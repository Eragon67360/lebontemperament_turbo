import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';

import '../../../../data/models/event.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({super.key});

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen> {
  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
  }

  Future<void> _onRefresh() async {
    ref.invalidate(realtimeEventsProvider);
    ref.invalidate(refreshTriggerProvider);
  }

  @override
  Widget build(BuildContext context) {
    final eventsAsync = ref.watch(upcomingEventsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surfaceContainerHighest,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // --- 1. Dynamic App Bar ---
            _EventsAppBar(
              onLogout: () async {
                try {
                  await ref.read(authServiceProvider).signOut();
                  if (mounted) context.go('/login');
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Erreur lors de la déconnexion: $e'),
                        backgroundColor: theme.colorScheme.error,
                      ),
                    );
                  }
                }
              },
            ),

            // --- 2. Main Content based on State ---
            eventsAsync.when(
              data: (events) {
                if (events.isEmpty) {
                  return const SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyState(),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    20,
                    10,
                    20,
                    kFloatingNavBarBottomPadding,
                  ),
                  sliver: SliverList.builder(
                    itemCount: events.length,
                    itemBuilder: (context, index) {
                      final event = events[index];
                      return FadeInUp(
                        delay: 100 + (index * 50),
                        child: _EventCard(
                          event: event,
                          isLast: index == events.length - 1,
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const SliverFillRemaining(child: _LoadingState()),
              error: (error, stack) => SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorState(onRetry: _onRefresh),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - UI Components

class _EventsAppBar extends StatelessWidget {
  final VoidCallback onLogout;
  const _EventsAppBar({required this.onLogout});

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
          'Événements à venir',
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12.0),
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
          borderRadius: BorderRadius.circular(19),
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
              if (event.description != null && event.description!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                  child: Text(
                    event.description!,
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

// MARK: - State Handling & Helpers

// A small data class for theming event types
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
    String formattedDate = DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(date);
    if (time != null) {
      final timeParts = time.split(':');
      if (timeParts.length >= 2) {
        return '$formattedDate à ${timeParts[0]}h${timeParts[1]}';
      }
    }
    return formattedDate;
  } catch (e) {
    return dateFrom;
  }
}

// NOTE: EmptyState, LoadingState, ErrorState, and FadeInUp are the same as in the previous files.
// I've omitted them here for brevity, but you should include them in your file.
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

class _EmptyState extends StatelessWidget {
  const _EmptyState();

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
                Icons.music_off_outlined,
                size: 72,
                color: theme.colorScheme.onSurfaceVariant.withValues(
                  alpha: 0.5,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Aucun évènement à venir',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Les prochains évènements organisés par notre association apparaîtront ici.',
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
                'Nous n\'avons pas pu charger les concerts. Vérifiez votre connexion et réessayez.',
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
