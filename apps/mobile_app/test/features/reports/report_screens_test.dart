import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/bug_report.dart';
import 'package:lebontemperament/features/profile/presentation/screens/profile_screen.dart';
import 'package:lebontemperament/features/reports/presentation/screens/report_conversation_screen.dart';
import 'package:lebontemperament/features/reports/presentation/screens/report_problem_screen.dart';
import 'package:lebontemperament/features/reports/presentation/screens/reports_list_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/fake_bug_reports_service.dart';
import '../../helpers/screen_harness.dart';

/// A 1×1 PNG, the smallest image the bucket accepts.
final _png = Uint8List.fromList([
  0x89,
  0x50,
  0x4E,
  0x47,
  0x0D,
  0x0A,
  0x1A,
  0x0A,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x48,
  0x44,
  0x52,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x00,
  0x00,
  0x01,
  0x08,
  0x06,
  0x00,
  0x00,
  0x00,
  0x1F,
  0x15,
  0xC4,
  0x89,
  0x00,
  0x00,
  0x00,
  0x0D,
  0x49,
  0x44,
  0x41,
  0x54,
  0x78,
  0x9C,
  0x63,
  0x00,
  0x01,
  0x00,
  0x00,
  0x05,
  0x00,
  0x01,
  0x0D,
  0x0A,
  0x2D,
  0xB4,
  0x00,
  0x00,
  0x00,
  0x00,
  0x49,
  0x45,
  0x4E,
  0x44,
  0xAE,
  0x42,
  0x60,
  0x82,
]);

Future<String> _appInfo() async => '0.0.0 (0) · test';

