import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../../data/models/bug_report.dart';
import '../../providers/bug_reports_providers.dart';

/// « aujourd’hui, 14 h 05 », « hier, 9 h », « 7 oct., 18 h 30 », and the
/// year when it isn't this one.
String reportDate(DateTime d, {DateTime? now}) {
  final today = now ?? DateTime.now();
  final time = d.minute == 0
      ? '${d.hour} h'
      : '${d.hour} h ${d.minute.toString().padLeft(2, '0')}';
  final day = DateTime(d.year, d.month, d.day);
  final diff = DateTime(today.year, today.month, today.day).difference(day);
  if (diff.inDays == 0) return 'aujourd’hui, $time';
  if (diff.inDays == 1) return 'hier, $time';
  final year = d.year == today.year ? '' : ' ${d.year}';
  return '${d.day} ${monthShort(d)}$year, $time';
}

/// A page under Profil: back arrow, title, then [slivers].
class ReportsPage extends StatelessWidget {
  const ReportsPage({
    super.key,
    required this.title,
    required this.slivers,
    this.actions = const [],
    this.onRefresh,
    this.bottom,
  });

  final String title;
  final List<Widget> slivers;
  final List<Widget> actions;
  final Future<void> Function()? onRefresh;

  /// Pinned under the list (the reply box).
  final Widget? bottom;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    Widget scroll = CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: s.surface,
          surfaceTintColor: s.surface,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            tooltip: 'Retour',
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          title: Text(
            title,
            style: AppFonts.sans(
              color: s.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
          actions: actions,
        ),
        ...slivers,
      ],
    );
    if (onRefresh != null) {
      scroll = RefreshIndicator(onRefresh: onRefresh!, child: scroll);
    }
    return Scaffold(
      backgroundColor: s.surface,
      body: bottom == null
          ? scroll
          : Column(
              children: [
                Expanded(child: scroll),
                bottom!,
              ],
            ),
    );
  }
}

/// The status as a word in a hairline pill: never colour alone.
class ReportStatusPill extends StatelessWidget {
  const ReportStatusPill(this.status, {super.key});
  final BugReportStatus status;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final color = switch (status) {
      BugReportStatus.pending => s.onSurfaceVariant,
      BugReportStatus.inProgress => s.primary,
      BugReportStatus.resolved => s.tertiary,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color),
      ),
      child: Text(
        status.label,
        style: AppFonts.sans(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

/// One report in a list. [showAuthor] for the superadmins' inbox; [unread]
/// adds « Nouveau » next to the status.
class ReportListTile extends StatelessWidget {
  const ReportListTile({
    super.key,
    required this.report,
    required this.onTap,
    this.showAuthor = false,
    this.unread = false,
  });

  final BugReport report;
  final VoidCallback onTap;
  final bool showAuthor;
  final bool unread;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final when = reportDate(report.lastActivity);
    final by = showAuthor ? '${report.authorName} · ' : '';
    final replies = report.messages.length;
    final repliesLabel = replies == 0
        ? 'pas encore de réponse'
        : replies == 1
        ? '1 message'
        : '$replies messages';
    return StageCard(
      onTap: onTap,
      semanticLabel: [
        report.title,
        report.status.label,
        if (unread) 'nouveau',
        if (showAuthor) 'par ${report.authorName}',
        repliesLabel,
        when,
      ].join(', '),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  report.title,
                  style: AppFonts.sans(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: s.onSurface,
                  ),
                ),
              ),
              if (unread) ...[
                const SizedBox(width: 8),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: s.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              ReportStatusPill(report.status),
              if (unread)
                Text(
                  'Nouveau',
                  style: AppFonts.sans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: s.primary,
                  ),
                ),
              Text(
                '$by$repliesLabel · $when',
                style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// A report's screenshots as thumbnails; a tap opens the image full screen.
class ReportScreenshots extends ConsumerWidget {
  const ReportScreenshots({super.key, required this.report});
  final BugReport report;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (report.screenshotPaths.isEmpty) return const SizedBox.shrink();
    final s = Theme.of(context).colorScheme;
    final urls = ref.watch(
      bugScreenshotUrlsProvider(report.screenshotPaths.join('\n')),
    );
    return urls.when(
      loading: () => const SizedBox(
        height: 120,
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (_, _) => Text(
        'Les captures d’écran n’ont pas pu être chargées.',
        style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
      ),
      data: (list) => SizedBox(
        height: 140,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: list.length,
          separatorBuilder: (_, _) => const SizedBox(width: 10),
          itemBuilder: (context, i) => Semantics(
            button: true,
            label: 'Capture ${i + 1} sur ${list.length}, ouvrir en grand',
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => _ScreenshotViewer(url: list[i]),
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: s.outlineVariant),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: list[i],
                    // Signed links change on every read; the path is stable.
                    cacheKey: report.screenshotPaths.length > i
                        ? report.screenshotPaths[i]
                        : null,
                    height: 140,
                    fit: BoxFit.contain,
                    placeholder: (_, _) => const SizedBox(
                      width: 80,
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (_, _, _) => const SizedBox(
                      width: 80,
                      child: Icon(Icons.broken_image_outlined),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ScreenshotViewer extends StatelessWidget {
  const _ScreenshotViewer({required this.url});
  final String url;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          tooltip: 'Fermer',
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Center(
        child: InteractiveViewer(
          maxScale: 4,
          child: CachedNetworkImage(imageUrl: url, fit: BoxFit.contain),
        ),
      ),
    );
  }
}

/// Centered message for an empty list, a missing report or an error, with
/// an optional action.
class ReportsMessage extends StatelessWidget {
  const ReportsMessage({
    super.key,
    required this.icon,
    required this.title,
    required this.text,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 48, 28, 24),
      child: Column(
        children: [
          Icon(icon, size: 40, color: s.primary),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: AppFonts.display(
              fontSize: 19,
              fontWeight: FontWeight.w600,
              color: s.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            text,
            textAlign: TextAlign.center,
            style: AppFonts.sans(
              fontSize: 16,
              height: 1.5,
              color: s.onSurfaceVariant,
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 20),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}
