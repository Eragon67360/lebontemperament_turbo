import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';

import '../../../../data/models/bug_report.dart';
import '../../providers/bug_reports_providers.dart';
import '../widgets/report_widgets.dart';
import 'report_conversation_screen.dart';
import 'report_problem_screen.dart';

enum _InboxFilter {
  open('À traiter'),
  resolved('Résolus'),
  all('Tous');

  const _InboxFilter(this.label);
  final String label;

  bool keeps(BugReport r) => switch (this) {
    open => r.status != BugReportStatus.resolved,
    resolved => r.status == BugReportStatus.resolved,
    all => true,
  };
}

/// Profil › Mes signalements: what the member sent, the answers first.
class MyReportsScreen extends ConsumerWidget {
  const MyReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reports = ref.watch(myBugReportsProvider);
    final me = ref.watch(bugReportsServiceProvider).currentUserId;

    void openNew() => Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const ReportProblemScreen()));

    return ReportsPage(
      title: 'Mes signalements',
      onRefresh: () => ref.refresh(myBugReportsProvider.future),
      actions: [
        IconButton(
          tooltip: 'Signaler un problème',
          icon: const Icon(Icons.add_rounded),
          onPressed: openNew,
        ),
      ],
      slivers: [
        _ReportList(
          reports: reports,
          me: me,
          showAuthor: false,
          unread: (r) => me != null && r.unreadFor(me) > 0,
          empty: ReportsMessage(
            icon: Icons.mark_chat_unread_outlined,
            title: 'Aucun signalement',
            text:
                'Un souci dans l’application ? Racontez-le nous, avec une '
                'capture d’écran si vous voulez.',
            actionLabel: 'Signaler un problème',
            onAction: openNew,
          ),
          onRetry: () => ref.invalidate(myBugReportsProvider),
        ),
      ],
    );
  }
}

/// Profil › Signalements reçus (superadmins): every report, unread first.
class ReportsInboxScreen extends ConsumerStatefulWidget {
  const ReportsInboxScreen({super.key});

  @override
  ConsumerState<ReportsInboxScreen> createState() => _ReportsInboxScreenState();
}

class _ReportsInboxScreenState extends ConsumerState<ReportsInboxScreen> {
  _InboxFilter _filter = _InboxFilter.open;

  @override
  Widget build(BuildContext context) {
    final reports = ref.watch(allBugReportsProvider);
    final me = ref.watch(bugReportsServiceProvider).currentUserId;
    bool unread(BugReport r) => unreadInInbox([r], me) > 0;

    return ReportsPage(
      title: 'Signalements reçus',
      onRefresh: () => ref.refresh(allBugReportsProvider.future),
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
          sliver: SliverToBoxAdapter(
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final f in _InboxFilter.values)
                  ChoiceChip(
                    label: Text(f.label),
                    selected: _filter == f,
                    onSelected: (_) => setState(() => _filter = f),
                  ),
              ],
            ),
          ),
        ),
        _ReportList(
          reports: reports.whenData(
            (list) => list.where(_filter.keeps).toList(),
          ),
          me: me,
          showAuthor: true,
          unread: unread,
          empty: ReportsMessage(
            icon: Icons.inbox_outlined,
            title: _filter == _InboxFilter.open
                ? 'Rien à traiter'
                : 'Aucun signalement',
            text: _filter == _InboxFilter.open
                ? 'Tous les signalements sont résolus.'
                : 'Les signalements des membres arriveront ici, avec une '
                      'notification.',
          ),
          onRetry: () => ref.invalidate(allBugReportsProvider),
        ),
      ],
    );
  }
}

class _ReportList extends StatelessWidget {
  const _ReportList({
    required this.reports,
    required this.me,
    required this.showAuthor,
    required this.unread,
    required this.empty,
    required this.onRetry,
  });

  final AsyncValue<List<BugReport>> reports;
  final String? me;
  final bool showAuthor;
  final bool Function(BugReport) unread;
  final Widget empty;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final list = reports.value;
    if (list == null) {
      return SliverToBoxAdapter(
        child: reports.hasError
            ? ReportsMessage(
                icon: Icons.cloud_off_outlined,
                title: 'Impossible de charger les signalements',
                text: 'Vérifiez votre connexion, puis réessayez.',
                actionLabel: 'Réessayer',
                onAction: onRetry,
              )
            : const Padding(
                padding: EdgeInsets.only(top: 64),
                child: Center(child: CircularProgressIndicator()),
              ),
      );
    }
    if (list.isEmpty) return SliverToBoxAdapter(child: empty);

    // Unread first, then the most recent activity.
    final sorted = [...list]
      ..sort((a, b) {
        final ua = unread(a), ub = unread(b);
        if (ua != ub) return ua ? -1 : 1;
        return b.lastActivity.compareTo(a.lastActivity);
      });
    final unreadCount = sorted.where(unread).length;

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      sliver: SliverList.list(
        children: [
          if (unreadCount > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                unreadCount == 1 ? '1 nouveau' : '$unreadCount nouveaux',
                style: AppFonts.sans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
          for (final r in sorted) ...[
            ReportListTile(
              report: r,
              showAuthor: showAuthor,
              unread: unread(r),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => ReportConversationScreen(reportId: r.id),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}