Future<void> _fillForm(WidgetTester tester) async {
  await tester.enterText(
    find.widgetWithText(TextFormField, 'Ex. : le lecteur s’arrête tout seul'),
    'Le lecteur s’arrête',
  );
  await tester.enterText(
    find.byType(TextFormField).last,
    'Après une minute, la musique se coupe.',
  );
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('Signaler un problème', () {
    testWidgets('an empty form says what is missing and sends nothing', (
      tester,
    ) async {
      final service = FakeBugReportsService();
      await pumpScreen(
        tester,
        ReportProblemScreen(appInfo: _appInfo),
        bugReports: service,
      );
      await tester.tap(find.text('Envoyer'));
      await tester.pump();
      expect(find.text('Donnez un titre au problème.'), findsOneWidget);
      expect(
        find.text('Décrivez le problème en une phrase au moins.'),
        findsOneWidget,
      );
      expect(service.created, isEmpty);
    });

    testWidgets('screenshots are uploaded, then the report names them', (
      tester,
    ) async {
      final service = FakeBugReportsService();
      await pumpScreen(
        tester,
        ReportProblemScreen(
          appInfo: _appInfo,
          pickScreenshot: () async => _png,
        ),
        bugReports: service,
      );
      await _fillForm(tester);
      await tester.tap(find.text('Ajouter une capture'));
      await tester.pump();
      expect(find.byTooltip('Retirer la capture 1'), findsOneWidget);

      await tester.ensureVisible(find.text('Envoyer'));
      await tester.tap(find.text('Envoyer'));
      await tester.pumpAndSettle();

      expect(service.uploaded, ['$kMemberId/shot-0']);
      expect(service.created.single['screenshotPaths'], ['$kMemberId/shot-0']);
      expect(service.created.single['title'], 'Le lecteur s’arrête');
      expect(service.created.single['appInfo'], '0.0.0 (0) · test');
      // The member lands on the conversation, waiting for the answer.
      expect(find.byType(ReportConversationScreen), findsOneWidget);
      expect(
        find.textContaining('Vous recevrez une notification'),
        findsOneWidget,
      );
    });

    testWidgets('three screenshots at most', (tester) async {
      await pumpScreen(
        tester,
        ReportProblemScreen(
          appInfo: _appInfo,
          pickScreenshot: () async => _png,
        ),
        bugReports: FakeBugReportsService(),
      );
      for (var i = 0; i < 3; i++) {
        await tester.tap(find.text('Ajouter une capture'));
        await tester.pump();
      }
      expect(find.byTooltip('Retirer la capture 3'), findsOneWidget);
      expect(find.text('Ajouter une capture'), findsNothing);
    });

    testWidgets('an unsupported image is refused with a sentence', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        ReportProblemScreen(
          appInfo: _appInfo,
          pickScreenshot: () async =>
              Uint8List.fromList('<svg onload=x>'.codeUnits),
        ),
        bugReports: FakeBugReportsService(),
      );
      await tester.tap(find.text('Ajouter une capture'));
      await tester.pump();
      expect(find.textContaining('format d’image'), findsOneWidget);
      expect(find.byTooltip('Retirer la capture 1'), findsNothing);
    });

    testWidgets('a failed send removes the uploaded files and says so', (
      tester,
    ) async {
      final service = FakeBugReportsService(failCreate: true);
      await pumpScreen(
        tester,
        ReportProblemScreen(
          appInfo: _appInfo,
          pickScreenshot: () async => _png,
        ),
        bugReports: service,
      );
      await _fillForm(tester);
      await tester.tap(find.text('Ajouter une capture'));
      await tester.pump();
      await tester.ensureVisible(find.text('Envoyer'));
      await tester.tap(find.text('Envoyer'));
      await tester.pump();
      await tester.pump();

      expect(service.removed, ['$kMemberId/shot-0']);
      expect(find.textContaining('n’a pas pu être envoyé'), findsOneWidget);
      expect(find.byType(ReportConversationScreen), findsNothing);
    });
  });

  group('Conversation', () {
    testWidgets(
      'the author reads the answer and writes back to whoever answered',
      (tester) async {
        final service = FakeBugReportsService(
          reports: [testReport()],
          messagesByReport: {
            'report-test-0001': [testMessage()],
          },
        );
        await pumpScreen(
          tester,
          const ReportConversationScreen(reportId: 'report-test-0001'),
          bugReports: service,
        );
        expect(find.text('Le lecteur s’arrête tout seul'), findsOneWidget);
        expect(find.text('Merci, je regarde ça.'), findsOneWidget);
        expect(find.textContaining('Responsable Test'), findsOneWidget);
        expect(service.markedRead, ['report-test-0001']);
        // Members can't change the status.
        expect(find.byTooltip('Changer le statut'), findsNothing);
        // The phone's version is for superadmins.
        expect(find.textContaining('Android test'), findsNothing);

        await tester.enterText(find.byType(TextField).last, 'Merci beaucoup !');
        await tester.tap(find.byTooltip('Envoyer'));
        await tester.pumpAndSettle();

        expect(service.sent.single['receiverId'], kSuperadminId);
        expect(find.text('Merci beaucoup !'), findsOneWidget);
        expect(find.textContaining('Vous ·'), findsOneWidget);
      },
    );

    testWidgets('a superadmin answers the author and can change the status', (
      tester,
    ) async {
      final service = FakeBugReportsService(
        userId: kSuperadminId,
        reports: [testReport()],
      );
      await pumpScreen(
        tester,
        const ReportConversationScreen(reportId: 'report-test-0001'),
        superadmin: true,
        bugReports: service,
      );
      expect(find.textContaining('Signalé par Membre Test'), findsOneWidget);
      expect(find.textContaining('Android test'), findsOneWidget);
      expect(
        find.textContaining('Membre Test recevra votre réponse'),
        findsOneWidget,
      );

      await tester.enterText(find.byType(TextField).last, 'C’est corrigé.');
      await tester.tap(find.byTooltip('Envoyer'));
      await tester.pumpAndSettle();
      expect(service.sent.single['receiverId'], kMemberId);

      await tester.tap(find.byTooltip('Changer le statut'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Résolu').last);
      await tester.pumpAndSettle();
      expect(service.statuses['report-test-0001'], BugReportStatus.resolved);
    });

    testWidgets('a report that no longer exists says so', (tester) async {
      await pumpScreen(
        tester,
        const ReportConversationScreen(reportId: 'report-missing'),
        bugReports: FakeBugReportsService(),
      );
      expect(find.text('Signalement introuvable'), findsOneWidget);
      expect(find.byTooltip('Envoyer'), findsNothing);
    });
  });

  group('Lists', () {
    testWidgets('no report yet: the member is offered to send one', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const MyReportsScreen(),
        bugReports: FakeBugReportsService(),
      );
      expect(find.text('Aucun signalement'), findsOneWidget);
      await tester.tap(
        find.widgetWithText(OutlinedButton, 'Signaler un problème'),
      );
      await tester.pumpAndSettle();
      expect(find.byType(ReportProblemScreen), findsOneWidget);
    });

    testWidgets('an unread answer comes first, marked « Nouveau »', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const MyReportsScreen(),
        bugReports: FakeBugReportsService(
          reports: [
            testReport(id: 'old', title: 'Ancien problème'),
            testReport(
              id: 'answered',
              title: 'Problème avec réponse',
              messages: [
                BugMessageSummary(
                  senderId: kSuperadminId,
                  isRead: false,
                  createdAt: DateTime(2099, 1, 1),
                ),
              ],
            ),
          ],
        ),
      );
      expect(find.text('1 nouveau'), findsOneWidget);
      expect(find.text('Nouveau'), findsOneWidget);
      final first = tester.getTopLeft(find.text('Problème avec réponse'));
      final second = tester.getTopLeft(find.text('Ancien problème'));
      expect(first.dy, lessThan(second.dy));
    });

    testWidgets('the inbox hides resolved reports until asked', (tester) async {
      await pumpScreen(
        tester,
        const ReportsInboxScreen(),
        superadmin: true,
        bugReports: FakeBugReportsService(
          userId: kSuperadminId,
          reports: [
            testReport(id: 'open', title: 'Problème ouvert'),
            testReport(
              id: 'done',
              title: 'Problème résolu',
              status: BugReportStatus.resolved,
              isRead: true,
            ),
          ],
        ),
      );
      expect(find.text('Problème ouvert'), findsOneWidget);
      expect(find.text('Problème résolu'), findsNothing);
      expect(find.textContaining('Membre Test ·'), findsOneWidget);

      await tester.tap(find.text('Résolus'));
      await tester.pumpAndSettle();
      expect(find.text('Problème résolu'), findsOneWidget);
      expect(find.text('Problème ouvert'), findsNothing);
    });
  });

  group('Profil', () {
    testWidgets('every member can report and follow their reports', (
      tester,
    ) async {
      await pumpScreen(tester, const ProfileScreen());
      expect(find.text('Signaler un problème'), findsOneWidget);
      expect(find.text('Mes signalements'), findsOneWidget);
      expect(find.text('Signalements reçus'), findsNothing);
      // Members who saw the tour before: the one-time tip.
      expect(
        find.textContaining('« Signaler un problème » nous l’envoie'),
        findsOneWidget,
      );
    });

    testWidgets('a superadmin sees the inbox with its count', (tester) async {
      await pumpScreen(
        tester,
        const ProfileScreen(),
        superadmin: true,
        bugReports: FakeBugReportsService(
          userId: kSuperadminId,
          reports: [testReport()],
        ),
      );
      expect(find.text('Signalements reçus'), findsOneWidget);
      expect(find.text('1 nouveau'), findsOneWidget);
    });
  });
}
