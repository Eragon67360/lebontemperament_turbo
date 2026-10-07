import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/my_groups_provider.dart';

void main() {
  test('« Tout le monde » concerns every ensemble', () {
    for (final g in memberGroups) {
      expect(groupsConcerning({g}), contains(GroupType.tous));
    }
  });

  test('the full choir concerns the men and the women only', () {
    expect(
      groupsConcerning({GroupType.hommes}),
      contains(GroupType.choeurComplet),
    );
    expect(
      groupsConcerning({GroupType.femmes}),
      contains(GroupType.choeurComplet),
    );
    expect(
      groupsConcerning({GroupType.orchestre}),
      isNot(contains(GroupType.choeurComplet)),
    );
    expect(
      groupsConcerning({GroupType.jeunesEnfants}),
      isNot(contains(GroupType.choeurComplet)),
    );
  });

  test('other ensembles stay out', () {
    expect(groupsConcerning({GroupType.hommes}), {
      GroupType.hommes,
      GroupType.choeurComplet,
      GroupType.tous,
    });
    expect(groupsConcerning({GroupType.orchestre, GroupType.jeunesEnfants}), {
      GroupType.orchestre,
      GroupType.jeunesEnfants,
      GroupType.tous,
    });
  });

  test('nothing chosen shows everything', () {
    expect(groupsConcerning({}), allRehearsalGroups.toSet());
    expect(allRehearsalGroups.toSet(), GroupType.values.toSet());
  });
}
