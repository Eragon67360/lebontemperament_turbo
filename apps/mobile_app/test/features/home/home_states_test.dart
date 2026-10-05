import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';

import '../../helpers/screen_harness.dart';

/// The home cards used to say « Aucune répétition programmée » while the
/// lists were still loading or had failed; and tonight's rehearsal stayed
/// « Ce soir » until midnight.
void main() {
  const noRehearsal = 'Aucune répétition programmée';
  const noConcert = 'Aucun concert à venir';

  testWidgets('loading: a spinner, not an empty state', (tester) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      homeRehearsals: const AsyncValue<List<Rehearsal>>.loading(),
      homeConcerts: const AsyncValue<List<Concert>>.loading(),
    );

    expect(find.text('Chargement des répétitions…'), findsOneWidget);
    expect(find.text('Chargement des concerts…'), findsOneWidget);
    expect(find.text(noRehearsal), findsNothing);
    expect(find.text(noConcert), findsNothing);
  });

  testWidgets('error: a message with « Réessayer », not an empty state', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      homeRehearsals: AsyncValue<List<Rehearsal>>.error(
        Exception('SocketException'),
        StackTrace.empty,
      ),
      homeConcerts: AsyncValue<List<Concert>>.error(
        Exception('SocketException'),
        StackTrace.empty,
      ),
    );

    expect(find.text('Impossible de charger les répétitions.'), findsOneWidget);
    expect(find.text('Impossible de charger les concerts.'), findsOneWidget);
    expect(find.text('Réessayer'), findsNWidgets(2));
    expect(find.text(noRehearsal), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('fresh and empty: the empty states', (tester) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      homeRehearsals: const AsyncData<List<Rehearsal>>([]),
      homeConcerts: const AsyncData<List<Concert>>([]),
    );

    expect(find.text(noRehearsal), findsOneWidget);
    expect(find.text(noConcert), findsOneWidget);
  });

  group('home list providers', () {
    test(
      'cached rows are data; nothing cached and a failure is an error',
      () async {
        final container = ProviderContainer(
          overrides: [
            upcomingRehearsalsProvider.overrideWith(
              (ref) async => ListResult.cached(const [
                kTestRehearsal,
              ], error: Exception('offline')),
            ),
            upcomingConcertsProvider.overrideWith(
              (ref) async => ListResult<Concert>.cached(
                const [],
                error: Exception('down'),
              ),
            ),
          ],
        );
        addTearDown(container.dispose);

        expect(
          container.read(homeUpcomingRehearsalsProvider).isLoading,
          isTrue,
        );
        await container.read(upcomingRehearsalsProvider.future);
        await container.read(upcomingConcertsProvider.future);

        expect(container.read(homeUpcomingRehearsalsProvider).value, [
          kTestRehearsal,
        ]);
        expect(container.read(homeUpcomingConcertsProvider).hasError, isTrue);
      },
    );

    test('a rehearsal that ended today is no longer upcoming', () async {
      final now = DateTime.now();
      String ymd(DateTime d) =>
          '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      // Today, over since midnight: a date-only filter kept it all day.
      final over = kTestRehearsal.copyWith(
        id: 'rehearsal-test-over',
        date: ymd(now),
        startTime: '00:00:00',
        endTime: '00:00:00',
      );
      final later = kTestRehearsal.copyWith(
        id: 'rehearsal-test-later',
        date: ymd(now.add(const Duration(days: 1))),
        startTime: '19:30:00',
        endTime: '22:00:00',
      );
      final container = ProviderContainer(
        overrides: [
          realtimeRehearsalsProvider.overrideWith(
            (ref) async => ListResult.fresh([over, later]),
          ),
        ],
      );
      addTearDown(container.dispose);

      final result = await container.read(upcomingRehearsalsProvider.future);
      expect(result.items.map((r) => r.id), ['rehearsal-test-later']);
    });
  });
}
