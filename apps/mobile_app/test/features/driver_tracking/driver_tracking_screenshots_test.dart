import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/delivery.dart';
import 'package:lebontemperament/data/models/delivery_recipient.dart';
import 'package:lebontemperament/data/services/delivery_service.dart';
import 'package:lebontemperament/features/driver_tracking/presentation/providers/driver_tracking_provider.dart';
import 'package:lebontemperament/features/driver_tracking/presentation/screens/driver_tracking_screen.dart';
import 'package:lebontemperament/features/home/presentation/screens/home_screen.dart';

import '../../helpers/screen_harness.dart';

/// A round answered from memory: obviously fake stops, no network.
class FakeRoundService extends DeliveryService {
  FakeRoundService(
    this.delivery,
    this.recipients, {
    this.saleTitles = const [],
  });

  final Delivery delivery;
  final List<DeliveryRecipient> recipients;
  final List<String> saleTitles;

  @override
  Future<Delivery?> getOrCreateDelivery() async => delivery;

  @override
  Future<List<DeliveryRecipient>> getRecipients(String deliveryId) async =>
      recipients;

  @override
  Future<List<String>> getSaleTitles(List<String> recipientIds) async =>
      saleTitles;
}

/// A stop with an address, a position and a number from the range kept
/// for fiction (06 39 98 xx xx).
DeliveryRecipient fakeStop(String id, String label, {DateTime? deliveredAt}) =>
    DeliveryRecipient(
      id: id,
      deliveryId: 'delivery-test',
      label: label,
      sortOrder: int.parse(id),
      address: '$id rue de l’Exemple, 99999 Testville',
      latitude: 47.0,
      longitude: 6.0,
      phoneNumber: '06 39 98 00 0$id',
      deliveredAt: deliveredAt,
    );

