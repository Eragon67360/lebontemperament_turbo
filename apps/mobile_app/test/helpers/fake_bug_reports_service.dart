import 'dart:typed_data';

import 'package:lebontemperament/data/models/bug_report.dart';
import 'package:lebontemperament/data/services/bug_reports_service.dart';

/// Fake ids and names only.
const kMemberId = 'member-test-0001';
const kSuperadminId = 'superadmin-test-0001';

BugReport testReport({
  String id = 'report-test-0001',
  String title = 'Le lecteur s’arrête tout seul',
  String reportedBy = kMemberId,
  BugReportStatus status = BugReportStatus.pending,
  bool isRead = false,
  List<BugMessageSummary> messages = const [],
  List<String> screenshotPaths = const [],
}) => BugReport(
  id: id,
  title: title,
  description: 'Description de test : la musique se coupe après une minute.',
  status: status,
  reportedBy: reportedBy,
  createdAt: DateTime(2099, 3, 4, 18, 30),
  isRead: isRead,
  authorName: 'Membre Test',
  screenshotPaths: screenshotPaths,
  fromApp: true,
  appInfo: '0.0.0 (0) · Android test',
  messages: messages,
);

BugMessage testMessage({
  String id = 'message-test-0001',
  String reportId = 'report-test-0001',
  String senderId = kSuperadminId,
  String text = 'Merci, je regarde ça.',
  bool isRead = false,
}) => BugMessage(
  id: id,
  reportId: reportId,
  senderId: senderId,
  message: text,
  createdAt: DateTime(2099, 3, 4, 19),
  isRead: isRead,
  senderName: senderId == kSuperadminId ? 'Responsable Test' : 'Membre Test',
);

/// Answers from memory and records what the screens asked for.
class FakeBugReportsService implements BugReportsService {
  FakeBugReportsService({
    this.userId = kMemberId,
    List<BugReport>? reports,
    Map<String, List<BugMessage>>? messagesByReport,
    this.failCreate = false,
  }) : reports = reports ?? [],
       messagesByReport = messagesByReport ?? {};

  final String userId;
  final List<BugReport> reports;
  final Map<String, List<BugMessage>> messagesByReport;
  final bool failCreate;

  final uploaded = <String>[];
  final removed = <String>[];
  final created = <Map<String, Object?>>[];
  final sent = <Map<String, Object?>>[];
  final markedRead = <String>[];
  final statuses = <String, BugReportStatus>{};

  @override
  String? get currentUserId => userId;

  @override
  Future<List<BugReport>> myReports() async =>
      reports.where((r) => r.reportedBy == userId).toList();

  @override
  Future<List<BugReport>> allReports() async => reports;

  @override
  Future<BugReport?> report(String id) async {
    for (final r in reports) {
      if (r.id == id) return r;
    }
    return null;
  }

  @override
  Future<List<BugMessage>> messages(String reportId) async =>
      messagesByReport[reportId] ?? const [];

  @override
  Future<String> uploadScreenshot(Uint8List bytes, String contentType) async {
    final path = '$userId/shot-${uploaded.length}';
    uploaded.add(path);
    return path;
  }

  @override
  Future<void> removeScreenshots(List<String> paths) async =>
      removed.addAll(paths);

  @override
  Future<String> createReport({
    required String title,
    required String description,
    required List<String> screenshotPaths,
    required String appInfo,
  }) async {
    if (failCreate) throw Exception('offline');
    created.add({
      'title': title,
      'description': description,
      'screenshotPaths': screenshotPaths,
      'appInfo': appInfo,
    });
    final r = testReport(
      id: 'report-new',
      title: title,
      reportedBy: userId,
      screenshotPaths: screenshotPaths,
    );
    reports.add(r);
    return r.id;
  }

  @override
  Future<void> sendMessage({
    required String reportId,
    required String message,
    String? receiverId,
  }) async {
    sent.add({
      'reportId': reportId,
      'message': message,
      'receiverId': receiverId,
    });
    (messagesByReport[reportId] ??= []).add(
      testMessage(
        id: 'message-sent-${sent.length}',
        reportId: reportId,
        senderId: userId,
        text: message,
      ),
    );
  }

  @override
  Future<void> markRead(String reportId) async => markedRead.add(reportId);

  @override
  Future<void> setStatus(String reportId, BugReportStatus status) async =>
      statuses[reportId] = status;

  @override
  Future<List<String>> screenshotUrls(List<String> paths) async => const [];
}
