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

/// Every icon-only control must have an accessible name (#359): TalkBack and
/// VoiceOver read the tooltip, and it shows on long press.
void main() {
  final screens = <String, Widget>{
    'login': const LoginScreen(),
    'home': const HomeScreen(),
    'concerts': const ConcertsEventsScreen(),
    'profile': const ProfileScreen(),
    'about': const AboutScreen(),
    'administration': const AdministrationScreen(),
    'partitions': const PartitionsScreen(),
  };

  for (final entry in screens.entries) {
    testWidgets('${entry.key}: every IconButton has a tooltip', (tester) async {
      await pumpScreen(tester, entry.value, superadmin: true);

      final buttons = find.byType(IconButton);
      if (entry.key != 'home') {
        // Home has no icon-only control today; every other screen does.
        expect(
          buttons,
          findsWidgets,
          reason: 'the ${entry.key} screen is expected to have icon buttons',
        );
      }

      final missing = <String>[];
      for (final element in buttons.evaluate()) {
        final button = element.widget as IconButton;
        final tooltip = button.tooltip;
        if (tooltip == null || tooltip.trim().isEmpty) {
          missing.add(button.icon.toString());
        }
      }
      expect(
        missing,
        isEmpty,
        reason: 'IconButtons without tooltip on ${entry.key}: $missing',
      );
    });
  }

  testWidgets('login: the password toggle names its action', (tester) async {
    await pumpScreen(tester, const LoginScreen());

    expect(find.byTooltip('Afficher le mot de passe'), findsOneWidget);
    await tester.tap(find.byTooltip('Afficher le mot de passe'));
    await tester.pump();
    expect(find.byTooltip('Masquer le mot de passe'), findsOneWidget);
  });
}
