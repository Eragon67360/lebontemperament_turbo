import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/administration/presentation/screens/administration_screen.dart';
import 'package:lebontemperament/features/auth/presentation/screens/login_screen.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concerts_events_screen.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';
import 'package:lebontemperament/features/partitions/presentation/screens/partitions_screen.dart';
import 'package:lebontemperament/features/profile/presentation/screens/about_screen.dart';
import 'package:lebontemperament/features/profile/presentation/screens/profile_screen.dart';

import '../helpers/screen_harness.dart';

/// The main screens must lay out without overflow when the system text size
/// is 1.3× or 2× (#359). A RenderFlex overflow is a FlutterError in debug
/// mode, so it surfaces through [WidgetTester.takeException].
void main() {
  final screens = <String, Widget Function()>{
    'login': () => const LoginScreen(),
    'home': () => const HomeScreen(),
    'concerts': () => const ConcertsEventsScreen(),
    'profile': () => const ProfileScreen(),
    'about': () => const AboutScreen(),
    'administration': () => const AdministrationScreen(),
    'partitions': () => const PartitionsScreen(),
  };

  for (final scale in const [1.3, 2.0]) {
    for (final entry in screens.entries) {
      testWidgets('${entry.key} renders without overflow at ${scale}x', (
        tester,
      ) async {
        await pumpScreen(
          tester,
          entry.value(),
          textScale: scale,
          superadmin: true,
        );
        expect(
          tester.takeException(),
          isNull,
          reason: '${entry.key} at ${scale}x text scale',
        );
      });
    }
  }

  testWidgets('home: the date badge grows with the text instead of clipping', (
    tester,
  ) async {
    await pumpScreen(tester, const HomeScreen(), textScale: 2.0);
    expect(tester.takeException(), isNull);

    // The badge shows the day of the month of the fixture concert (21), in
    // the concert block further down the page.
    await tester.scrollUntilVisible(find.text('21'), 300);
    final dayText = find.text('21').first;
    final badge = find
        .ancestor(of: dayText, matching: find.byType(Container))
        .first;
    final badgeSize = tester.getSize(badge);
    expect(badgeSize.height, greaterThan(48));
    // Let the scroll settle and the blocks it brought in finish their
    // entrance animation.
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 2));
  });
}
