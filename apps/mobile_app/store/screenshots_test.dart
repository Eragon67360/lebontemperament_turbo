// Play Store screenshots, rendered from the real screens with demo data.
//
//   flutter test store/screenshots_test.dart --update-goldens
//
// writes the framed 1080 × 1920 images into the store listing
// (android/fastlane/metadata/android/fr-FR/images/phoneScreenshots), which
// the "Play Store" workflow publishes. Demo data only: no member, no real
// address, nothing from the database.
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/drive_file.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concert_detail_screen.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concerts_events_screen.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';
import 'package:lebontemperament/features/partitions/presentation/screens/partitions_screen.dart';
import 'package:lebontemperament/features/rehearsals/presentation/screens/rehearsals_screen.dart';

import '../test/helpers/screen_harness.dart';

const _out =
    '../android/fastlane/metadata/android/fr-FR/images/phoneScreenshots';

/// A date [days] from today, as the database stores it (YYYY-MM-DD): the
/// screens only list what is still to come.
String _day(int days) {
  final d = DateTime.now().add(Duration(days: days));
  return '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}

final _rehearsals = [
  Rehearsal(
    id: 'demo-r1',
    name: 'Répétition chœur complet',
    place: 'Salle de musique',
    date: _day(3),
    startTime: '20:00:00',
    endTime: '22:00:00',
    groupType: GroupType.choeurComplet,
  ),
  Rehearsal(
    id: 'demo-r2',
    name: 'Répétition d’orchestre',
    place: 'Salle de musique',
    date: _day(5),
    startTime: '19:30:00',
    endTime: '21:30:00',
    groupType: GroupType.orchestre,
  ),
  Rehearsal(
    id: 'demo-r3',
    name: 'Pupitres femmes',
    place: 'Salle paroissiale',
    date: _day(9),
    startTime: '20:00:00',
    endTime: '21:30:00',
    groupType: GroupType.femmes,
  ),
  Rehearsal(
    id: 'demo-r4',
    name: 'Jeunes et enfants',
    place: 'Salle de musique',
    date: _day(10),
    startTime: '14:00:00',
    endTime: '16:00:00',
    groupType: GroupType.jeunesEnfants,
  ),
  Rehearsal(
    id: 'demo-r5',
    name: 'Générale',
    place: 'Église',
    date: _day(16),
    startTime: '18:00:00',
    endTime: '22:00:00',
    groupType: GroupType.tous,
  ),
];

final _concerts = [
  Concert(
    id: 'demo-c1',
    name: 'Concert de printemps',
    place: 'Église',
    date: _day(17),
    time: '20:30:00',
    context: Context.orchestreEtChoeur,
    additionalInformations:
        'Chœurs et orchestre réunis pour un programme de printemps. '
        'Entrée libre, plateau au profit de l’association.',
  ),
  Concert(
    id: 'demo-c2',
    name: 'Concert des jeunes',
    place: 'Salle des fêtes',
    date: _day(31),
    time: '17:00:00',
    context: Context.choeur,
  ),
  Concert(
    id: 'demo-c3',
    name: 'Soirée orchestre',
    place: 'Auditorium',
    date: _day(45),
    time: '20:00:00',
    context: Context.orchestre,
  ),
];

final _events = [
  Event(
    id: 'demo-e1',
    title: 'Vente de gâteaux',
    dateFrom: _day(12),
    time: '10:00:00',
    location: 'Place du marché',
    eventType: EventType.vente,
    description: 'Au profit du voyage d’été du chœur.',
  ),
  Event(
    id: 'demo-e2',
    title: 'Week-end choral',
    dateFrom: _day(24),
    dateTo: _day(25),
    location: 'Gîte de groupe',
    eventType: EventType.sejour,
  ),
];

final _catalog = DriveFolderCatalog(
  tabs: const [
    DriveFolder(slug: 'adultes', label: 'Adultes', folderId: 'demo-a'),
    DriveFolder(slug: 'jeunes', label: 'Jeunes', folderId: 'demo-j'),
    DriveFolder(slug: 'enfants', label: 'Enfants', folderId: 'demo-e'),
    DriveFolder(slug: 'orchestre', label: 'Orchestre', folderId: 'demo-o'),
  ],
  root: const DriveFolder(
    slug: kDriveRootSlug,
    label: 'Drive complet',
    folderId: 'demo-root',
  ),
  fromFallback: false,
);

/// A season folder with scores and practice recordings (public-domain
/// repertoire, made-up file names).
class _DemoDriveService extends FakeDriveService {
  @override
  Future<List<DriveFile>> getFolderContents(String folderId) async => const [
    DriveFile(
      id: 'demo-f1',
      name: 'Concert de printemps',
      type: 'folder',
      mimeType: 'application/vnd.google-apps.folder',
    ),
    DriveFile(
      id: 'demo-f2',
      name: 'Chants de Noël',
      type: 'folder',
      mimeType: 'application/vnd.google-apps.folder',
    ),
    DriveFile(
      id: 'demo-p1',
      name: 'Fauré – Cantique de Jean Racine.pdf',
      type: 'file',
      mimeType: 'application/pdf',
    ),
    DriveFile(
      id: 'demo-a1',
      name: 'Cantique – pupitre soprano.mp3',
      type: 'file',
      mimeType: 'audio/mpeg',
    ),
    DriveFile(
      id: 'demo-a2',
      name: 'Cantique – pupitre alto.mp3',
      type: 'file',
      mimeType: 'audio/mpeg',
    ),
    DriveFile(
      id: 'demo-p2',
      name: 'Mozart – Ave verum corpus.pdf',
      type: 'file',
      mimeType: 'application/pdf',
    ),
  ];
}

class _Shot {
  const _Shot(this.file, this.caption, this.screen, {this.dark = true});
  final String file;
  final String caption;
  final Widget screen;
  final bool dark;
}

final _shots = [
  const _Shot('1_accueil', 'Votre saison,\nd’un coup d’œil', HomeScreen()),
  const _Shot(
    '2_repetitions',
    'Les répétitions\nde votre pupitre',
    RehearsalsScreen(),
  ),
  const _Shot('3_concerts', 'Concerts et\nrendez-vous', ConcertsEventsScreen()),
  const _Shot(
    '4_partitions',
    'Partitions et\nenregistrements',
    PartitionsScreen(),
  ),
  const _Shot(
    '5_concert',
    'Lieu, horaire\net itinéraire',
    ConcertDetailScreen(concertId: 'demo-c1'),
  ),
  const _Shot(
    '6_theme_clair',
    'Aussi en\nthème clair',
    HomeScreen(),
    dark: false,
  ),
];

Future<void> _loadFonts() async {
  // flutter_tester lives in <flutter>/bin/cache/artifacts/engine/<platform>.
  final artifacts = File(Platform.resolvedExecutable).parent.parent.parent;
  final material = '${artifacts.path}/material_fonts';
  Future<void> family(String name, Iterable<String> paths) async {
    final loader = FontLoader(name);
    for (final path in paths) {
      final bytes = File(path).readAsBytesSync();
      loader.addFont(Future.value(ByteData.sublistView(bytes)));
    }
    await loader.load();
  }

  // The app's fonts come from assets/google_fonts (google_fonts loads them
  // from the asset bundle); the frame's caption uses the display face too.
  await family('Caption', [
    'assets/google_fonts/BricolageGrotesque-ExtraBold.ttf',
  ]);
  await family('Roboto', [
    for (final w in ['Regular', 'Medium', 'Bold', 'Light'])
      '$material/Roboto-$w.ttf',
  ]);
  await family('MaterialIcons', ['$material/MaterialIcons-Regular.otf']);
}

/// The store frame: the stage's dark ground lit in teal, the caption, and
/// the real screen in a
/// phone-shaped window at a true phone size (390 × 844), scaled down.
class _Frame extends StatelessWidget {
  const _Frame({required this.caption, required this.child});
  final String caption;
  final Widget child;

  static const _phone = Size(390, 844);

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF14474B), Color(0xFF0D1517)],
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 44),
            Text(
              caption,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: 'Caption',
                fontWeight: FontWeight.w800,
                fontSize: 27,
                height: 1.2,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 28),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 34),
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(
                        color: const Color(0xFF2A3B3E),
                        width: 6,
                      ),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x55000000),
                          blurRadius: 30,
                          offset: Offset(0, 12),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: FittedBox(
                        fit: BoxFit.fitWidth,
                        alignment: Alignment.topCenter,
                        child: SizedBox.fromSize(
                          size: _phone,
                          child: MediaQuery(
                            data: MediaQuery.of(context).copyWith(
                              size: _phone,
                              padding: const EdgeInsets.only(top: 24),
                              viewPadding: const EdgeInsets.only(top: 24),
                              textScaler: TextScaler.noScaling,
                            ),
                            child: child,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Plugins the screens touch on start-up (the audio player, the image
/// cache's directory) answer from memory: there is no device here.
void _mockPlugins() {
  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
  final temp = Directory.systemTemp.createTempSync('lbt_store_').path;
  messenger.setMockMethodCallHandler(
    const MethodChannel('plugins.flutter.io/path_provider'),
    (call) async => temp,
  );
  for (final channel in [
    'xyz.luan/audioplayers',
    'xyz.luan/audioplayers.global',
    'xyz.luan/audioplayers.global/events',
  ]) {
    messenger.setMockMethodCallHandler(
      MethodChannel(channel),
      (call) async => null,
    );
  }
}

void main() {
  setUpAll(() async {
    _mockPlugins();
    await _loadFonts();
  });

  for (final shot in _shots) {
    testWidgets(shot.file, (tester) async {
      GoogleFonts.config.allowRuntimeFetching = false;
      // 360 × 640 logical at 3× = 1080 × 1920, Google Play's phone format.
      tester.view.physicalSize = const Size(1080, 1920);
      tester.view.devicePixelRatio = 3;
      addTearDown(tester.view.reset);

      // Each audio player listens on its own event channel (a random name):
      // there's nothing to mock, and no sound in a screenshot anyway.
      final reportError = FlutterError.onError;
      FlutterError.onError = (details) {
        if (details.exception is MissingPluginException) return;
        reportError?.call(details);
      };
      addTearDown(() => FlutterError.onError = reportError);

      final concerts = ListResult.fresh(_concerts);
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            ...offlineOverrides(
              rehearsals: ListResult.fresh(_rehearsals),
              concerts: concerts,
              events: ListResult.fresh(_events),
              displayName: 'Camille',
              drive: _DemoDriveService(),
              catalog: _catalog,
              homeRehearsals: _rehearsals,
              homeConcerts: _concerts,
            ),
            realtimeConcertsProvider.overrideWith((ref) async => concerts),
            concertProvider.overrideWith(
              (ref, id) async => _concerts.firstWhere((c) => c.id == id),
            ),
          ],
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: shot.dark ? AppTheme.darkTheme : AppTheme.lightTheme,
            locale: const Locale('fr', 'FR'),
            supportedLocales: const [Locale('fr', 'FR')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: _Frame(caption: shot.caption, child: shot.screen),
          ),
        ),
      );
      // Fonts load from the asset bundle asynchronously; then the entrance
      // animations (up to 1.3 s).
      await tester.pump();
      await tester.runAsync(GoogleFonts.pendingFonts);
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(seconds: 2));
      await tester.pump(const Duration(seconds: 1));

      await expectLater(
        find.byType(_Frame),
        matchesGoldenFile('$_out/${shot.file}.png'),
      );
      // Let the screens' own timers (entrance animations) run out.
      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(seconds: 5));
    });
  }
}
