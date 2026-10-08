import 'package:flutter_riverpod/legacy.dart';

/// The tab open in the public part: 0 Accueil, 1 Concerts, 2 Nous rejoindre,
/// 3 À propos.
final publicNavigationProvider = StateProvider<int>((ref) => 0);

/// Tab indexes, so the home's buttons say where they go.
abstract final class PublicTab {
  static const int home = 0;
  static const int concerts = 1;
  static const int join = 2;
  static const int about = 3;
}
