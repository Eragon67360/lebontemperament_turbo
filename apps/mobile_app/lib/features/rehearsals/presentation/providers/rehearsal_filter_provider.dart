import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../../core/utils/date_utils.dart' as app_date_utils;
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../../data/providers/my_groups_provider.dart';

/// The calendar's filters: the groups whose rehearsals are listed. `null`
/// until the member changes them, so the calendar opens on the groups that
/// concern their ensembles; choosing other ensembles in Profil starts over.
class RehearsalFilterNotifier extends StateNotifier<Set<GroupType>?> {
  RehearsalFilterNotifier() : super(null);

  void set(Set<GroupType> groups) => state = Set.unmodifiable(groups);

  /// Back to the member's ensembles.
  void reset() => state = null;
}

final rehearsalFilterProvider =
    StateNotifierProvider<RehearsalFilterNotifier, Set<GroupType>?>((ref) {
      ref.watch(myGroupsProvider);
      return RehearsalFilterNotifier();
    });

/// The groups the calendar lists right now.
final calendarGroupsProvider = Provider<Set<GroupType>>(
  (ref) =>
      ref.watch(rehearsalFilterProvider) ??
      ref.watch(myRehearsalGroupsProvider),
);

final filteredRehearsalsProvider = Provider<List<Rehearsal>>((ref) {
  final rehearsalsAsync = ref.watch(realtimeRehearsalsProvider);
  final groups = ref.watch(calendarGroupsProvider);

  return rehearsalsAsync.when(
    data: (rehearsals) {
      final upcoming = rehearsals.items.where((r) {
        return groups.contains(r.groupType) &&
            app_date_utils.isRehearsalUpcoming(
              date: r.date,
              startTime: r.startTime,
              endTime: r.endTime,
            );
      }).toList()..sort(compareRehearsals);
      return upcoming;
    },
    loading: () => [],
    error: (_, _) => [],
  );
});

/// Soonest first, by date then start time, so two rehearsals on the same
/// day keep their order and the first one is the next one. Rows without a
/// date (« Date à confirmer ») go last.
int compareRehearsals(Rehearsal a, Rehearsal b) {
  final da = a.date ?? '', db = b.date ?? '';
  if (da.isEmpty != db.isEmpty) return da.isEmpty ? 1 : -1;
  final byDate = da.compareTo(db);
  if (byDate != 0) return byDate;
  return (a.startTime ?? '').compareTo(b.startTime ?? '');
}
