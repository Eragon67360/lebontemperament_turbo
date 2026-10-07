import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/member.dart';
import 'package:lebontemperament/features/members/presentation/providers/members_filter_provider.dart';

/// Fake members only.
const _members = [
  Member(displayName: 'Zoé Test', email: 'zoe@example.test', voice: 'Alto'),
  Member(
    displayName: 'Hélène Test',
    email: 'helene@example.test',
    voice: 'Soprano',
  ),
  Member(
    displayName: 'Émile Test',
    email: 'emile@example.test',
    voice: 'Basse',
  ),
  Member(displayName: 'Bob Test', email: 'bob@example.test', voice: 'Ténor'),
];

void main() {
  test('foldForSearch drops accents and case', () {
    expect(foldForSearch('Hélène'), 'helene');
    expect(foldForSearch('  ŒUVRE ça  '), 'oeuvre ca');
  });

  test('« helene » finds « Hélène », and « Hélène » finds her too', () {
    expect(filterMembers(_members, 'helene', '').map((m) => m.displayName), [
      'Hélène Test',
    ]);
    expect(filterMembers(_members, 'HÉLÈNE', '').length, 1);
  });

  test('the voice filter ignores accents as well', () {
    expect(filterMembers(_members, '', 'tenor').single.displayName, 'Bob Test');
  });

  test('the e-mail matches too', () {
    expect(
      filterMembers(_members, 'helene@', '').single.displayName,
      'Hélène Test',
    );
  });

  test('the list is sorted on the folded name: Émile among the E', () {
    expect(filterMembers(_members, '', '').map((m) => m.displayName), [
      'Bob Test',
      'Émile Test',
      'Hélène Test',
      'Zoé Test',
    ]);
  });
}
