import 'package:flutter_riverpod/legacy.dart';

final mainNavigationProvider =
    StateNotifierProvider<MainNavigationNotifier, int>(
      (ref) => MainNavigationNotifier(),
    );

class MainNavigationNotifier extends StateNotifier<int> {
  MainNavigationNotifier() : super(0);

  void setTab(int index) {
    state = index;
  }
}
