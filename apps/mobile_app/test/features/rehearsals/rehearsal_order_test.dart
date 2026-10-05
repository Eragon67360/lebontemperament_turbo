import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/features/rehearsals/presentation/providers/rehearsal_filter_provider.dart';

Rehearsal _r(String id, String? date, String? start) => Rehearsal(
  id: id,
  name: 'Répétition $id',
  date: date,
  startTime: start,
  groupType: GroupType.tous,
);

void main() {
  test('two rehearsals on the same day are ordered by start time', () {
    final rows = [
      _r('late', '2099-05-30', '20:00:00'),
      _r('undated', null, null),
      _r('early', '2099-05-30', '14:00:00'),
      _r('next-day', '2099-05-31', '09:00:00'),
    ]..sort(compareRehearsals);
    expect(rows.map((r) => r.id), ['early', 'late', 'next-day', 'undated']);
  });
}
