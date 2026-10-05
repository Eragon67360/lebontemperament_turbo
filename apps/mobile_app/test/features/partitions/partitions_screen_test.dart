import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/features/partitions/presentation/screens/partitions_screen.dart';

import '../../helpers/screen_harness.dart';

/// The partitions explorer in the « Coulisses » look: segmented ensembles,
/// breadcrumb, typed rows and the floating player.
void main() {
  testWidgets('shows the ensembles, the rows and their actions', (
    tester,
  ) async {
    await pumpScreen(tester, const PartitionsScreen());

    expect(find.text('Partitions'), findsOneWidget);
    for (final label in ['Adultes', 'Jeunes', 'Cahier 30 ans']) {
      expect(find.text(label), findsWidgets);
    }
    expect(find.text('Sous-dossier de test'), findsOneWidget);
    expect(find.text('Partition de test.pdf'), findsOneWidget);
    expect(find.text('Enregistrement de test.mp3'), findsOneWidget);
    expect(find.byTooltip('Ouvrir Partition de test.pdf'), findsOneWidget);
    expect(
      find.byTooltip('Écouter Enregistrement de test.mp3'),
      findsOneWidget,
    );
    expect(find.byTooltip('Télécharger Partition de test.pdf'), findsOneWidget);
    expect(find.text('Accès direct au Drive'), findsOneWidget);
    // No track loaded: no player.
    expect(find.byTooltip('Fermer le lecteur'), findsNothing);
  });

  testWidgets('every ensemble segment is at least 48 dp tall', (tester) async {
    await pumpScreen(tester, const PartitionsScreen());
    for (final label in ['Adultes', 'Jeunes', 'Cahier 30 ans']) {
      final segment = find
          .ancestor(of: find.text(label).first, matching: find.byType(InkWell))
          .first;
      expect(tester.getSize(segment).height, greaterThanOrEqualTo(48));
    }
  });

  testWidgets('a folder opens with its name, and back goes up', (tester) async {
    await pumpScreen(tester, const PartitionsScreen());

    await tester.tap(find.text('Sous-dossier de test'));
    await tester.pumpAndSettle();

    // The folder's name is now the title, under the ensemble's eyebrow.
    expect(find.text('ADULTES'), findsOneWidget);
    expect(find.byTooltip('Dossier parent'), findsOneWidget);

    await tester.tap(find.byTooltip('Dossier parent'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Dossier parent'), findsNothing);
    expect(find.text('ENSEMBLE'), findsOneWidget);
  });

  testWidgets('switching ensemble resets the folder path', (tester) async {
    await pumpScreen(tester, const PartitionsScreen());
    await tester.tap(find.text('Sous-dossier de test'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Dossier parent'), findsOneWidget);

    await tester.tap(find.text('Jeunes'));
    await tester.pumpAndSettle();
    expect(find.byTooltip('Dossier parent'), findsNothing);
  });

  for (final scale in const [1.3, 2.0]) {
    testWidgets('dark theme renders without overflow at ${scale}x', (
      tester,
    ) async {
      GoogleFonts.config.allowRuntimeFetching = false;
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        ProviderScope(
          overrides: offlineOverrides(),
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.dark,
            locale: const Locale('fr', 'FR'),
            supportedLocales: const [Locale('fr', 'FR')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(
                context,
              ).copyWith(textScaler: TextScaler.linear(scale)),
              child: child!,
            ),
            home: const PartitionsScreen(),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(seconds: 1));
      expect(tester.takeException(), isNull);
      expect(find.text('Partition de test.pdf'), findsOneWidget);
    });
  }

  testWidgets('playing a recording shows the floating player', (tester) async {
    final messenger =
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    // The audio plugin answers nothing: no sound in tests.
    Future<Object?> silent(MethodCall call) async => null;
    for (final name in [
      'xyz.luan/audioplayers',
      'xyz.luan/audioplayers.global',
      'xyz.luan/audioplayers.global/events',
    ]) {
      messenger.setMockMethodCallHandler(MethodChannel(name), silent);
      addTearDown(
        () => messenger.setMockMethodCallHandler(MethodChannel(name), null),
      );
    }

    await pumpScreen(tester, const PartitionsScreen(), textScale: 2.0);

    await tester.tap(find.byTooltip('Écouter Enregistrement de test.mp3'));
    // The download writes a real temporary file.
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 200)),
    );
    await tester.pump();
    // The per-player event channel has a random name and no mock; ignore
    // the plugin's complaint about it.
    tester.takeException();

    expect(find.byTooltip('Fermer le lecteur'), findsOneWidget);
    expect(find.text('Enregistrement de test.mp3'), findsNWidgets(2));
    expect(tester.takeException(), isNull);

    await tester.tap(find.byTooltip('Fermer le lecteur'));
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 50)),
    );
    await tester.pump();
    tester.takeException();
    expect(find.byTooltip('Fermer le lecteur'), findsNothing);
  });
}
