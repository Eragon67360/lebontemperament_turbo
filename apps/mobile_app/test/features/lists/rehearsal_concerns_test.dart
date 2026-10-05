import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/features/rehearsals/presentation/providers/rehearsal_filter_provider.dart';

void main() {
  test('a rehearsal for everyone shows under every filter', () {
    for (final filter in GroupType.values) {
      expect(rehearsalConcerns(GroupType.tous, filter), isTrue);
    }
  });

  test('the full choir concerns the men and the women', () {
    expect(
      rehearsalConcerns(GroupType.choeurComplet, GroupType.hommes),
      isTrue,
    );
    expect(
      rehearsalConcerns(GroupType.choeurComplet, GroupType.femmes),
      isTrue,
    );
    expect(
      rehearsalConcerns(GroupType.choeurComplet, GroupType.orchestre),
      isFalse,
    );
    expect(
      rehearsalConcerns(GroupType.choeurComplet, GroupType.jeunesEnfants),
      isFalse,
    );
  });

  test('other groups only show under their own filter', () {
    expect(rehearsalConcerns(GroupType.hommes, GroupType.hommes), isTrue);
    expect(rehearsalConcerns(GroupType.hommes, GroupType.femmes), isFalse);
    expect(rehearsalConcerns(GroupType.orchestre, GroupType.tous), isFalse);
  });
}
