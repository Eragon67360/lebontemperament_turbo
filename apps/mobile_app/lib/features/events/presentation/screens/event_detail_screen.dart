import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import '../../../../data/models/event.dart';
import '../../../../data/providers/data_providers.dart';

// IMPORTANT: This screen expects a provider that can fetch a single event by its ID.
// Make sure you have a provider like this defined in your `data_providers.dart` file:
//
// final eventProvider = StreamProvider.family<Event, String>((ref, eventId) {
//   final eventRepository = ref.watch(eventRepositoryProvider);
//   return eventRepository.getEvent(eventId);
// });

class EventDetailScreen extends ConsumerStatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  @override
  void initState() {
    super.initState();
    // Ensure the French locale is initialized for date formatting
    initializeDateFormatting('fr_FR');
  }

  @override
  Widget build(BuildContext context) {
    // Watch the provider for the specific event
    final eventAsync = ref.watch(eventProvider(widget.eventId));
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: eventAsync.when(
        data: (event) => CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              stretch: true,
              expandedHeight: 250.0,
              backgroundColor: theme.colorScheme.surface,
              surfaceTintColor: theme.colorScheme.surface,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => Navigator.of(context).pop(),
                tooltip: 'Retour',
              ),
              flexibleSpace: _EventDetailHeader(event: event as Event),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    FadeInUp(delay: 100, child: _EventInfoCard(event: event)),
                    if (event.description != null &&
                        event.description!.isNotEmpty) ...[
                      const SizedBox(height: 32),
                      const FadeInUp(
                        delay: 200,
                        child: _SectionTitle(
                          title: 'À propos de cet événement',
                        ),
                      ),
                      const SizedBox(height: 16),
                      FadeInUp(
                        delay: 300,
                        child: Text(
                          event.description!,
                          style: GoogleFonts.poppins(
                            color: theme.colorScheme.onSurfaceVariant,
                            fontSize: 15,
                            height: 1.6,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () => Center(
          child: CircularProgressIndicator(color: theme.colorScheme.primary),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Text(
              'Erreur: Impossible de charger les détails de l\'événement.\n$err',
            ),
          ),
        ),
      ),
    );
  }
}

// MARK: - Detail Screen UI Components

class _EventDetailHeader extends StatelessWidget {
  final Event event;
  const _EventDetailHeader({required this.event});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final eventTheme = _getEventTypeTheme(event.eventType, theme);

    return FlexibleSpaceBar(
      centerTitle: false,
      titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      background: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              eventTheme.backgroundColor.withValues(alpha: 0.5),
              eventTheme.backgroundColor,
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: Icon(
                eventTheme.icon,
                size: 200,
                color: eventTheme.iconColor.withValues(alpha: 0.1),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: eventTheme.iconColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _getEventTypeText(event.eventType),
                      style: GoogleFonts.poppins(
                        color: eventTheme.iconColor,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    event.title ?? 'Événement sans titre',
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                      fontSize: 28,
                      height: 1.2,
                    ),
                    maxLines: 3,
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

class _EventInfoCard extends StatelessWidget {
  final Event event;
  const _EventInfoCard({required this.event});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border:
            Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          _InfoRow(
            icon: Icons.calendar_today_outlined,
            title: 'Date',
            subtitle: _formatEventDate(event.dateFrom),
          ),
          if (event.time != null ||
              (event.location != null && event.location!.isNotEmpty))
            Divider(
              height: 24,
              thickness: 0.5,
              color: theme.colorScheme.outline.withValues(alpha: 0.5),
            ),
          if (event.time != null) ...[
            _InfoRow(
              icon: Icons.access_time_outlined,
              title: 'Heure',
              subtitle: _formatTime(event.time!),
            ),
            if (event.location != null && event.location!.isNotEmpty)
              Divider(
                height: 24,
                thickness: 0.5,
                color: theme.colorScheme.outline.withValues(alpha: 0.5),
              ),
          ],
          if (event.location != null && event.location!.isNotEmpty)
            _InfoRow(
              icon: Icons.location_on_outlined,
              title: 'Lieu',
              subtitle: event.location!,
            ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _InfoRow({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: theme.colorScheme.primary, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Theme.of(context).colorScheme.onSurface,
      ),
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

String _getEventTypeText(EventType eventType) {
  switch (eventType) {
    case EventType.concert:
      return 'Concert';
    case EventType.vente:
      return 'Vente';
    case EventType.repetition:
      return 'Répétition';
    case EventType.sejour:
      return 'Séjour';
    case EventType.autre:
      return 'Autre';
  }
}

String _formatEventDate(String? dateFrom) {
  if (dateFrom == null) return 'Non spécifiée';
  try {
    final date = DateTime.parse(dateFrom);
    return DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(date);
  } catch (e) {
    return dateFrom;
  }
}

String _formatTime(String time) {
  try {
    final timeParts = time.split(':');
    if (timeParts.length >= 2) return '${timeParts[0]}h${timeParts[1]}';
  } catch (e) {
    // Return original time if format is unexpected
  }
  return time;
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
