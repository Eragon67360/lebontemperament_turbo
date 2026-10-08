import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:logger/logger.dart';

import '../../../../data/models/bug_report.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../../providers/bug_reports_providers.dart';
import '../widgets/report_widgets.dart';

/// One signalement and its conversation: the report, its screenshots, the
/// messages, and the reply box. Opened from the lists and from the push
/// (« /reports/:id »). The member who wrote it and the superadmins see the
/// same screen; superadmins can also change the status.
class ReportConversationScreen extends ConsumerStatefulWidget {
  const ReportConversationScreen({super.key, required this.reportId});
  final String reportId;

  @override
  ConsumerState<ReportConversationScreen> createState() =>
      _ReportConversationScreenState();
}

class _ReportConversationScreenState
    extends ConsumerState<ReportConversationScreen> {
  final _reply = TextEditingController();
  bool _sending = false;
  bool _markedRead = false;

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  /// Once per visit, after the messages are on screen.
  Future<void> _markRead() async {
    if (_markedRead) return;
    _markedRead = true;
    try {
      await ref.read(bugReportsServiceProvider).markRead(widget.reportId);
      ref.invalidate(myBugReportsProvider);
      ref.invalidate(allBugReportsProvider);
    } catch (e) {
      Logger().w('Could not mark report read: $e');
    }
  }

  Future<void> _refresh() async {
    ref.invalidate(bugReportProvider(widget.reportId));
    ref.invalidate(bugMessagesProvider(widget.reportId));
    await ref.read(bugMessagesProvider(widget.reportId).future);
  }

  Future<void> _send(BugReport report, List<BugMessage> messages) async {
    final text = _reply.text.trim();
    if (text.isEmpty || _sending) return;
    final service = ref.read(bugReportsServiceProvider);
    final me = service.currentUserId;
    // The author writes to whoever answered last; anyone else to the author.
    String? receiver;
    if (me == report.reportedBy) {
      for (final m in messages.reversed) {
        if (m.senderId != me) {
          receiver = m.senderId;
          break;
        }
      }
    } else {
      receiver = report.reportedBy;
    }
    setState(() => _sending = true);
    try {
      await service.sendMessage(
        reportId: report.id,
        message: text,
        receiverId: receiver,
      );
      HapticFeedback.lightImpact();
      _reply.clear();
      ref.invalidate(bugMessagesProvider(report.id));
      ref.invalidate(myBugReportsProvider);
      ref.invalidate(allBugReportsProvider);
    } catch (e) {
      Logger().w('Reply not sent: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Le message n’a pas pu être envoyé. Vérifiez votre connexion.',
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _setStatus(BugReportStatus status) async {
    try {
      await ref
          .read(bugReportsServiceProvider)
          .setStatus(widget.reportId, status);
      ref.invalidate(bugReportProvider(widget.reportId));
      ref.invalidate(allBugReportsProvider);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Statut : ${status.label}')));
      }
    } catch (e) {
      Logger().w('Status not changed: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Le statut n’a pas pu être changé.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final reportAsync = ref.watch(bugReportProvider(widget.reportId));
    final messagesAsync = ref.watch(bugMessagesProvider(widget.reportId));
    final superadmin = ref.watch(isSuperadminProvider).value == true;
    final me = ref.watch(bugReportsServiceProvider).currentUserId;

    final report = reportAsync.value;
    if (report != null && messagesAsync.hasValue) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _markRead());
    }

    return ReportsPage(
      title: 'Signalement',
      onRefresh: _refresh,
      actions: [
        if (superadmin && report != null)
          PopupMenuButton<BugReportStatus>(
            tooltip: 'Changer le statut',
            icon: const Icon(Icons.flag_outlined),
            initialValue: report.status,
            onSelected: _setStatus,
            itemBuilder: (_) => [
              for (final s in BugReportStatus.values)
                CheckedPopupMenuItem(
                  value: s,
                  checked: s == report.status,
                  child: Text(s.label),
                ),
            ],
          ),
      ],
      bottom: report == null
          ? null
          : _ReplyBox(
              controller: _reply,
              sending: _sending,
              onSend: () => _send(report, messagesAsync.value ?? const []),
            ),
      slivers: [
        ...switch (reportAsync) {
          AsyncData(value: null) => [
            const SliverToBoxAdapter(
              child: ReportsMessage(
                icon: Icons.search_off_rounded,
                title: 'Signalement introuvable',
                text: 'Il a peut-être été supprimé.',
              ),
            ),
          ],
          AsyncError() when report == null => [
            SliverToBoxAdapter(
              child: ReportsMessage(
                icon: Icons.cloud_off_outlined,
                title: 'Impossible de charger le signalement',
                text: 'Vérifiez votre connexion, puis réessayez.',
                actionLabel: 'Réessayer',
                onAction: _refresh,
              ),
            ),
          ],
          _ when report == null => [
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.only(top: 64),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
          ],
          _ => [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              sliver: SliverToBoxAdapter(
                child: _ReportHeader(
                  report: report,
                  mine: report.reportedBy == me,
                  superadmin: superadmin,
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              sliver: _Messages(
                messages: messagesAsync,
                me: me,
                report: report,
                onRetry: _refresh,
              ),
            ),
          ],
        },
      ],
    );
  }
}

class _ReportHeader extends ConsumerWidget {
  const _ReportHeader({
    required this.report,
    required this.mine,
    required this.superadmin,
  });

  final BugReport report;
  final bool mine;
  final bool superadmin;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = Theme.of(context).colorScheme;
    final who = mine ? 'Envoyé' : 'Signalé par ${report.authorName}';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(
            report.title,
            style: AppFonts.display(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: s.onSurface,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 6,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            ReportStatusPill(report.status),
            Text(
              '$who ${reportDate(report.createdAt)}',
              style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SelectableText(
          report.description,
          style: AppFonts.sans(fontSize: 16, height: 1.5, color: s.onSurface),
        ),
        if (report.screenshotPaths.isNotEmpty) ...[
          const SizedBox(height: 16),
          ReportScreenshots(report: report),
        ],
        if (superadmin && report.appInfo != null) ...[
          const SizedBox(height: 12),
          Text(
            'Application ${report.appInfo}',
            style: AppFonts.sans(fontSize: 13, color: s.onSurfaceVariant),
          ),
        ],
        const SizedBox(height: 20),
        Divider(height: 1, color: s.outlineVariant),
      ],
    );
  }
}

class _Messages extends StatelessWidget {
  const _Messages({
    required this.messages,
    required this.me,
    required this.report,
    required this.onRetry,
  });

  final AsyncValue<List<BugMessage>> messages;
  final String? me;
  final BugReport report;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final list = messages.value;
    if (list == null) {
      return SliverToBoxAdapter(
        child: messages.hasError
            ? ReportsMessage(
                icon: Icons.cloud_off_outlined,
                title: 'Messages indisponibles',
                text: 'Vérifiez votre connexion, puis réessayez.',
                actionLabel: 'Réessayer',
                onAction: onRetry,
              )
            : const Center(child: CircularProgressIndicator()),
      );
    }
    if (list.isEmpty) {
      final mine = report.reportedBy == me;
      return SliverToBoxAdapter(
        child: Text(
          mine
              ? 'Pas encore de réponse. Vous recevrez une notification dès '
                    'qu’on vous répond.'
              : 'Pas encore de message. ${report.authorName} recevra votre '
                    'réponse en notification.',
          style: AppFonts.sans(
            fontSize: 15,
            height: 1.5,
            color: s.onSurfaceVariant,
          ),
        ),
      );
    }
    return SliverList.separated(
      itemCount: list.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, i) =>
          _Bubble(message: list[i], mine: list[i].senderId == me),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.mine});
  final BugMessage message;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final who = mine ? 'Vous' : message.senderName;
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.82,
        ),
        child: Semantics(
          container: true,
          label: '$who, ${reportDate(message.createdAt)}',
          child: Container(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
            decoration: BoxDecoration(
              color: mine ? s.primaryContainer : s.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: mine ? s.primaryContainer : s.outlineVariant,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ExcludeSemantics(
                  child: Text(
                    '$who · ${reportDate(message.createdAt)}',
                    style: AppFonts.sans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: mine ? s.onPrimaryContainer : s.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                SelectableText(
                  message.message,
                  style: AppFonts.sans(
                    fontSize: 16,
                    height: 1.45,
                    color: mine ? s.onPrimaryContainer : s.onSurface,
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

class _ReplyBox extends StatelessWidget {
  const _ReplyBox({
    required this.controller,
    required this.sending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool sending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Material(
      color: s.surface,
      child: SafeArea(
        top: false,
        child: Container(
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: s.outlineVariant)),
          ),
          padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  enabled: !sending,
                  minLines: 1,
                  maxLines: 5,
                  textCapitalization: TextCapitalization.sentences,
                  inputFormatters: [LengthLimitingTextInputFormatter(4000)],
                  style: AppFonts.sans(),
                  decoration: InputDecoration(
                    hintText: 'Votre message…',
                    hintStyle: AppFonts.sans(color: s.onSurfaceVariant),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
              IconButton.filled(
                onPressed: sending ? null : onSend,
                tooltip: 'Envoyer',
                icon: sending
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: s.onPrimary,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
