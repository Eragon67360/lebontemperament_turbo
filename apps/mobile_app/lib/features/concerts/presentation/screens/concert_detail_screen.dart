import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import '../../../../data/models/concert.dart';
import '../../../../data/providers/data_providers.dart';

class ConcertDetailScreen extends ConsumerStatefulWidget {
  final String concertId;
  const ConcertDetailScreen({super.key, required this.concertId});

  @override
  ConsumerState<ConcertDetailScreen> createState() =>
      _ConcertDetailScreenState();
}

class _ConcertDetailScreenState extends ConsumerState<ConcertDetailScreen> {
  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
  }

  @override
  Widget build(BuildContext context) {
    final concertAsync = ref.watch(concertProvider(widget.concertId));
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: concertAsync.when(
        data: (concert) {
          if (concert == null) {
            return _NotFoundState(onBack: () => Navigator.of(context).pop());
          }
          return CustomScrollView(
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
                flexibleSpace: _ConcertDetailHeader(concert: concert),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      FadeInUp(
                          delay: 100,
                          child: _ConcertInfoCard(concert: concert)),
                      const SizedBox(height: 32),
                      const FadeInUp(
                        delay: 200,
                        child: _SectionTitle(
                          title: 'Informations complémentaires',
                        ),
                      ),
                      const SizedBox(height: 16),
                      FadeInUp(
                        delay: 300,
                        child: _AdditionalInformationsCard(
                          text: concert.additionalInformations,
                        ),
                      ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => Center(
          child: CircularProgressIndicator(color: theme.colorScheme.primary),
        ),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Erreur: Impossible de charger les détails du concert.\n$err',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Retour'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// MARK: - Detail Screen UI Components

class _ConcertDetailHeader extends StatelessWidget {
  final Concert concert;
  const _ConcertDetailHeader({required this.concert});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasPoster =
        concert.affiche != null && concert.affiche!.trim().isNotEmpty;

    return FlexibleSpaceBar(
      centerTitle: false,
      titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      background: hasPoster
          ? _buildPosterBackground(context)
          : _buildFallbackBackground(theme),
    );
  }

  Widget _buildPosterBackground(BuildContext context) {
    final theme = Theme.of(context);
    return Stack(
      fit: StackFit.expand,
      children: [
        CachedNetworkImage(
          imageUrl: concert.affiche!,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
            child: Center(
              child: CircularProgressIndicator(
                color: theme.colorScheme.primary,
              ),
            ),
          ),
          errorWidget: (context, url, error) =>
              _buildFallbackBackground(Theme.of(context)),
        ),
        // Gradient overlay for text readability
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getContextText(concert.context),
                    style: GoogleFonts.poppins(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  concert.name ?? 'Concert sans titre',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
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
        ),
      ],
    );
  }

  Widget _buildFallbackBackground(ThemeData theme) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primaryContainer.withOpacity(0.5),
            theme.colorScheme.primaryContainer,
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: Icon(
              Icons.music_note_outlined,
              size: 200,
              color: theme.colorScheme.onPrimaryContainer.withOpacity(0.1),
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
                    color:
                        theme.colorScheme.onPrimaryContainer.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getContextText(concert.context),
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  concert.name ?? 'Concert sans titre',
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
    );
  }
}

class _ConcertInfoCard extends StatelessWidget {
  final Concert concert;
  const _ConcertInfoCard({required this.concert});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          _InfoRow(
            icon: Icons.calendar_today_outlined,
            title: 'Date',
            subtitle: _formatDate(concert.date),
          ),
          Divider(
            height: 24,
            thickness: 0.5,
            color: theme.colorScheme.outline.withOpacity(0.5),
          ),
          _InfoRow(
            icon: Icons.access_time_outlined,
            title: 'Heure',
            subtitle: _formatTime(concert.time),
          ),
          Divider(
            height: 24,
            thickness: 0.5,
            color: theme.colorScheme.outline.withOpacity(0.5),
          ),
          _InfoRow(
            icon: Icons.location_on_outlined,
            title: 'Lieu',
            subtitle: concert.place.isNotEmpty ? concert.place : 'Non spécifié',
          ),
          Divider(
            height: 24,
            thickness: 0.5,
            color: theme.colorScheme.outline.withOpacity(0.5),
          ),
          _InfoRow(
            icon: Icons.music_note_outlined,
            title: 'Contexte',
            subtitle: _getContextText(concert.context),
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

class _AdditionalInformationsCard extends StatelessWidget {
  final String? text;
  const _AdditionalInformationsCard({this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasContent = text != null && text!.trim().isNotEmpty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: Text(
        hasContent ? text! : 'Aucune information complémentaire',
        style: GoogleFonts.poppins(
          color: hasContent
              ? theme.colorScheme.onSurfaceVariant
              : theme.colorScheme.onSurfaceVariant.withOpacity(0.7),
          fontSize: 15,
          height: 1.6,
          fontStyle: hasContent ? FontStyle.normal : FontStyle.italic,
        ),
      ),
    );
  }
}

class _NotFoundState extends StatelessWidget {
  final VoidCallback onBack;

  const _NotFoundState({required this.onBack});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off_outlined,
              size: 64,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'Concert non trouvé',
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () {
                HapticFeedback.lightImpact();
                onBack();
              },
              icon: const Icon(Icons.arrow_back),
              label: const Text('Retour'),
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - Helpers

String _getContextText(Context context) {
  switch (context) {
    case Context.orchestre:
      return 'Orchestre';
    case Context.choeur:
      return 'Chœur';
    case Context.orchestreEtChoeur:
      return 'Orchestre et chœur';
    case Context.autre:
      return 'Autre';
  }
}

String _formatDate(String date) {
  if (date.isEmpty) return 'Non spécifiée';
  try {
    final dateTime = DateTime.parse(date);
    return DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(dateTime);
  } catch (e) {
    return date;
  }
}

String _formatTime(String time) {
  if (time.isEmpty) return 'Non spécifiée';
  try {
    final timeParts = time.split(':');
    if (timeParts.length >= 2) return '${timeParts[0]}h${timeParts[1]}';
  } catch (e) {}
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
