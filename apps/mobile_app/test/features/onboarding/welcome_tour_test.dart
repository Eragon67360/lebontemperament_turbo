import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/features/auth/presentation/providers/auth_provider.dart';
import 'package:lebontemperament/features/onboarding/data/welcome_prefs.dart';
import 'package:lebontemperament/features/onboarding/presentation/screens/welcome_tour_screen.dart';
import 'package:lebontemperament/features/onboarding/presentation/widgets/first_time_tip.dart';
import 'package:lebontemperament/features/rehearsals/presentation/providers/rehearsal_filter_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    GoogleFonts.config.allowRuntimeFetching = false;
    SharedPreferences.setMockInitialValues({});
  });

  Future<ProviderContainer> pumpTour(
    WidgetTester tester, {
    double textScale = 1.0,
    Size size = const Size(390, 844),
  }) async {
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final container = ProviderContainer(
      overrides: [displayNameProvider.overrideWithValue('Camille Test')],
    );
    addTearDown(container.dispose);
    final router = GoRouter(
      initialLocation: '/welcome',
      routes: [
        GoRoute(
          path: '/main',
          builder: (_, _) => const Scaffold(body: Text('Accueil de test')),
        ),
        GoRoute(path: '/welcome', builder: (_, _) => const WelcomeTourScreen()),
      ],
    );
    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(
          theme: AppTheme.darkTheme,
          routerConfig: router,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(textScale)),
            child: child!,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    return container;
  }

  testWidgets('the tour walks through every page and remembers the ensemble', (
    tester,
  ) async {
    final container = await pumpTour(tester);

    expect(find.text('Bienvenue dans les coulisses, Camille'), findsOneWidget);
    await tester.tap(find.text('Faire la visite'));
    await tester.pumpAndSettle();

    expect(find.text('Quel est votre ensemble ?'), findsOneWidget);
    expect(find.bySemanticsLabel('Étape 1 sur 6'), findsOneWidget);
    await tester.tap(find.text('Hommes'));
    await tester.pump();
    await tester.tap(find.text('Continuer'));
    await tester.pumpAndSettle();

    for (final title in const [
      'L’accueil, votre prochain rendez-vous',
      'Le calendrier des répétitions',
      'Partitions et enregistrements',
      'Les concerts, et toute la troupe',
    ]) {
      expect(find.text(title), findsOneWidget);
      await tester.tap(find.text('Suivant'));
      await tester.pumpAndSettle();
    }

    expect(
      find.text('Un petit rappel avant chaque répétition ?'),
      findsOneWidget,
    );
    expect(find.text('Passer'), findsNothing);
    await tester.tap(find.text('C’est parti'));
    await tester.pumpAndSettle();

    expect(find.text('Accueil de test'), findsOneWidget);
    expect(await WelcomePrefs.tourSeen(), isTrue);
    expect(await WelcomePrefs.myGroup(), GroupType.hommes);
    expect(container.read(rehearsalFilterProvider), GroupType.hommes);
  });

  testWidgets('« Plus tard » ends the tour without touching the filter', (
    tester,
  ) async {
    final container = await pumpTour(tester);

    await tester.tap(find.text('Plus tard'));
    await tester.pumpAndSettle();

    expect(find.text('Accueil de test'), findsOneWidget);
    expect(await WelcomePrefs.tourSeen(), isTrue);
    expect(await WelcomePrefs.myGroup(), isNull);
    expect(container.read(rehearsalFilterProvider), isNull);
  });

  testWidgets('every page fits at 2× text on a 360 dp phone', (tester) async {
    await pumpTour(tester, textScale: 2.0, size: const Size(360, 640));
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Faire la visite'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Continuer'));
    await tester.pumpAndSettle();
    for (var i = 0; i < 4; i++) {
      expect(tester.takeException(), isNull);
      await tester.tap(find.text('Suivant'));
      await tester.pumpAndSettle();
    }
    expect(tester.takeException(), isNull);
    expect(find.text('C’est parti'), findsOneWidget);
  });

  testWidgets('a first-time tip shows once, then stays dismissed', (
    tester,
  ) async {
    Future<void> pumpTip() async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.lightTheme,
          home: const Scaffold(
            body: FirstTimeTip(id: 'test_tip', message: 'Une astuce de test'),
          ),
        ),
      );
      await tester.pumpAndSettle();
    }

    await pumpTip();
    expect(find.text('Une astuce de test'), findsOneWidget);
    await tester.tap(find.text('Compris'));
    await tester.pumpAndSettle();
    expect(find.text('Une astuce de test'), findsNothing);

    await tester.pumpWidget(const SizedBox());
    await pumpTip();
    expect(find.text('Une astuce de test'), findsNothing);

    await WelcomePrefs.resetTips();
    await tester.pumpWidget(const SizedBox());
    await pumpTip();
    expect(find.text('Une astuce de test'), findsOneWidget);
  });
}
