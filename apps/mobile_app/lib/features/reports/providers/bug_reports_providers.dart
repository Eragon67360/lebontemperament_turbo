import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/bug_report.dart';
import '../../../data/services/bug_reports_service.dart';

final bugReportsServiceProvider = Provider<BugReportsService>(
  (ref) => SupabaseBugReportsService(),
);

/// Profil › Mes signalements.
final myBugReportsProvider = FutureProvider.autoDispose<List<BugReport>>(
  (ref) => ref.watch(bugReportsServiceProvider).myReports(),
);

/// Profil › Signalements reçus (superadmins).
final allBugReportsProvider = FutureProvider.autoDispose<List<BugReport>>(
  (ref) => ref.watch(bugReportsServiceProvider).allReports(),
);

final bugReportProvider = FutureProvider.autoDispose.family<BugReport?, String>(
  (ref, id) => ref.watch(bugReportsServiceProvider).report(id),
);

final bugMessagesProvider = FutureProvider.autoDispose
    .family<List<BugMessage>, String>(
      (ref, id) => ref.watch(bugReportsServiceProvider).messages(id),
    );

/// Links to screenshots. The key is the paths joined by new lines: a list
/// doesn't compare by value, so it would reload on every rebuild.
final bugScreenshotUrlsProvider = FutureProvider.autoDispose
    .family<List<String>, String>(
      (ref, joinedPaths) => ref
          .watch(bugReportsServiceProvider)
          .screenshotUrls(
            joinedPaths.isEmpty ? const [] : joinedPaths.split('\n'),
          ),
    );

/// The member's reports with an answer they haven't read.
int unreadReplies(List<BugReport> reports, String? userId) =>
    userId == null ? 0 : reports.where((r) => r.unreadFor(userId) > 0).length;

/// For a superadmin: reports never opened, or with a message from their
/// author not read yet.
int unreadInInbox(List<BugReport> reports, String? userId) => reports
    .where(
      (r) =>
          (!r.isRead && r.reportedBy != userId) ||
          (userId != null && r.unreadFor(userId) > 0),
    )
    .length;

/// Profil's « Mes signalements » subtitle count; 0 when it can't be read.
final myUnreadRepliesProvider = FutureProvider.autoDispose<int>((ref) async {
  final reports = await ref.watch(myBugReportsProvider.future);
  return unreadReplies(
    reports,
    ref.watch(bugReportsServiceProvider).currentUserId,
  );
});

/// Profil's « Signalements reçus » subtitle count.
final inboxUnreadProvider = FutureProvider.autoDispose<int>((ref) async {
  final reports = await ref.watch(allBugReportsProvider.future);
  return unreadInInbox(
    reports,
    ref.watch(bugReportsServiceProvider).currentUserId,
  );
});
