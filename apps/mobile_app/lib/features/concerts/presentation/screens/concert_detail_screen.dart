import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lebontemperament/core/widgets/fade_in_up.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import '../../../../data/models/concert.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../../core/utils/text_scale.dart';
import '../../../public/presentation/widgets/public_widgets.dart';

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
                expandedHeight: headerHeight(context, 250, text: 110),
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
                        child: _ConcertInfoCard(concert: concert),
                      ),
                      FadeInUp(
                        delay: 150,
                        child: _ConcertActions(concert: concert),
                      ),
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
                Icon(
                  Icons.cloud_off_outlined,
                  size: 64,
                  color: theme.colorScheme.error,
                ),
                const SizedBox(height: 16),
                Text(
                  'Impossible de charger ce concert. Vérifiez votre connexion et réessayez.',
                  textAlign: TextAlign.center,
                  style: AppFonts.sans(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () =>
                      ref.invalidate(concertProvider(widget.concertId)),
                  icon: const Icon(Icons.refresh),
                  label: const Text('Réessayer'),
                ),
                const SizedBox(height: 8),
                TextButton.icon(
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
            color: theme.colorScheme.surfaceContainerHighest.withValues(
              alpha: 0.5,
            ),
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
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.8),
                ],
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
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getContextText(concert.context),
                    style: AppFonts.sans(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  concert.name ?? 'Concert sans titre',
                  style: AppFonts.sans(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
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
            theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
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
              color: theme.colorScheme.onPrimaryContainer.withValues(
                alpha: 0.1,
              ),
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
                    color: theme.colorScheme.onPrimaryContainer.withValues(
                      alpha: 0.15,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getContextText(concert.context),
                    style: AppFonts.sans(
                      color: theme.colorScheme.onPrimaryContainer,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  concert.name ?? 'Concert sans titre',
                  style: AppFonts.sans(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.bold,
                    fontSize: 24,
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
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.2),
        ),
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
            color: theme.colorScheme.outline.withValues(alpha: 0.5),
          ),
          _InfoRow(
            icon: Icons.access_time_outlined,
            title: 'Heure',
            subtitle: _formatTime(concert.time),
          ),
          Divider(
            height: 24,
            thickness: 0.5,
            color: theme.colorScheme.outline.withValues(alpha: 0.5),
          ),
          _InfoRow(
            icon: Icons.location_on_outlined,
            title: 'Lieu',
            subtitle: concertAddress(concert) ?? 'Non spécifié',
          ),
          if (concertEntry(concert) case final entry?) ...[
            Divider(
              height: 24,
              thickness: 0.5,
              color: theme.colorScheme.outline.withValues(alpha: 0.5),
            ),
            _InfoRow(
              icon: Icons.confirmation_number_outlined,
              title: 'Entrée',
              subtitle: entry,
            ),
          ],
          Divider(
            height: 24,
            thickness: 0.5,
            color: theme.colorScheme.outline.withValues(alpha: 0.5),
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

/// The venue, its street and its town on separate lines when the concert
/// has them, else the free-text place; null when nothing is known.
String? concertAddress(Concert concert) {
  final venue = concert.venueName?.trim() ?? '';
  final town = [
    concert.postalCode?.trim() ?? '',
    concert.city?.trim() ?? '',
  ].where((s) => s.isNotEmpty).join(' ');
  final lines = [
    venue.isNotEmpty ? venue : concert.place.trim(),
    concert.streetAddress?.trim() ?? '',
    town,
  ].where((s) => s.isNotEmpty).toList();
  return lines.isEmpty ? null : lines.join('\n');
}

/// « Entrée libre », « 15 € » or « 12,50 € »; null when the concert says
/// nothing about it.
String? concertEntry(Concert concert) {
  if (concert.isFree == true) return 'Entrée libre';
  final price = concert.price;
  if (price == null || price <= 0) return null;
  final amount = price == price.roundToDouble()
      ? price.toStringAsFixed(0)
      : price.toStringAsFixed(2).replaceAll('.', ',');
  return '$amount €';
}

/// A maps search for the concert's address, or null without one.
Uri? concertDirectionsUri(Concert concert) {
  final query = [
    concert.venueName?.trim() ?? '',
    concert.streetAddress?.trim() ?? '',
    concert.postalCode?.trim() ?? '',
    concert.city?.trim() ?? '',
  ].where((s) => s.isNotEmpty).join(' ');
  final q = query.isNotEmpty ? query : concert.place.trim();
  if (q.isEmpty) return null;
  return Uri.https('www.google.com', '/maps/search/', {'api': '1', 'query': q});
}

/// « Billets et infos » (the concert's link) and « Itinéraire ».
class _ConcertActions extends StatelessWidget {
  const _ConcertActions({required this.concert});

  final Concert concert;

  @override
  Widget build(BuildContext context) {
    final link = concert.relatedLink?.trim() ?? '';
    final directions = concertDirectionsUri(concert);
    final hasLink = Uri.tryParse(link)?.hasScheme ?? false;
    if (!hasLink && directions == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          if (hasLink)
            FilledButton.icon(
              onPressed: () => openExternal(context, link),
              icon: const Icon(Icons.confirmation_number_outlined),
              label: const Text('Billets et infos'),
            ),
          if (directions != null)
            OutlinedButton.icon(
              onPressed: () => openExternal(context, directions.toString()),
              icon: const Icon(Icons.directions_outlined),
              label: const Text('Itinéraire'),
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
                  style: AppFonts.sans(
                    fontSize: 13,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: AppFonts.sans(
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
      style: AppFonts.sans(
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
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Text(
        hasContent ? text! : 'Aucune information complémentaire',
        style: AppFonts.sans(
          color: hasContent
              ? theme.colorScheme.onSurfaceVariant
              : theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
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
              style: AppFonts.sans(
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
