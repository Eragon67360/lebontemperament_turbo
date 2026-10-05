import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/services/feature_flags_service.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';
import 'package:logger/logger.dart';

import '../../helpers/screen_harness.dart';

/// The kill switch and the offline notices on the home screen (#361). All of
/// them are advisory: the rest of the screen keeps rendering underneath.
void main() {
  const maintenance = 'Maintenance en cours';
  const update = 'Mise à jour recommandée';
  const offline = 'Données hors ligne';

  testWidgets('shows the maintenance banner when the flag is on', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      flagsService: fakeFlagsService([
        {'flag_key': kMaintenanceFlagKey, 'is_enabled': true},
      ]),
    );

    expect(find.text(maintenance), findsOneWidget);
    expect(find.text(update), findsNothing);
    // The screen still works: the next concert is listed.
    expect(find.text(kTestConcert.name!), findsOneWidget);
  });

  testWidgets('shows nothing when the flag is off', (tester) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      flagsService: fakeFlagsService([
        {'flag_key': kMaintenanceFlagKey, 'is_enabled': false},
      ]),
    );

    expect(find.text(maintenance), findsNothing);
    expect(find.text(update), findsNothing);
    expect(find.text(offline), findsNothing);
  });

  testWidgets('shows nothing when feature_flags cannot be read', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      flagsService: FeatureFlagsService(
        fetchRows: () async => throw Exception('RLS: no session'),
        logger: Logger(level: Level.off),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text(maintenance), findsNothing);
    expect(find.text(kTestConcert.name!), findsOneWidget);
  });

  testWidgets('advises an update when the installed version is older than '
      'mobile_min_version', (tester) async {
    // The harness installs version 0.0.0.
    await pumpScreen(
      tester,
      const HomeScreen(),
      flagsService: fakeFlagsService([
        {
          'flag_key': kMinVersionFlagKey,
          'is_enabled': true,
          'description': '2.1.0',
        },
      ]),
    );

    expect(find.text(update), findsOneWidget);
    expect(find.textContaining('minimum : 2.1.0'), findsOneWidget);
  });

  testWidgets('says "Données hors ligne" when a home list is cached', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const HomeScreen(),
      rehearsals: ListResult.cached(const [
        kTestRehearsal,
      ], error: Exception('offline')),
      online: false,
    );

    expect(find.text(offline), findsOneWidget);
    expect(find.textContaining('Pas de connexion'), findsOneWidget);
    expect(find.textContaining(kTestRehearsal.place!), findsOneWidget);
  });
}
