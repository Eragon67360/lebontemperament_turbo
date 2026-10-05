import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/core/utils/parse_rows.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';

void main() {
  test('skips the rows that do not fit and keeps the others', () {
    final skipped = <Object?>[];
    final rows = [
      {'id': 'r1', 'group_type': 'Hommes'},
      {'id': 'r2', 'group_type': 'Quatuor'},
      {'id': 'r3', 'group_type': 'Tous'},
    ];

    final parsed = parseRows(
      rows,
      Rehearsal.fromJson,
      onSkip: (_, row) => skipped.add(row['id']),
    );

    expect(parsed.map((r) => r.id), ['r1', 'r3']);
    expect(skipped, ['r2']);
  });
}
