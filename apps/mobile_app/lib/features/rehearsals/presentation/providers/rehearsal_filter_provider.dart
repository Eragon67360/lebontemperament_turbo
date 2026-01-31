import 'package:flutter_riverpod/flutter_riverpod.dart';

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
      final upcoming = rehearsals.where((r) {
        return app_date_utils.isRehearsalUpcoming(
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
        );
      }).toList();
      if (selectedFilter == null) {
        return upcoming;
      }
      return upcoming
          .where((rehearsal) => rehearsal.groupType == selectedFilter)
          .toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});
