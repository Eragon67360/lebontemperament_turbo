import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../features/onboarding/data/welcome_prefs.dart';
import '../models/rehearsal.dart';

/// The ensembles a member can say they belong to (welcome tour and
/// Profil › Mes ensembles), in the order they are offered.
const memberGroups = <GroupType>[
  GroupType.femmes,
  GroupType.hommes,
  GroupType.orchestre,
  GroupType.jeunesEnfants,
];

/// Every group a rehearsal can carry, in the order the calendar shows them.
const allRehearsalGroups = <GroupType>[
  GroupType.orchestre,
  GroupType.hommes,
  GroupType.femmes,
  GroupType.jeunesEnfants,
  GroupType.choeurComplet,
  GroupType.tous,
];

/// The rehearsal groups that concern a member of [mine]: their own
/// ensembles, « Tout le monde », and the full choir for the men and the
/// women. Nothing chosen means everything.
Set<GroupType> groupsConcerning(Set<GroupType> mine) {
  if (mine.isEmpty) return allRehearsalGroups.toSet();
  return {
    ...mine,
    GroupType.tous,
    if (mine.contains(GroupType.hommes) || mine.contains(GroupType.femmes))
      GroupType.choeurComplet,
  };
}

/// What this phone remembered at launch, read in `main` before the first
/// frame so the home screen never shows other ensembles' rehearsals first.
final initialMyGroupsProvider = Provider<Set<GroupType>>((_) => const {});

class MyGroupsNotifier extends StateNotifier<Set<GroupType>> {
  MyGroupsNotifier(super.initial);

  Future<void> set(Set<GroupType> groups) async {
    state = Set.unmodifiable(groups);
    await WelcomePrefs.setMyGroups(groups);
  }
}

/// The member's ensembles; empty means « everything ».
final myGroupsProvider =
    StateNotifierProvider<MyGroupsNotifier, Set<GroupType>>(
      (ref) => MyGroupsNotifier(ref.read(initialMyGroupsProvider)),
    );

/// The rehearsal groups the home screen and the reminders show.
final myRehearsalGroupsProvider = Provider<Set<GroupType>>(
  (ref) => groupsConcerning(ref.watch(myGroupsProvider)),
);
