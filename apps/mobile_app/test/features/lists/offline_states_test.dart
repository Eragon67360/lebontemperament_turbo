import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concerts_events_screen.dart';
import 'package:lebontemperament/features/rehearsals/presentation/screens/rehearsals_screen.dart';

import '../../helpers/screen_harness.dart';

/// The main lists tell the truth about their rows (#361): fresh, cached
/// because the server is unreachable, or unavailable. Before, a cached list
/// looked fresh and an unreachable server looked like "no concert".
void main() {
  const offline = 'Données hors ligne';
  const error = 'Oups, une erreur est survenue';
  const noNetwork = 'Vous êtes hors ligne';

  final serverDown = Exception('SocketException');

  group('Concerts & Événements', () {
    testWidgets('fresh rows: list without banner', (tester) async {
      await pumpScreen(tester, const ConcertsEventsScreen());

      expect(find.text(kTestConcert.name!), findsOneWidget);
      expect(find.text(offline), findsNothing);
    });

    testWidgets('cached rows: list with the offline banner', (tester) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        concerts: ListResult.cached(const [kTestConcert], error: serverDown),
      );

      expect(find.text(kTestConcert.name!), findsOneWidget);
      expect(find.text(offline), findsOneWidget);
      expect(find.textContaining('serveur est injoignable'), findsOneWidget);
    });

    testWidgets('fresh and empty: the empty state, no banner, no error', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        concerts: const ListResult<Concert>.fresh([]),
      );

      expect(find.text('Aucun concert à venir'), findsOneWidget);
      expect(find.text(offline), findsNothing);
      expect(find.text(error), findsNothing);
    });

    testWidgets('server down, nothing cached, network up: an error with '
        'retry, not an empty list', (tester) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        concerts: ListResult<Concert>.cached(const [], error: serverDown),
      );

      expect(find.text(error), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
      expect(find.text('Aucun concert à venir'), findsNothing);
    });

    testWidgets('server down, nothing cached, no network: says so', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const ConcertsEventsScreen(),
        concerts: ListResult<Concert>.cached(const [], error: serverDown),
        online: false,
      );

      expect(find.text(noNetwork), findsOneWidget);
      expect(find.text(error), findsNothing);
    });
  });

  group('Répétitions', () {
    testWidgets('fresh rows: list without banner', (tester) async {
      await pumpScreen(tester, const RehearsalsScreen());

      expect(find.text(kTestRehearsal.name!), findsOneWidget);
      expect(find.text(offline), findsNothing);
    });

    testWidgets('cached rows: list with the offline banner', (tester) async {
      await pumpScreen(
        tester,
        const RehearsalsScreen(),
        rehearsals: ListResult.cached(const [
          kTestRehearsal,
        ], error: serverDown),
        online: false,
      );

      expect(find.text(kTestRehearsal.name!), findsOneWidget);
      expect(find.text(offline), findsOneWidget);
      expect(find.textContaining('Pas de connexion'), findsOneWidget);
    });

    testWidgets('fresh and empty: the empty state', (tester) async {
      await pumpScreen(
        tester,
        const RehearsalsScreen(),
        rehearsals: const ListResult<Rehearsal>.fresh([]),
      );

      expect(find.text('Aucune répétition'), findsOneWidget);
      expect(find.text(error), findsNothing);
    });

    testWidgets('server down and nothing cached: an error, not "Aucune '
        'répétition"', (tester) async {
      await pumpScreen(
        tester,
        const RehearsalsScreen(),
        rehearsals: ListResult<Rehearsal>.cached(const [], error: serverDown),
      );

      expect(find.text(error), findsOneWidget);
      expect(find.text('Aucune répétition'), findsNothing);
    });
  });
}
