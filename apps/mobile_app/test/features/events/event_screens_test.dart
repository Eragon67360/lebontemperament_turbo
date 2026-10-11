import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/models/event_document.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concerts_events_screen.dart';
import 'package:lebontemperament/features/events/presentation/screens/event_detail_screen.dart';

import '../../helpers/screen_harness.dart';

const _stay = Event(
  id: 'event-test-0002',
  title: 'Séjour de test',
  dateFrom: '2099-07-05',
  dateTo: '2099-07-15',
  eventType: EventType.sejour,
);

/// Fake files only: no real event, file or bucket key.
const _bulletin = EventDocument(
  id: 'doc-test-0001',
  eventId: 'event-test-0004',
  label: 'Bulletin de réservation',
  fileName: 'Bulletin-de-reservation.pdf',
  storageKey: 'events/event-test-0004/doc-test-0001-Bulletin.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 122880,
);

const _orders = EventDocument(
  id: 'doc-test-0002',
  eventId: 'event-test-0004',
  label: 'Tableau des commandes',
  fileName: 'Commandes.xlsx',
  storageKey: 'events/event-test-0004/doc-test-0002-Commandes.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  sortOrder: 1,
);

const _sale = Event(
  id: 'event-test-0004',
  title: 'Vente de fromages de test',
  dateFrom: '2099-11-20',
  eventType: EventType.vente,
  documents: [_bulletin, _orders],
);

/// Records what url_launcher is asked to open, and answers [opens].
List<String> _mockLauncher({required bool opens}) {
  final launched = <String>[];
  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
  const channel = MethodChannel('plugins.flutter.io/url_launcher');
  messenger.setMockMethodCallHandler(channel, (call) async {
    if (call.method == 'launch') {
      launched.add((call.arguments as Map)['url'] as String);
      return opens;
    }
    return opens;
  });
  addTearDown(() => messenger.setMockMethodCallHandler(channel, null));
  return launched;
}

Future<void> _pumpSection(WidgetTester tester) async {
  GoogleFonts.config.allowRuntimeFetching = false;
  await tester.pumpWidget(
    MaterialApp(
      theme: AppTheme.lightTheme,
      home: const Scaffold(
        body: EventDocumentsSection(
          documents: [_bulletin, _orders],
          urlOf: _testUrl,
        ),
      ),
    ),
  );
}

String _testUrl(EventDocument document) =>
    document.urlFrom('https://project.test/public/${document.storageKey}');

