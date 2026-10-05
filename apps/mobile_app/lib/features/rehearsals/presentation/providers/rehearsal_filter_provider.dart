import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../../../../core/utils/date_utils.dart' as app_date_utils;
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';

class RehearsalFilterNotifier extends StateNotifier<GroupType?> {
  RehearsalFilterNotifier() : super(null);

  void setFilter(GroupType? groupType) {
    state = groupType;
  }

  void clearFilter() {
    state = null;
  }
}

final rehearsalFilterProvider =
    StateNotifierProvider<RehearsalFilterNotifier, GroupType?>(
      (ref) => RehearsalFilterNotifier(),
    );

final filteredRehearsalsProvider = Provider<List<Rehearsal>>((ref) {
  final rehearsalsAsync = ref.watch(realtimeRehearsalsProvider);
  final selectedFilter = ref.watch(rehearsalFilterProvider);

  return rehearsalsAsync.when(
    data: (rehearsals) {
      final upcoming = rehearsals.items.where((r) {
        return app_date_utils.isRehearsalUpcoming(
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
        );
      }).toList()..sort(compareRehearsals);
      if (selectedFilter == null) {
        return upcoming;
      }
      return upcoming
          .where((r) => rehearsalConcerns(r.groupType, selectedFilter))
          .toList();
    },
    loading: () => [],
    error: (_, __) => [],
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

/// Whether a rehearsal for [group] concerns members who filtered on
/// [filter]: « Tous » concerns everyone, and the full choir concerns the men
/// and the women too.
bool rehearsalConcerns(GroupType group, GroupType filter) {
  if (group == filter || group == GroupType.tous) return true;
  return group == GroupType.choeurComplet &&
      (filter == GroupType.hommes || filter == GroupType.femmes);
}