/// Renders « Mode livraison » on fake rounds to PNG files, for the review of
/// a visual change (quality gates: a small and a large phone, dark and
/// light). Runs only when DRIVER_SCREENSHOT_DIR names the folder to write
/// into:
///
///   DRIVER_SCREENSHOT_DIR=/tmp/shots flutter test \
///     test/features/driver_tracking/driver_tracking_screenshots_test.dart
///
/// Never commit the PNGs.
void main() {
  final dir = Platform.environment['DRIVER_SCREENSHOT_DIR'];
  const phones = {'small': Size(375, 667), 'large': Size(430, 932)};
  const themes = {'dark': Brightness.dark, 'light': Brightness.light};

  // The test font draws every icon as a box: load Material Icons from the
  // Flutter SDK the test runs with.
  setUpAll(() async {
    if (dir == null) return;
    final root = Platform.environment['FLUTTER_ROOT'];
    if (root == null) return;
    final file = File(
      '$root/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    );
    if (!file.existsSync()) return;
    final bytes = file.readAsBytesSync();
    final loader = FontLoader('MaterialIcons')
      ..addFont(Future.value(ByteData.view(bytes.buffer)));
    await loader.load();
  });

  // Tonight's round: buyers from a sale, a créneau, one stop delivered.
  final saleRound = Delivery(
    id: 'delivery-test',
    driverId: 'driver-test',
    publicToken: 'token-test',
    isTrackingActive: false,
    expiresAt: DateTime.utc(2099, 11, 15),
    createdAt: DateTime.utc(2099, 11, 10, 9),
    scheduledAt: DateTime.utc(2099, 11, 14, 17),
    scheduledEndAt: DateTime.utc(2099, 11, 14, 19),
  );
  final saleStops = [
    fakeStop('1', 'Famille Test', deliveredAt: DateTime.utc(2099, 11, 14, 17)),
    fakeStop('2', 'Anne Exemple'),
    fakeStop('3', 'Bob Exemple'),
    fakeStop('4', 'Claire Exemple'),
  ];

  // An earlier round left open: stops typed by hand, eight months ago.
  final now = DateTime.now();
  final oldRound = Delivery(
    id: 'delivery-test',
    driverId: 'driver-test',
    publicToken: 'token-test',
    isTrackingActive: false,
    expiresAt: now.add(const Duration(hours: 24)).toUtc(),
    createdAt: now.subtract(const Duration(days: 241)).toUtc(),
  );
  final oldStops = [
    fakeStop('1', 'Famille Test', deliveredAt: oldRound.createdAt),
    fakeStop('2', 'Anne Exemple', deliveredAt: oldRound.createdAt),
    fakeStop('3', 'Bob Exemple'),
  ];

  final emptyRound = Delivery(
    id: 'delivery-test',
    driverId: 'driver-test',
    publicToken: 'token-test',
    isTrackingActive: false,
    expiresAt: now.add(const Duration(hours: 24)).toUtc(),
    createdAt: now.toUtc(),
  );

  Future<void> shoot(
    WidgetTester tester,
    Widget screen,
    String name,
    Size size,
    Brightness brightness, {
    DeliveryService? service,
    String? roundLine,
    Future<void> Function(WidgetTester)? then,
  }) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    tester.view.physicalSize = size * 2;
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.reset);
    final key = GlobalKey();
    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: ProviderScope(
          overrides: [
            ...offlineOverrides(superadmin: true, deliveryRoundLine: roundLine),
            if (service != null)
              deliveryServiceProvider.overrideWithValue(service),
          ],
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: brightness == Brightness.dark
                ? AppTheme.darkTheme
                : AppTheme.lightTheme,
            locale: const Locale('fr', 'FR'),
            supportedLocales: const [Locale('fr', 'FR'), Locale('en', 'US')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: screen,
          ),
        ),
      ),
    );
    // The status dot pulses forever, so pumpAndSettle would never return:
    // pump past the entrance animations instead.
    Future<void> settle() async {
      for (var i = 0; i < 20; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }
    }

    // The bundled fonts load asynchronously; wait for them so the text
    // renders in the app's faces rather than the test font.
    await tester.runAsync(() => GoogleFonts.pendingFonts());
    await settle();
    if (then != null) await then(tester);
    await tester.runAsync(() => GoogleFonts.pendingFonts());
    await settle();

    await tester.runAsync(() async {
      final boundary =
          key.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 2);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      File('$dir/$name.png').writeAsBytesSync(bytes!.buffer.asUint8List());
    });
  }

  for (final phone in phones.entries) {
    for (final theme in themes.entries) {
      final suffix = '${phone.key}-${theme.key}';

      testWidgets('round from a sale $suffix', (tester) async {
        await shoot(
          tester,
          const DriverTrackingScreen(),
          'tournee-vente-$suffix',
          phone.value,
          theme.value,
          service: FakeRoundService(
            saleRound,
            saleStops,
            saleTitles: const ['Vente de fromages de test'],
          ),
        );
      }, skip: dir == null);

      testWidgets('old round $suffix', (tester) async {
        await shoot(
          tester,
          const DriverTrackingScreen(),
          'tournee-ancienne-$suffix',
          phone.value,
          theme.value,
          service: FakeRoundService(oldRound, oldStops),
        );
      }, skip: dir == null);

      testWidgets('empty round $suffix', (tester) async {
        await shoot(
          tester,
          const DriverTrackingScreen(),
          'tournee-vide-$suffix',
          phone.value,
          theme.value,
          service: FakeRoundService(emptyRound, const []),
        );
      }, skip: dir == null);

      testWidgets('new round dialog $suffix', (tester) async {
        await shoot(
          tester,
          const DriverTrackingScreen(),
          'nouvelle-tournee-$suffix',
          phone.value,
          theme.value,
          service: FakeRoundService(
            saleRound,
            saleStops,
            saleTitles: const ['Vente de fromages de test'],
          ),
          then: (t) async {
            await t.tap(find.text('Nouvelle tournée'));
          },
        );
      }, skip: dir == null);

      testWidgets('home card $suffix', (tester) async {
        await shoot(
          tester,
          const HomeScreen(),
          'accueil-$suffix',
          phone.value,
          theme.value,
          roundLine: 'Vente de fromages de test · 4 destinataires · 1 livré',
          then: (t) async {
            await t.scrollUntilVisible(
              find.text('Mode livraison'),
              300,
              scrollable: find.byType(Scrollable).first,
            );
          },
        );
      }, skip: dir == null);
    }
  }
}
