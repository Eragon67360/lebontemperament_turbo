// Store screenshots, rendered from the real screens with demo data.
//
//   flutter test store/screenshots_test.dart
//
// writes the framed images into both store listings: Google Play's phone
// format (android/fastlane/metadata/android/fr-FR/images/phoneScreenshots,
// published by the "Play Store" workflow) and the App Store's iPhone 6.9"
// and iPad 13" formats (ios/fastlane/screenshots/fr-FR, published by the
// "iOS TestFlight" workflow's « Update the App Store page »). Demo data
// only: no member, no real address, nothing from the database.
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
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
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concert_detail_screen.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concerts_events_screen.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';
import 'package:lebontemperament/features/partitions/presentation/screens/partitions_screen.dart';
import 'package:lebontemperament/features/rehearsals/presentation/screens/rehearsals_screen.dart';

import '../test/helpers/screen_harness.dart';

/// One store format: the image size, and the screen shown in the frame at
/// its true size on that device.
class _Device {
  const _Device({
    required this.out,
    required this.prefix,
    required this.physicalSize,
    required this.pixelRatio,
    required this.screen,
    required this.topInset,
    this.scale = 1,
  });

  /// Folder (relative to the app, where flutter test runs) the images are written to.
  final String out;

  /// File name prefix: deliver orders the App Store screenshots by name and
  /// tells the devices apart by size, so iPhone and iPad share the folder.
  final String prefix;
  final Size physicalSize;
  final double pixelRatio;
  final Size screen;

  /// Status bar height on the device, left empty at the top of the screen.
  final double topInset;

  /// Frame scale: caption, margins and border grow with the image.
  final double scale;
}

const _ios = 'ios/fastlane/screenshots/fr-FR';

const _devices = [
  // 360 × 640 logical at 3× = 1080 × 1920, Google Play's phone format.
  _Device(
    out: 'android/fastlane/metadata/android/fr-FR/images/phoneScreenshots',
    prefix: '',
    physicalSize: Size(1080, 1920),
    pixelRatio: 3,
    screen: Size(390, 844),
    topInset: 24,
  ),
  // 440 × 956 logical at 3× = 1320 × 2868, the App Store's iPhone 6.9"
  // format (Apple scales it down for the smaller iPhones).
  _Device(
    out: _ios,
    prefix: 'iphone_',
    physicalSize: Size(1320, 2868),
    pixelRatio: 3,
    screen: Size(390, 844),
    topInset: 47,
  ),
  // 1032 × 1376 logical at 2× = 2064 × 2752, the App Store's iPad 13"
  // format: the screens at their real iPad size.
  _Device(
    out: _ios,
    prefix: 'ipad_',
    physicalSize: Size(2064, 2752),
    pixelRatio: 2,
    screen: Size(1032, 1376),
    topInset: 24,
    scale: 1.8,
  ),
];

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
  Future<DriveListing> getFolderContents(String folderId) async =>
      const DriveListing(
        items: [
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
        ],
      );
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
/// the real screen in a device-shaped window at the device's true size,
/// scaled down.
class _Frame extends StatelessWidget {
  const _Frame({
    required this.caption,
    required this.device,
    required this.child,
  });
  final String caption;
  final _Device device;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final k = device.scale;
    final screen = device.screen;
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
            SizedBox(height: 44 * k),
            Text(
              caption,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'Caption',
                fontWeight: FontWeight.w800,
                fontSize: 27 * k,
                height: 1.2,
                color: Colors.white,
              ),
            ),
            SizedBox(height: 28 * k),
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 34 * k),
                child: Align(
                  alignment: Alignment.topCenter,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30 * k),
                      border: Border.all(
                        color: const Color(0xFF2A3B3E),
                        width: 6 * k,
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
                      borderRadius: BorderRadius.circular(24 * k),
                      child: FittedBox(
                        fit: BoxFit.fitWidth,
                        alignment: Alignment.topCenter,
                        child: SizedBox.fromSize(
                          size: screen,
                          child: MediaQuery(
                            data: MediaQuery.of(context).copyWith(
                              size: screen,
                              padding: EdgeInsets.only(top: device.topInset),
                              viewPadding: EdgeInsets.only(
                                top: device.topInset,
                              ),
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

final _shotKey = GlobalKey();

/// A PNG of [rgba] without its alpha channel (the frame is opaque).
Uint8List _rgbPng(int width, int height, ByteData rgba) {
  final pixels = rgba.buffer.asUint8List(
    rgba.offsetInBytes,
    rgba.lengthInBytes,
  );
  final raw = BytesBuilder();
  for (var y = 0; y < height; y++) {
    raw.addByte(0); // no filter
    for (var x = 0; x < width; x++) {
      final i = (y * width + x) * 4;
      raw.add([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }
  final out = BytesBuilder();
  void chunk(String type, List<int> data) {
    final body = [...type.codeUnits, ...data];
    out
      ..add((ByteData(4)..setUint32(0, data.length)).buffer.asUint8List())
      ..add(body)
      ..add((ByteData(4)..setUint32(0, _crc32(body))).buffer.asUint8List());
  }

  out.add([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  final header = ByteData(13)
    ..setUint32(0, width)
    ..setUint32(4, height)
    ..setUint8(8, 8) // 8 bits per channel
    ..setUint8(9, 2); // RGB
  chunk('IHDR', header.buffer.asUint8List());
  chunk('IDAT', ZLibEncoder(level: 9).convert(raw.takeBytes()));
  chunk('IEND', const []);
  return out.takeBytes();
}

int _crc32(List<int> bytes) {
  var crc = 0xFFFFFFFF;
  for (final b in bytes) {
    crc ^= b;
    for (var k = 0; k < 8; k++) {
      crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320 : crc >> 1;
    }
  }
  return crc ^ 0xFFFFFFFF;
}

void main() {
  setUpAll(() async {
    _mockPlugins();
    await _loadFonts();
  });

  for (final device in _devices) {
    for (final shot in _shots) {
      testWidgets('${device.prefix}${shot.file}', (tester) async {
        GoogleFonts.config.allowRuntimeFetching = false;
        tester.view.physicalSize = device.physicalSize;
        tester.view.devicePixelRatio = device.pixelRatio;
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
                homeRehearsals: AsyncData(_rehearsals),
                homeConcerts: AsyncData(_concerts),
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
              home: RepaintBoundary(
                key: _shotKey,
                child: _Frame(
                  caption: shot.caption,
                  device: device,
                  child: shot.screen,
                ),
              ),
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

        // At the device's pixel ratio (a golden file would be at 1×), in
        // RGB: the App Store wants the exact pixel size and no alpha.
        final boundary = tester.renderObject<RenderRepaintBoundary>(
          find.byKey(_shotKey),
        );
        await tester.runAsync(() async {
          final image = await boundary.toImage(pixelRatio: device.pixelRatio);
          final rgba = await image.toByteData();
          File('${device.out}/${device.prefix}${shot.file}.png')
            ..parent.createSync(recursive: true)
            ..writeAsBytesSync(_rgbPng(image.width, image.height, rgba!));
          image.dispose();
        });
        // Let the screens' own timers (entrance animations) run out.
        await tester.pumpWidget(const SizedBox());
        await tester.pump(const Duration(seconds: 5));
      });
    }
  }
}
