import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_fonts.dart';
import '../../../../core/widgets/stage.dart';
import '../../../../data/models/concert.dart';

/// Opens [url] outside the app (browser, mail, maps). Says so when nothing
/// on the phone can open it.
Future<void> openExternal(BuildContext context, String url) async {
  var opened = false;
  try {
    opened = await launchUrl(
      Uri.parse(url),
      mode: LaunchMode.externalApplication,
    );
  } catch (_) {}
  if (!opened && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Impossible d’ouvrir le lien.')),
    );
  }
}

/// The big title of a public tab, with an optional line under it.
class PublicPageTitle extends StatelessWidget {
  const PublicPageTitle({super.key, required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(
            title,
            style: AppFonts.display(
              fontSize: 28,
              fontWeight: FontWeight.w700,
              color: scheme.onSurface,
              height: 1.15,
            ),
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: AppFonts.sans(
              fontSize: 15,
              height: 1.4,
              color: scheme.onSurfaceVariant,
            ),
          ),
        ],
      ],
    );
  }
}

/// « samedi 14 novembre · 20 h · Église Saint-Martin, Saverne ».
String concertMeta(Concert concert) {
  final date = DateTime.tryParse(concert.date);
  return [
    if (date != null) longDate(date),
    frenchTime(concert.time),
    concertPlace(concert),
  ].where((s) => s.isNotEmpty).join(' · ');
}

/// The venue and its town when the concert has them, else the free-text
/// place.
String concertPlace(Concert concert) {
  final venue = concert.venueName?.trim() ?? '';
  final city = concert.city?.trim() ?? '';
  if (venue.isEmpty) return concert.place.trim();
  if (city.isEmpty || venue.contains(city)) return venue;
  return '$venue, $city';
}

/// A concert in the public lists: its poster when it has one, the date
/// tile, the name and where and when.
class PublicConcertCard extends StatelessWidget {
  const PublicConcertCard({
    super.key,
    required this.concert,
    required this.onTap,
    this.showPoster = false,
  });

  final Concert concert;
  final VoidCallback onTap;

  /// The poster above the text (the next concert on the home tab).
  final bool showPoster;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final date = DateTime.tryParse(concert.date);
    final name = concert.name?.trim().isNotEmpty == true
        ? concert.name!.trim()
        : 'Concert';
    final meta = concertMeta(concert);
    final poster = concert.affiche?.trim() ?? '';

    final details = Row(
      children: [
        if (date != null) StageDateTile(date: date),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              StageEyebrow(
                date != null ? 'Concert · ${relativeDays(date)}' : 'Concert',
              ),
              const SizedBox(height: 4),
              Text(
                name,
                style: AppFonts.display(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: scheme.onSurface,
                  height: 1.15,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                meta,
                style: AppFonts.sans(
                  fontSize: 14,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 6),
        Icon(Icons.chevron_right_rounded, color: scheme.onSurfaceVariant),
      ],
    );

    return StageCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      semanticLabel:
          'Concert${date != null ? ' ${relativeDays(date)}' : ''}, $name, '
          '$meta',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (showPoster && poster.isNotEmpty)
            AspectRatio(
              aspectRatio: 16 / 9,
              child: CachedNetworkImage(
                imageUrl: poster,
                fit: BoxFit.cover,
                alignment: Alignment.topCenter,
                placeholder: (_, _) =>
                    ColoredBox(color: scheme.surfaceContainer),
                errorWidget: (_, _, _) =>
                    ColoredBox(color: scheme.surfaceContainer),
              ),
            ),
          Padding(padding: const EdgeInsets.all(14), child: details),
        ],
      ),
    );
  }
}

/// Rows of links and switches on a soft card, like the members' profile.
class PublicTileGroup extends StatelessWidget {
  const PublicTileGroup({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.outline.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                thickness: 1,
                indent: 60,
                color: scheme.outline.withValues(alpha: 0.2),
              ),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// One row of a [PublicTileGroup]: an icon, a title and a line under it,
/// then a chevron (or [trailing]).
class PublicTile extends StatelessWidget {
  const PublicTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
    this.trailing,
    this.external = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;

  /// Opens outside the app: an « open in new » arrow instead of a chevron.
  final bool external;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final row = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: scheme.surface,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: scheme.primary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppFonts.sans(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: scheme.onSurface,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: AppFonts.sans(
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),
          trailing ??
              Icon(
                external
                    ? Icons.open_in_new_rounded
                    : Icons.arrow_forward_ios_rounded,
                size: external ? 18 : 16,
                color: scheme.onSurfaceVariant,
              ),
        ],
      ),
    );
    if (onTap == null) return row;
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap!();
      },
      borderRadius: BorderRadius.circular(16),
      child: row,
    );
  }
}

/// Section title over a [PublicTileGroup].
class PublicSectionTitle extends StatelessWidget {
  const PublicSectionTitle(this.title, {super.key});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        title,
        style: AppFonts.sans(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}