void main() {
  testWidgets('a multi-day event shows both dates in the list', (tester) async {
    await pumpScreen(
      tester,
      const ConcertsEventsScreen(),
      events: const ListResult.fresh([_stay]),
    );
    await tester.tap(find.text('Événements'));
    await tester.pumpAndSettle();
    expect(find.text('Du 5 au 15 juillet 2099'), findsOneWidget);
  });

  testWidgets('a multi-day event shows both dates in its detail', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const EventDetailScreen(eventId: 'event-test-0002'),
      overrides: [
        eventProvider.overrideWith(
          (ref, id) async => id == _stay.id ? _stay : null,
        ),
      ],
    );
    expect(find.text('Dates'), findsOneWidget);
    expect(find.text('Du 5 au 15 juillet 2099'), findsOneWidget);
  });

  testWidgets('a deleted event shows « Événement non trouvé », not a crash', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const EventDetailScreen(eventId: 'event-gone'),
      overrides: [eventProvider.overrideWith((ref, id) async => null)],
    );
    expect(tester.takeException(), isNull);
    expect(find.text('Événement non trouvé'), findsOneWidget);
    expect(find.text('Retour'), findsOneWidget);
  });

  testWidgets('a loading failure is a French message with « Réessayer »', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const EventDetailScreen(eventId: 'event-err'),
      overrides: [
        eventProvider.overrideWith((ref, id) async => throw StateError('boom')),
      ],
    );
    expect(find.textContaining('boom'), findsNothing);
    expect(find.text('Réessayer'), findsOneWidget);
  });

  group('event documents', () {
    testWidgets('the detail lists the files under the key facts', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await pumpScreen(
        tester,
        const EventDetailScreen(eventId: 'event-test-0004'),
        overrides: [eventProvider.overrideWith((ref, id) async => _sale)],
      );
      await tester.pumpAndSettle();

      expect(find.text('Documents'), findsOneWidget);
      expect(find.text('Bulletin de réservation'), findsOneWidget);
      expect(find.text('PDF · 120 ko'), findsOneWidget);
      expect(find.text('Tableau des commandes'), findsOneWidget);
      expect(find.text('Excel'), findsOneWidget);
      expect(
        find.bySemanticsLabel('Bulletin de réservation, PDF · 120 ko, ouvrir'),
        findsOneWidget,
      );
      expect(
        find.bySemanticsLabel('Tableau des commandes, Excel, télécharger'),
        findsOneWidget,
      );
      // Visible on arrival, without scrolling.
      final bottom = tester.getBottomLeft(find.text('Tableau des commandes'));
      expect(bottom.dy, lessThan(844));
      semantics.dispose();
    });

    testWidgets('no section for an event without files', (tester) async {
      await pumpScreen(
        tester,
        const EventDetailScreen(eventId: 'event-test-0002'),
        overrides: [eventProvider.overrideWith((ref, id) async => _stay)],
      );
      expect(find.text('Documents'), findsNothing);
    });

    testWidgets('the list card says how many files an event has', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        events: const ListResult.fresh([_sale, _stay]),
      );
      await tester.tap(find.text('Événements'));
      await tester.pumpAndSettle();

      expect(find.text('2 documents'), findsOneWidget);
      expect(find.byIcon(Icons.attach_file_rounded), findsOneWidget);
      // Written out in full, not « 2 docum… ».
      final hint = tester.renderObject<RenderParagraph>(
        find.text('2 documents'),
      );
      expect(hint.didExceedMaxLines, isFalse);
    });

    testWidgets('the list hint fits at 2x text size', (tester) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        textScale: 2.0,
        events: const ListResult.fresh([_sale]),
      );
      await tester.tap(find.text('Événements'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('the files fit at 2x text size', (tester) async {
      await pumpScreen(
        tester,
        const EventDetailScreen(eventId: 'event-test-0004'),
        textScale: 2.0,
        overrides: [eventProvider.overrideWith((ref, id) async => _sale)],
      );
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('one file reads « 1 document »', (tester) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        events: ListResult.fresh([
          _sale.copyWith(documents: const [_bulletin]),
        ]),
      );
      await tester.tap(find.text('Événements'));
      await tester.pumpAndSettle();

      expect(find.text('1 document'), findsOneWidget);
    });

    testWidgets('a tap opens the file: a PDF as is, Excel as a download', (
      tester,
    ) async {
      final launched = _mockLauncher(opens: true);
      await _pumpSection(tester);

      await tester.tap(find.text('Bulletin de réservation'));
      await tester.pump();
      await tester.tap(find.text('Tableau des commandes'));
      await tester.pump();

      expect(launched, [
        'https://project.test/public/events/event-test-0004/'
            'doc-test-0001-Bulletin.pdf',
        'https://project.test/public/events/event-test-0004/'
            'doc-test-0002-Commandes.xlsx?download=Commandes.xlsx',
      ]);
      expect(find.byType(SnackBar), findsNothing);
    });

    testWidgets('a file nothing can open says so', (tester) async {
      _mockLauncher(opens: false);
      await _pumpSection(tester);

      await tester.tap(find.text('Bulletin de réservation'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.text('Impossible d’ouvrir le document.'), findsOneWidget);
    });

    testWidgets('each file is a 48 dp tap target at least', (tester) async {
      await _pumpSection(tester);
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
    });
  });
}
