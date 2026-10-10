import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/event.dart';
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
}
