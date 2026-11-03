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
import 'package:lebontemperament/data/models/member.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/features/orders/domain/orders_models.dart';
import 'package:lebontemperament/features/orders/presentation/providers/orders_providers.dart';
import 'package:lebontemperament/features/orders/presentation/screens/buyer_screen.dart';
import 'package:lebontemperament/features/orders/presentation/screens/order_editor_screen.dart';
import 'package:lebontemperament/features/orders/presentation/screens/sale_screen.dart';
import 'package:lebontemperament/features/orders/presentation/screens/sales_list_screen.dart';

import '../../helpers/fake_orders.dart';
import '../../helpers/screen_harness.dart';

/// Renders the « Commandes » screens on fake data to PNG files, for the
/// review of a visual change (quality gates: a small and a large phone,
/// dark and light). Runs only when ORDERS_SCREENSHOT_DIR names the folder
/// to write into:
///
///   ORDERS_SCREENSHOT_DIR=/tmp/shots flutter test \
///     test/features/orders/orders_screenshots_test.dart
///
/// Never commit the PNGs.
void main() {
  final dir = Platform.environment['ORDERS_SCREENSHOT_DIR'];
  const phones = {'small': Size(375, 667), 'large': Size(430, 932)};
  const themes = {'dark': Brightness.dark, 'light': Brightness.light};
  const members = [
    Member(id: 'member-anne', displayName: 'Anne Test', email: 'a@example.com'),
    Member(id: 'member-bob', displayName: 'Bob Test', email: 'b@example.com'),
  ];

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

  Future<void> shoot(
    WidgetTester tester,
    Widget screen,
    String name,
    Size size,
    Brightness brightness, {
    Future<void> Function(WidgetTester)? then,
    FakeOrdersService? service,
  }) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    tester.view.physicalSize = size * 2;
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.reset);
    final key = GlobalKey();
    final fake = service ?? FakeOrdersService();
    await tester.pumpWidget(
      RepaintBoundary(
        key: key,
        child: ProviderScope(
          overrides: [
            ...offlineOverrides(superadmin: true),
            ordersServiceProvider.overrideWithValue(fake),
            membersProvider.overrideWith((ref) async => members),
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
    // The bundled fonts load asynchronously; wait for them so the text
    // renders in the app's faces rather than the test font.
    await tester.runAsync(() => GoogleFonts.pendingFonts());
    await tester.pumpAndSettle();
    if (then != null) await then(tester);
    await tester.runAsync(() => GoogleFonts.pendingFonts());
    await tester.pumpAndSettle();

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

      testWidgets('sales $suffix', (tester) async {
        await shoot(
          tester,
          const OrdersScreen(),
          'sales-$suffix',
          phone.value,
          theme.value,
        );
      }, skip: dir == null);

      testWidgets('sale buyers $suffix', (tester) async {
        await shoot(
          tester,
          const SaleScreen(saleId: kTestSaleId),
          'sale-acheteurs-$suffix',
          phone.value,
          theme.value,
        );
      }, skip: dir == null);

      testWidgets('sale totals $suffix', (tester) async {
        await shoot(
          tester,
          const SaleScreen(saleId: kTestSaleId),
          'sale-totaux-$suffix',
          phone.value,
          theme.value,
          then: (t) async {
            await t.tap(find.text('Totaux'));
            await t.pumpAndSettle();
          },
        );
      }, skip: dir == null);

      testWidgets('buyer $suffix', (tester) async {
        await shoot(
          tester,
          const BuyerScreen(saleId: kTestSaleId, orderId: 'o-marie'),
          'acheteur-$suffix',
          phone.value,
          theme.value,
        );
      }, skip: dir == null);

      testWidgets('payment sheet $suffix', (tester) async {
        await shoot(
          tester,
          const BuyerScreen(saleId: kTestSaleId, orderId: 'o-marie'),
          'paiement-$suffix',
          phone.value,
          theme.value,
          then: (t) async {
            // Below the fold on a small phone, in a lazily built sliver.
            final button = find.text('Enregistrer un paiement');
            await t.scrollUntilVisible(
              button,
              200,
              scrollable: find.byType(Scrollable).first,
            );
            await t.pumpAndSettle();
            await t.tap(button);
            await t.pumpAndSettle();
          },
        );
      }, skip: dir == null);

      testWidgets('round picker $suffix', (tester) async {
        await shoot(
          tester,
          const SaleScreen(saleId: kTestSaleId),
          'tournee-choix-$suffix',
          phone.value,
          theme.value,
          service: FakeOrdersService(
            detail: testDetail(
              orders: [
                ...kTestOrders,
                for (final (i, name) in const [
                  'Paul Test',
                  'Lucie Test',
                  'Hugo Test',
                ].indexed)
                  OrderRecord(
                    id: 'o-extra-$i',
                    saleId: kTestSaleId,
                    buyerName: name,
                    buyerAddress: '${i + 3} rue du Test, 25000 Testville',
                    fulfilment: 'delivery',
                    items: const [],
                  ),
              ],
            ),
          ),
          then: (t) async {
            await t.tap(find.byTooltip('Ajouter à la tournée'));
            await t.pumpAndSettle();
            final paul = find.widgetWithText(CheckboxListTile, 'Paul Test');
            await t.ensureVisible(paul);
            await t.pumpAndSettle();
            await t.tap(paul);
            await t.pumpAndSettle();
          },
        );
      }, skip: dir == null);

      testWidgets('editor $suffix', (tester) async {
        await shoot(
          tester,
          OrderEditorScreen(
            detail: testDetail(),
            existing: kMarie,
            soldByName: 'Anne Test',
          ),
          'commande-$suffix',
          phone.value,
          theme.value,
        );
      }, skip: dir == null);
    }
  }
}
