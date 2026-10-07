import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:lebontemperament/features/partitions/presentation/screens/partitions_screen.dart';

import '../../helpers/screen_harness.dart';

/// Fails every listing until [failing] is cleared.
class _FlakyDriveService extends FakeDriveService {
  bool failing = true;
  int calls = 0;

  @override
  Future<DriveListing> getFolderContents(String folderId) {
    calls++;
    if (failing) {
      throw DriveServiceException(
        'Connexion impossible. Vérifiez votre réseau.',
      );
    }
    return super.getFolderContents(folderId);
  }
}

/// Says the folder holds more than it returned.
class _TruncatedDriveService extends FakeDriveService {
  @override
  Future<DriveListing> getFolderContents(String folderId) async => DriveListing(
    items: (await super.getFolderContents(folderId)).items,
    truncated: true,
  );
}

/// No sound in tests: the audio plugin answers nothing.
void _silenceAudio() {
  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
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
}

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
    // No link out to Drive: the folders are members-only (#347).
    expect(find.textContaining('Drive'), findsNothing);
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

  testWidgets('a long press on a row shows its whole name', (tester) async {
    await pumpScreen(tester, const PartitionsScreen());

    await tester.longPress(find.text('Partition de test.pdf'));
    await tester.pumpAndSettle();

    expect(find.byType(AlertDialog), findsOneWidget);
    expect(find.text('Partition de test.pdf'), findsNWidgets(2));
    await tester.tap(find.text('Fermer'));
    await tester.pumpAndSettle();
    expect(find.byType(AlertDialog), findsNothing);
  });

  testWidgets('reloads the folder by itself once the network is back', (
    tester,
  ) async {
    final drive = _FlakyDriveService();
    final online = StreamController<bool>();
    addTearDown(online.close);
    await pumpScreen(
      tester,
      const PartitionsScreen(),
      onlineStream: online.stream,
      drive: drive,
    );
    online.add(true);
    await tester.pumpAndSettle();
    expect(find.text('Réessayer'), findsOneWidget);
    expect(drive.calls, 1);

    // Going offline changes nothing; coming back reloads.
    online.add(false);
    await tester.pumpAndSettle();
    expect(drive.calls, 1);
    drive.failing = false;
    online.add(true);
    await tester.pumpAndSettle();

    expect(drive.calls, 2);
    expect(find.text('Réessayer'), findsNothing);
    expect(find.text('Partition de test.pdf'), findsOneWidget);
  });

  testWidgets('says when the website could not list the whole folder', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const PartitionsScreen(),
      drive: _TruncatedDriveService(),
    );
    expect(find.textContaining('plus de fichiers'), findsOneWidget);
  });

  testWidgets('the player seeks: slider semantics and ±10 s buttons', (
    tester,
  ) async {
    _silenceAudio();
    final semantics = tester.ensureSemantics();
    await pumpScreen(tester, const PartitionsScreen());

    await tester.tap(find.byTooltip('Écouter Enregistrement de test.mp3'));
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 200)),
    );
    await tester.pump();
    tester.takeException();

    expect(find.byTooltip('Reculer de 10 secondes'), findsOneWidget);
    expect(find.byTooltip('Avancer de 10 secondes'), findsOneWidget);
    for (final tooltip in [
      'Reculer de 10 secondes',
      'Avancer de 10 secondes',
    ]) {
      final size = tester.getSize(find.byTooltip(tooltip));
      expect(size.width, greaterThanOrEqualTo(48));
      expect(size.height, greaterThanOrEqualTo(48));
    }
    final waveform = find.byWidgetPredicate(
      (w) => w is Semantics && w.properties.label == 'Position de lecture',
    );
    final slider = tester.getSemantics(waveform);
    expect(slider.flagsCollection.isSlider, isTrue);
    expect(slider.value, isNotEmpty);
    // The plugin never answered a duration: a tap seeks nowhere and must
    // not throw.
    await tester.tap(waveform);
    await tester.pump();
    expect(tester.takeException(), isNull);
    semantics.dispose();
  });

  testWidgets('playing a recording shows the floating player', (tester) async {
    _silenceAudio();

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
