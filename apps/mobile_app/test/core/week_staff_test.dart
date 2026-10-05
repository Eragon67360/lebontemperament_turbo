import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/core/widgets/stage.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';

Rehearsal _rehearsal(String id, String date, GroupType group) => Rehearsal(
  id: id,
  name: 'Répétition $id',
  date: date,
  startTime: '20:00:00',
  endTime: '22:00:00',
  place: 'Salle de test',
  groupType: group,
);

void main() {
  // Monday 5 October 2026.
  final monday = DateTime(2026, 10, 5, 9);

  test('the week starts on Monday', () {
    expect(
      WeekStaff.weekStart(DateTime(2026, 10, 8, 21)),
      DateTime(2026, 10, 5),
    );
    expect(WeekStaff.weekStart(DateTime(2026, 10, 11)), DateTime(2026, 10, 5));
  });

  test('only this week\'s rehearsals become notes, on their weekday', () {
    final notes = WeekStaff.notesFor([
      _rehearsal('a', '2026-10-08', GroupType.choeurComplet),
      _rehearsal('b', '2026-10-10', GroupType.orchestre),
      _rehearsal('c', '2026-10-12', GroupType.femmes), // next week
      _rehearsal('d', '2026-10-04', GroupType.hommes), // last week
    ], monday);
    expect(notes, [(3, GroupType.choeurComplet), (5, GroupType.orchestre)]);
  });

  test('each group has its own line', () {
    final lines = GroupType.values.map(WeekStaff.lineFor).toSet();
    // Chœur complet and Tous share the middle line.
    expect(lines.length, GroupType.values.length - 1);
  });

  testWidgets('the staff is read out as a sentence', (tester) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: Scaffold(
          body: WeekStaff(
            now: monday,
            rehearsals: [_rehearsal('a', '2026-10-08', GroupType.orchestre)],
          ),
        ),
      ),
    );
    expect(
      find.bySemanticsLabel('Cette semaine : jeudi 8 octobre, Orchestre'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });
}
