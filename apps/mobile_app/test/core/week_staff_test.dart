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

  test('the window starts today, whatever the weekday', () {
    expect(
      WeekStaff.windowStart(DateTime(2026, 10, 8, 21)),
      DateTime(2026, 10, 8),
    );
    expect(
      WeekStaff.windowStart(DateTime(2026, 10, 11)),
      DateTime(2026, 10, 11),
    );
  });

  test('the 7 days from today become notes, by days from today', () {
    final notes = WeekStaff.notesFor([
      _rehearsal('a', '2026-10-08', GroupType.choeurComplet),
      _rehearsal('b', '2026-10-10', GroupType.orchestre),
      _rehearsal('c', '2026-10-12', GroupType.femmes), // day 7: out
      _rehearsal('d', '2026-10-04', GroupType.hommes), // past
    ], monday);
    expect(notes, [(3, GroupType.choeurComplet), (5, GroupType.orchestre)]);
  });

  test('the window rolls over the weekend into the next week', () {
    final thursday = DateTime(2026, 10, 8, 21);
    final notes = WeekStaff.notesFor([
      _rehearsal('a', '2026-10-08', GroupType.orchestre), // today: 0
      _rehearsal('b', '2026-10-12', GroupType.femmes), // next Monday: 4
      _rehearsal('c', '2026-10-14', GroupType.hommes), // day 6: 6
      _rehearsal('d', '2026-10-15', GroupType.hommes), // day 7: out
    ], thursday);
    expect(notes, [
      (0, GroupType.orchestre),
      (4, GroupType.femmes),
      (6, GroupType.hommes),
    ]);
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
      find.bySemanticsLabel(
        'Les 7 prochains jours : jeudi 8 octobre, Orchestre',
      ),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });
}
