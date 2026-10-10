import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';

import '../../helpers/screen_harness.dart';

/// A member's feedback (October 2026): the shortcuts sat below the fold and
/// read like the rehearsal rows, and tapping the next concert opened the
/// concerts list instead of that concert.
void main() {
  testWidgets('« Espace membres » comes before the agenda', (tester) async {
    await pumpScreen(tester, const HomeScreen());

    final members = tester.getTopLeft(find.text('Espace membres')).dy;
    final partitions = tester.getTopLeft(find.text('Partitions')).dy;
    // « Calendrier » sits under the next rehearsal.
    final rehearsal = tester.getTopLeft(find.text('Calendrier')).dy;
    expect(members, lessThan(rehearsal));
    expect(partitions, lessThan(rehearsal));
    // Visible on a 390 × 844 screen without scrolling.
    expect(partitions, lessThan(844));
  });

  testWidgets('tapping the next concert opens its detail', (tester) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    tester.view.physicalSize = const Size(390, 1600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final router = GoRouter(
      routes: [
        GoRoute(path: '/', builder: (_, _) => const HomeScreen()),
        GoRoute(
          path: '/concerts/:id',
          builder: (_, state) =>
              Scaffold(body: Text('Détail ${state.pathParameters['id']}')),
        ),
      ],
    );
    addTearDown(router.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: offlineOverrides(),
        child: MaterialApp.router(
          theme: AppTheme.lightTheme,
          locale: const Locale('fr', 'FR'),
          supportedLocales: const [Locale('fr', 'FR')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          routerConfig: router,
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text(kTestConcert.name!));
    await tester.pumpAndSettle();

    expect(find.text('Détail ${kTestConcert.id}'), findsOneWidget);
  });
}
