import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/my_groups_provider.dart';
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

Finder _pill(GroupType group) =>
    find.byKey(ValueKey('calendar-filter-${group.name}'));

/// The pills scroll sideways: the last ones start off screen.
Future<void> _tapPill(WidgetTester tester, GroupType group) async {
  await tester.ensureVisible(_pill(group));
  await tester.pump();
  await tester.tap(_pill(group));
}

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

  testWidgets('a man opens the calendar on his groups; filters combine', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const RehearsalsScreen(),
      rehearsals: ListResult.fresh(_rows()),
      overrides: [
        initialMyGroupsProvider.overrideWithValue({GroupType.hommes}),
      ],
    );

    // His ensemble, the full choir and « Tout le monde » are ticked.
    expect(find.text('Vos ensembles'), findsOneWidget);
    expect(find.text('Répétition test chœur'), findsOneWidget);
    expect(find.text('Répétition test orchestre'), findsNothing);
    expect(find.text('Tous'), findsNothing);
    expect(find.text('Tout le monde'), findsOneWidget);

    // Ticking the orchestra adds its rehearsals to his.
    await _tapPill(tester, GroupType.orchestre);
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Sélection personnalisée'), findsOneWidget);
    expect(find.text('Répétition test chœur'), findsOneWidget);
    expect(find.text('Répétition test orchestre'), findsOneWidget);

    // Unticking the full choir hides it.
    await _tapPill(tester, GroupType.choeurComplet);
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Répétition test chœur'), findsNothing);

    // « Mes ensembles » goes back to his selection.
    await tester.tap(find.text('Mes ensembles'));
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Répétition test chœur'), findsOneWidget);
    expect(find.text('Répétition test orchestre'), findsNothing);
    // Let the re-mounted cards finish their entrance animation.
    await tester.pump(const Duration(seconds: 2));
  });

  testWidgets('nothing chosen shows the whole season; unticking everything '
      'says so', (tester) async {
    await pumpScreen(
      tester,
      const RehearsalsScreen(),
      rehearsals: ListResult.fresh(_rows()),
    );

    expect(find.text('Toute la saison'), findsOneWidget);
    expect(find.text('Répétition test orchestre'), findsOneWidget);

    await _tapPill(tester, GroupType.orchestre);
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Répétition test orchestre'), findsNothing);
    await tester.tap(find.text('Mes ensembles'));
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Répétition test orchestre'), findsOneWidget);

    for (final group in GroupType.values) {
      await tester.ensureVisible(_pill(group));
      await tester.tap(_pill(group));
      await tester.pump(const Duration(milliseconds: 200));
    }
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Aucun ensemble choisi'), findsOneWidget);
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
