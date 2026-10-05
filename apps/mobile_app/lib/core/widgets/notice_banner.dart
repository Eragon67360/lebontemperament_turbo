import 'package:flutter/material.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';

/// How loud a [NoticeBanner] is.
enum NoticeTone {
  /// Something the member should know but can ignore (cached data).
  info,

  /// Something that affects the service (maintenance, old version).
  warning,
}

/// A compact in-page notice, in the style of the home screen's cards: icon,
/// one-line title, optional detail. Never blocks and never floats over the
/// content (#361).
class NoticeBanner extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? message;
  final NoticeTone tone;

  const NoticeBanner({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.tone = NoticeTone.info,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isWarning = tone == NoticeTone.warning;
    final background = isWarning
        ? scheme.errorContainer
        : scheme.surfaceContainerHighest;
    final foreground = isWarning ? scheme.onErrorContainer : scheme.onSurface;
    final accent = isWarning ? scheme.error : scheme.primary;

    return Semantics(
      container: true,
      liveRegion: true,
      child: Container(
        width: double.infinity,
        constraints: const BoxConstraints(minHeight: 48),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: accent.withValues(alpha: 0.25)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Icon(icon, size: 18, color: accent),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppFonts.sans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: foreground,
                    ),
                  ),
                  if (message != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      message!,
                      style: AppFonts.sans(
                        fontSize: 12,
                        color: foreground.withValues(alpha: 0.85),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "Données hors ligne": the list below comes from the device's cache
/// because the server could not be reached.
class OfflineDataBanner extends StatelessWidget {
  /// Whether the device has a network at all; words the explanation.
  final bool isOnline;

  const OfflineDataBanner({super.key, required this.isOnline});

  @override
  Widget build(BuildContext context) {
    return NoticeBanner(
      icon: Icons.cloud_off_outlined,
      title: 'Données hors ligne',
      message: isOnline
          ? 'Le serveur est injoignable : voici les dernières données '
                'enregistrées sur cet appareil.'
          : 'Pas de connexion : voici les dernières données enregistrées '
                'sur cet appareil.',
    );
  }
}
