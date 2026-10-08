import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/bug_report.dart';
import 'package:lebontemperament/data/services/bug_reports_service.dart';
import 'package:lebontemperament/features/reports/presentation/widgets/report_widgets.dart';
import 'package:lebontemperament/features/reports/providers/bug_reports_providers.dart';

import '../../helpers/fake_bug_reports_service.dart';

void main() {
  group('BugReport.fromJson', () {
    test('reads the report, its author and its message summary', () {
      final r = BugReport.fromJson({
        'id': 'report-test-0001',
        'title': 'Titre de test',
        'description': 'Description de test',
        'status': 'in_progress',
        'reported_by': kMemberId,
        'created_at': '2099-03-04T17:30:00Z',
        'is_read': true,
        'screenshot_paths': ['$kMemberId/a.jpg'],
        'source': 'app',
        'app_info': '0.0.0 (0) · Android test',
        'profiles': {'display_name': 'Membre Test', 'email': 'm@example.com'},
        'bug_messages': [
          {
            'sender_id': kSuperadminId,
            'is_read': false,
            'created_at': '2099-03-05T08:00:00Z',
          },
          {
            'sender_id': kMemberId,
            'is_read': false,
            'created_at': '2099-03-05T09:00:00Z',
          },
        ],
      });
      expect(r.status, BugReportStatus.inProgress);
      expect(r.authorName, 'Membre Test');
      expect(r.screenshotPaths, ['$kMemberId/a.jpg']);
      expect(r.fromApp, isTrue);
      // Only the other side's unread messages count.
      expect(r.unreadFor(kMemberId), 1);
      expect(r.unreadFor(kSuperadminId), 1);
      expect(r.lastActivity, DateTime.parse('2099-03-05T09:00:00Z').toLocal());
    });

    test('an old admin report: no screenshots, unknown status, no name', () {
      final r = BugReport.fromJson({
        'id': 'report-test-0002',
        'title': 'Titre',
        'description': 'Description',
        'status': null,
        'reported_by': kMemberId,
        'created_at': '2099-03-04T17:30:00Z',
        'is_read': null,
        'screenshot_paths': null,
        'source': 'admin',
        'profiles': [
          {'display_name': null, 'email': 'membre@example.com'},
        ],
      });
      expect(r.status, BugReportStatus.pending);
      expect(r.screenshotPaths, isEmpty);
      expect(r.fromApp, isFalse);
      expect(r.authorName, 'membre@example.com');
      expect(r.messages, isEmpty);
      expect(r.lastActivity, r.createdAt);
    });

    test('a message names its sender, « Un membre » when unknown', () {
      final m = BugMessage.fromJson({
        'id': 'message-test-0001',
        'bug_report_id': 'report-test-0001',
        'sender_id': kSuperadminId,
        'message': 'Bonjour',
        'created_at': '2099-03-04T17:30:00Z',
        'is_read': false,
        'sender': null,
      });
      expect(m.senderName, 'Un membre');
    });
  });

  test('unread counts: member answers, superadmin inbox', () {
    final answered = testReport(
      id: 'r1',
      isRead: true,
      messages: [
        BugMessageSummary(
          senderId: kSuperadminId,
          isRead: false,
          createdAt: DateTime(2099),
        ),
      ],
    );
    final unopened = testReport(id: 'r2', isRead: false);
    final ownBySuperadmin = testReport(
      id: 'r3',
      reportedBy: kSuperadminId,
      isRead: false,
    );
    final reply = testReport(
      id: 'r4',
      isRead: true,
      messages: [
        BugMessageSummary(
          senderId: kMemberId,
          isRead: false,
          createdAt: DateTime(2099),
        ),
      ],
    );
    expect(unreadReplies([answered, unopened, reply], kMemberId), 1);
    expect(unreadReplies([answered], null), 0);
    // Not opened yet, and the author's answer; never one's own report.
    expect(
      unreadInInbox([
        answered,
        unopened,
        ownBySuperadmin,
        reply,
      ], kSuperadminId),
      2,
    );
  });

  test('screenshots: JPEG, PNG and WebP pass, anything else is refused', () {
    expect(
      bugScreenshotContentType(Uint8List.fromList([0xFF, 0xD8, 0xFF, 0xE0])),
      'image/jpeg',
    );
    expect(
      bugScreenshotContentType(
        Uint8List.fromList([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
      ),
      'image/png',
    );
    expect(
      bugScreenshotContentType(
        Uint8List.fromList('RIFF\x00\x00\x00\x00WEBPVP8 '.codeUnits),
      ),
      'image/webp',
    );
    // HEIC (ftyp box) and SVG are refused.
    expect(
      bugScreenshotContentType(
        Uint8List.fromList('\x00\x00\x00\x18ftypheic'.codeUnits),
      ),
      isNull,
    );
    expect(
      bugScreenshotContentType(Uint8List.fromList('<svg'.codeUnits)),
      isNull,
    );
  });

  test('dates read like a conversation', () {
    final now = DateTime(2099, 3, 10, 12);
    expect(
      reportDate(DateTime(2099, 3, 10, 9, 5), now: now),
      'aujourd’hui, 9 h 05',
    );
    expect(reportDate(DateTime(2099, 3, 9, 18), now: now), 'hier, 18 h');
    expect(
      reportDate(DateTime(2099, 3, 2, 18, 30), now: now).startsWith('2 '),
      isTrue,
    );
    expect(reportDate(DateTime(2098, 12, 2, 18), now: now), contains('2098'));
  });
}
