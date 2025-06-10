import 'package:flutter_riverpod/flutter_riverpod.dart';

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
      if (selectedFilter == null) {
        return rehearsals;
      }
      return rehearsals
          .where((rehearsal) => rehearsal.groupType == selectedFilter)
          .toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});
