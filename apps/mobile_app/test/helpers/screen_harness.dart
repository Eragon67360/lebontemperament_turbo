import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:logger/logger.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/drive_file.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/connectivity_provider.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/data/providers/feature_flags_provider.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:lebontemperament/data/services/feature_flags_service.dart';
import 'package:lebontemperament/features/auth/presentation/providers/auth_provider.dart';
import 'package:lebontemperament/features/auth/presentation/providers/profile_role_provider.dart';
import 'package:lebontemperament/features/profile/presentation/screens/about_screen.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Fixtures: obviously fake values only (no real member, place or ID).
const kTestConcert = Concert(
  id: 'concert-test-0001',
  place: 'Salle des fêtes de Testville',
  date: '2099-06-21',
  time: '20:30:00',
  context: Context.orchestreEtChoeur,
  name: 'Concert de test de fin de saison',
);

const kTestRehearsal = Rehearsal(
  id: 'rehearsal-test-0001',
  name: 'Répétition de test',
  place: 'Salle polyvalente de Testville',
  date: '2099-05-30',
  startTime: '19:30:00',
  endTime: '22:00:00',
  groupType: GroupType.jeunesEnfants,
);

const kTestEvent = Event(
  id: 'event-test-0001',
  title: 'Vente de gâteaux de test',
  dateFrom: '2099-04-12',
  time: '14:00:00',
  location: 'Place du marché de Testville',
  eventType: EventType.vente,
  description:
      'Description de test, assez longue pour occuper deux lignes '
      'sur un petit téléphone.',
);

final kTestCatalog = DriveFolderCatalog(
  tabs: const [
    DriveFolder(slug: 'adultes', label: 'Adultes', folderId: 'folder-test-a'),
    DriveFolder(slug: 'jeunes', label: 'Jeunes', folderId: 'folder-test-j'),
    DriveFolder(
      slug: 'cahier-30-ans',
      label: 'Cahier 30 ans',
      folderId: 'folder-test-c',
    ),
  ],
  root: const DriveFolder(
    slug: kDriveRootSlug,
    label: 'Drive complet',
    folderId: 'folder-test-root',
  ),
  fromFallback: false,
);

/// Answers from memory: the tests never reach the network.
class FakeDriveService extends DriveService {
  FakeDriveService() : super(accessToken: () => 'test-token');

  @override
  Future<List<DriveFile>> getFolderContents(String folderId) async => const [
    DriveFile(
      id: 'file-test-folder',
      name: 'Sous-dossier de test',
      type: 'folder',
      mimeType: 'application/vnd.google-apps.folder',
    ),
    DriveFile(
      id: 'file-test-pdf',
      name: 'Partition de test.pdf',
      type: 'file',
      mimeType: 'application/pdf',
    ),
    DriveFile(
      id: 'file-test-mp3',
      name: 'Enregistrement de test.mp3',
      type: 'file',
      mimeType: 'audio/mpeg',
    ),
  ];

  @override
  Future<List<int>> downloadFile(String fileId) async => const [0];
}

/// A flags service answering from memory (the default: no flag set).
FeatureFlagsService fakeFlagsService([
  List<Map<String, dynamic>> rows = const [],
]) => FeatureFlagsService(
  fetchRows: () async => rows,
  logger: Logger(level: Level.off),
);

/// Provider overrides that keep every screen offline: no Supabase, no Hive,
/// no Drive API, no Firebase. The lists, the flags and the network state are
/// parameters because Riverpod refuses a second override of the same provider.
List<Override> offlineOverrides({
  bool superadmin = false,
  ListResult<Rehearsal> rehearsals = const ListResult.fresh([kTestRehearsal]),
  ListResult<Concert> concerts = const ListResult.fresh([kTestConcert]),
  ListResult<Event> events = const ListResult.fresh([kTestEvent]),
  FeatureFlagsService? flagsService,
  bool online = true,
  String displayName = 'Membre Test',
  List<Rehearsal> homeRehearsals = const [kTestRehearsal],
  List<Concert> homeConcerts = const [kTestConcert],
  DriveService? drive,
  DriveFolderCatalog? catalog,
}) => [
  authStateProvider.overrideWith((ref) => const Stream<AuthState>.empty()),
  userProfileProvider.overrideWith((ref) async => null),
  isSuperadminProvider.overrideWith((ref) async => superadmin),
  displayNameProvider.overrideWithValue(displayName),
  profilePictureUrlProvider.overrideWithValue(null),
  homeUpcomingRehearsalsProvider.overrideWithValue(homeRehearsals),
  homeUpcomingConcertsProvider.overrideWithValue(homeConcerts),
  realtimeRehearsalsProvider.overrideWith((ref) async => rehearsals),
  upcomingRehearsalsProvider.overrideWith((ref) async => rehearsals),
  upcomingConcertsProvider.overrideWith((ref) async => concerts),
  upcomingEventsProvider.overrideWith((ref) async => events),
  featureFlagsServiceProvider.overrideWithValue(
    flagsService ?? fakeFlagsService(),
  ),
  isOnlineProvider.overrideWith((ref) => Stream.value(online)),
  caMinutesProvider.overrideWith((ref) async => const []),
  driveFolderCatalogProvider.overrideWith(
    (ref) async => catalog ?? kTestCatalog,
  ),
  driveServiceProvider.overrideWithValue(drive ?? FakeDriveService()),
  packageInfoProvider.overrideWith(
    (ref) async => PackageInfo(
      appName: 'Le Bon Tempérament',
      packageName: 'com.example.test',
      version: '0.0.0',
      buildNumber: '0',
    ),
  ),
];

/// Pumps [screen] inside the app theme at a phone size and text scale, and
/// lets the entrance animations finish.
Future<void> pumpScreen(
  WidgetTester tester,
  Widget screen, {
  double textScale = 1.0,
  Size size = const Size(390, 844),
  bool superadmin = false,
  ListResult<Rehearsal> rehearsals = const ListResult.fresh([kTestRehearsal]),
  ListResult<Concert> concerts = const ListResult.fresh([kTestConcert]),
  ListResult<Event> events = const ListResult.fresh([kTestEvent]),
  FeatureFlagsService? flagsService,
  bool online = true,
  List<Override> overrides = const [],
}) async {
  GoogleFonts.config.allowRuntimeFetching = false;
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        ...offlineOverrides(
          superadmin: superadmin,
          rehearsals: rehearsals,
          concerts: concerts,
          events: events,
          flagsService: flagsService,
          online: online,
        ),
        ...overrides,
      ],
      child: MaterialApp(
        theme: AppTheme.lightTheme,
        locale: const Locale('fr', 'FR'),
        supportedLocales: const [Locale('fr', 'FR'), Locale('en', 'US')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: TextScaler.linear(textScale)),
          child: child!,
        ),
        home: screen,
      ),
    ),
  );
  // FadeInUp delays go up to 700 ms, then a 600 ms animation.
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pump(const Duration(seconds: 2));
}
