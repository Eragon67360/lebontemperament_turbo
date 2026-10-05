import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/features/rehearsals/presentation/screens/rehearsals_screen.dart';

import '../../helpers/screen_harness.dart';

String _day(int offset) {
  final d = DateTime.now().add(Duration(days: offset));
  return '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}

/// Fake rows only: tomorrow's full choir, then an orchestra rehearsal.
List<Rehearsal> _rows() => [
  Rehearsal(
    id: 'rehearsal-test-a',
    name: 'Répétition test chœur',
    place: 'Salle de test',
    date: _day(1),
    startTime: '20:00:00',
    endTime: '22:00:00',
    groupType: GroupType.choeurComplet,
  ),
  Rehearsal(
    id: 'rehearsal-test-b',
    name: 'Répétition test orchestre',
    place: 'Salle de test',
    date: _day(3),
    startTime: '19:30:00',
    groupType: GroupType.orchestre,
  ),
];

void main() {
  testWidgets('the next rehearsal says « Demain », the others do not', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const RehearsalsScreen(),
      rehearsals: ListResult.fresh(_rows()),
    );

    expect(find.text('Répétitions'), findsOneWidget);
    expect(find.text('Demain'), findsOneWidget);
    expect(find.text('20 h – 22 h · Salle de test'), findsOneWidget);
    expect(find.text('19 h 30 · Salle de test'), findsOneWidget);
    expect(find.byTooltip('Calendrier complet'), findsOneWidget);
    expect(find.byTooltip('Déconnexion'), findsOneWidget);
  });

  testWidgets('filtering on « Hommes » keeps the full choir, hides the '
      'orchestra; « Tous » brings everything back', (tester) async {
    await pumpScreen(
      tester,
      const RehearsalsScreen(),
      rehearsals: ListResult.fresh(_rows()),
    );

    await tester.tap(find.text('Hommes'));
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Répétition test chœur'), findsOneWidget);
    expect(find.text('Répétition test orchestre'), findsNothing);

    await tester.tap(find.text('Tous'));
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Répétition test orchestre'), findsOneWidget);
    // Let the re-mounted cards finish their entrance animation.
    await tester.pump(const Duration(seconds: 2));
  });

  for (final scale in [1.3, 2.0]) {
    testWidgets('no overflow at text scale $scale', (tester) async {
      await pumpScreen(
        tester,
        const RehearsalsScreen(),
        rehearsals: ListResult.fresh(_rows()),
        textScale: scale,
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(RehearsalsScreen), findsOneWidget);
    });
  }
}
