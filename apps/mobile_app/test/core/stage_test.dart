import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/core/widgets/stage.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';

void main() {
  final now = DateTime(2026, 10, 5, 21, 30); // a Monday evening

  test('daysUntil counts calendar days, not 24 h blocks', () {
    expect(daysUntil(DateTime(2026, 10, 5, 8), now: now), 0);
    expect(daysUntil(DateTime(2026, 10, 6, 1), now: now), 1);
    expect(daysUntil(DateTime(2026, 10, 25), now: now), 20);
    // Across the switch to winter time (25 Oct 2026 in France).
    expect(daysUntil(DateTime(2026, 10, 26), now: now), 21);
  });

  test('countdownLabel', () {
    expect(countdownLabel(DateTime(2026, 10, 5), now: now), 'Aujourd’hui');
    expect(
      countdownLabel(DateTime(2026, 10, 5), now: now, evening: true),
      'Ce soir',
    );
    expect(countdownLabel(DateTime(2026, 10, 6), now: now), 'Demain');
    expect(countdownLabel(DateTime(2026, 10, 8), now: now), 'J-3');
  });

  test('relativeDays', () {
    expect(relativeDays(DateTime(2026, 10, 25), now: now), 'dans 20 jours');
    expect(relativeDays(DateTime(2026, 10, 6), now: now), 'demain');
  });

  test('frenchTime and ranges', () {
    expect(frenchTime('20:00:00'), '20 h');
    expect(frenchTime('19:30'), '19 h 30');
    expect(frenchTime('09:05:00'), '9 h 05');
    expect(frenchTime(null), '');
    expect(frenchTimeRange('20:00:00', '22:00:00'), '20 h – 22 h');
    expect(frenchTimeRange('14:00', null), '14 h');
  });

  test('longDate and group labels', () {
    expect(longDate(DateTime(2026, 10, 6)), 'mardi 6 octobre');
    expect(groupLabel(GroupType.choeurComplet), 'Chœur complet');
  });
}
