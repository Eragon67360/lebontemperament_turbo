import 'package:flutter/material.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/member.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/features/orders/domain/order_totals.dart';
import 'package:lebontemperament/features/orders/domain/orders_models.dart';
import 'package:lebontemperament/features/orders/presentation/providers/orders_providers.dart';
import 'package:lebontemperament/features/orders/presentation/screens/buyer_screen.dart';
import 'package:lebontemperament/features/orders/presentation/screens/order_editor_screen.dart';
import 'package:lebontemperament/features/orders/presentation/screens/payment_sheet.dart';
import 'package:lebontemperament/features/orders/presentation/screens/sale_screen.dart';
import 'package:lebontemperament/features/orders/presentation/screens/sales_list_screen.dart';

import '../../helpers/fake_orders.dart';
import '../../helpers/screen_harness.dart';

/// « Commandes » in the app: the sales, one sale with its buyers and totals,
/// one buyer with their payments, the editor and the payment sheet, all on
/// fake data, superadmins only.
void main() {
  const members = [
    Member(id: 'member-anne', displayName: 'Anne Test', email: 'a@example.com'),
    Member(id: 'member-bob', displayName: 'Bob Test', email: 'b@example.com'),
  ];

  List<Override> overrides(FakeOrdersService fake) => [
    ordersServiceProvider.overrideWithValue(fake),
    membersProvider.overrideWith((ref) async => members),
  ];

  Future<void> pump(
    WidgetTester tester,
    Widget screen,
    FakeOrdersService fake, {
    bool superadmin = true,
  }) async {
    await pumpScreen(
      tester,
      screen,
      superadmin: superadmin,
      overrides: overrides(fake),
    );
    await tester.pumpAndSettle();
  }

  /// Taps [finder] after scrolling it into view.
  Future<void> tapVisible(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  group('access', () {
    testWidgets('a member who is not superadmin is told so', (tester) async {
      await pump(
        tester,
        const OrdersScreen(),
        FakeOrdersService(),
        superadmin: false,
      );
      expect(find.text('Accès non autorisé'), findsOneWidget);
      expect(find.text('Commandes'), findsNothing);

      await pump(
        tester,
        const SaleScreen(saleId: kTestSaleId),
        FakeOrdersService(),
        superadmin: false,
      );
      expect(find.text('Accès non autorisé'), findsOneWidget);
    });
  });

  group('the sales', () {
    testWidgets('lists the sales, the current one first, with what is owed', (
      tester,
    ) async {
      await pump(tester, const OrdersScreen(), FakeOrdersService());
      expect(find.text('Commandes'), findsOneWidget);
      expect(
        find.text('Fromages et saucissons · novembre 2026'),
        findsOneWidget,
      );
      expect(find.text('Commandes jusqu’au ven. 13 nov.'), findsOneWidget);
      expect(find.text('Livraison le ven. 27 nov.'), findsOneWidget);
      expect(find.text('3 commandes'), findsOneWidget);
      expect(
        find.text('Reste à encaisser ${formatEuros(2950)}'),
        findsOneWidget,
      );
      expect(find.text('Archivée'), findsOneWidget);
      expect(find.text('41 commandes'), findsOneWidget);
      expect(find.text('Tout est encaissé'), findsOneWidget);
      final current = tester.getTopLeft(
        find.text('Fromages et saucissons · novembre 2026'),
      );
      final archived = tester.getTopLeft(find.text('Fromages · novembre 2025'));
      expect(current.dy, lessThan(archived.dy));
    });

    testWidgets('empty and error states', (tester) async {
      await pump(tester, const OrdersScreen(), FakeOrdersService(sales: []));
      expect(find.text('Aucune vente'), findsOneWidget);

      await pump(
        tester,
        const OrdersScreen(),
        FakeOrdersService(failing: true),
      );
      expect(find.text('Impossible de charger les ventes'), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
    });
  });

  group('a sale', () {
    testWidgets('figures, buyers, filters and search', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, const SaleScreen(saleId: kTestSaleId), fake);

      expect(find.text('Total commandé'), findsOneWidget);
      expect(find.text(formatEuros(6650)), findsOneWidget);
      expect(find.text('Encaissé'), findsOneWidget);
      expect(find.text(formatEuros(4000)), findsOneWidget);
      expect(find.text('Reste à encaisser'), findsOneWidget);
      expect(find.text(formatEuros(2950)), findsOneWidget);
      expect(find.text('2 acheteurs'), findsOneWidget);
      expect(find.text('Acheteurs (3)'), findsOneWidget);
      expect(find.text('Ajouter une commande'), findsOneWidget);

      // Alphabetical, with the mode, the total and what is left.
      final eric = tester.getTopLeft(find.text('Éric Test'));
      final marie = tester.getTopLeft(find.text('Marie Test'));
      final zoe = tester.getTopLeft(find.text('zoé Test'));
      expect(eric.dy, lessThan(marie.dy));
      expect(marie.dy, lessThan(zoe.dy));
      expect(find.text('Reste ${formatEuros(1750)}'), findsOneWidget);
      expect(find.text('Reste ${formatEuros(1200)}'), findsOneWidget);
      expect(find.text('Trop perçu'), findsOneWidget);
      expect(find.text('Retrait'), findsNWidgets(2)); // zoé's pill, the chip
      expect(find.text('Remis'), findsOneWidget);
      expect(find.text('Dans la tournée'), findsOneWidget);

      await tester.tap(find.widgetWithText(ChoiceChip, 'À régler'));
      await tester.pumpAndSettle();
      expect(find.text('zoé Test'), findsNothing);
      expect(find.text('Marie Test'), findsOneWidget);

      await tester.tap(find.widgetWithText(ChoiceChip, 'Payés'));
      await tester.pumpAndSettle();
      expect(find.text('zoé Test'), findsOneWidget);
      expect(find.text('Marie Test'), findsNothing);

      await tester.tap(find.widgetWithText(ChoiceChip, 'Tous'));
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField).first, 'eric');
      await tester.pumpAndSettle();
      expect(find.text('Éric Test'), findsOneWidget);
      expect(find.text('Marie Test'), findsNothing);

      await tester.enterText(find.byType(TextField).first, 'personne');
      await tester.pumpAndSettle();
      expect(find.text('Aucun acheteur ne correspond'), findsOneWidget);
    });

    testWidgets('totals per supplier and per product', (tester) async {
      await pump(
        tester,
        const SaleScreen(saleId: kTestSaleId),
        FakeOrdersService(),
      );
      await tester.tap(find.text('Totaux'));
      await tester.pumpAndSettle();

      expect(find.text('Fruitière'), findsOneWidget);
      expect(find.text(formatEuros(4250)), findsOneWidget);
      expect(find.text('Salaison'), findsOneWidget);
      expect(find.text('Sans fournisseur'), findsOneWidget);
      expect(find.text('Saucisson · Noix'), findsOneWidget);
      expect(find.text('× 4'), findsOneWidget);
      expect(find.text('× 2'), findsNWidgets(2)); // raclette, figues
      expect(find.text('Virement'), findsOneWidget);
      expect(find.text(formatEuros(1500)), findsOneWidget);
    });

    testWidgets('an empty sale invites the first order', (tester) async {
      await pump(
        tester,
        const SaleScreen(saleId: kTestSaleId),
        FakeOrdersService(detail: testDetail(orders: [])),
      );
      expect(find.text('Aucune commande'), findsOneWidget);
      expect(find.text('0 acheteur'), findsOneWidget);
    });

    testWidgets('« Ajouter à la tournée » asks, then reports', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, const SaleScreen(saleId: kTestSaleId), fake);

      await tester.tap(find.byTooltip('Ajouter à la tournée'));
      await tester.pumpAndSettle();
      // Marie: to deliver, with an address, not in a round yet. Éric is
      // already a stop; zoé collects.
      expect(find.text('Ajouter 1 acheteur'), findsOneWidget);
      await tester.tap(find.text('Ajouter 1 acheteur'));
      await tester.pumpAndSettle();

      expect(fake.roundCalls, [kTestSaleId]);
      expect(find.text('Tournée mise à jour'), findsOneWidget);
      expect(find.text('2 ajoutés · 1 sans adresse'), findsOneWidget);
      expect(find.text('Ouvrir la tournée'), findsOneWidget);
    });

    testWidgets('« Ajouter à la tournée » takes only the ticked buyers', (
      tester,
    ) async {
      final paul = OrderRecord(
        id: 'o-paul',
        saleId: kTestSaleId,
        buyerName: 'Paul Test',
        buyerAddress: '3 rue du Test, 25000 Testville',
        fulfilment: 'delivery',
        items: [OrderItem(productId: productId(1), quantity: 1)],
      );
      final fake = FakeOrdersService(
        detail: testDetail(orders: [kMarie, kZoe, kEric, paul]),
      );
      await pump(tester, const SaleScreen(saleId: kTestSaleId), fake);

      await tester.tap(find.byTooltip('Ajouter à la tournée'));
      await tester.pumpAndSettle();
      // Both waiting buyers are listed and ticked, with their address.
      expect(find.text('2 sur 2'), findsOneWidget);
      expect(find.text('3 rue du Test, 25000 Testville'), findsOneWidget);
      expect(find.text('Ajouter 2 acheteurs'), findsOneWidget);

      await tester.tap(find.widgetWithText(CheckboxListTile, 'Paul Test'));
      await tester.pumpAndSettle();
      expect(find.text('1 sur 2'), findsOneWidget);
      await tester.tap(find.text('Ajouter 1 acheteur'));
      await tester.pumpAndSettle();

      expect(fake.roundCalls, isEmpty);
      expect(fake.chosenRoundCalls.single.$1, kTestSaleId);
      expect(fake.chosenRoundCalls.single.$2, ['o-marie']);
      expect(find.text('Tournée mise à jour'), findsOneWidget);
    });

    testWidgets('« Tous » unticked: nothing can be sent', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, const SaleScreen(saleId: kTestSaleId), fake);
      await tester.tap(find.byTooltip('Ajouter à la tournée'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(CheckboxListTile, 'Tous'));
      await tester.pumpAndSettle();
      expect(find.text('0 sur 1'), findsOneWidget);
      await tester.tap(find.text('Cochez au moins un acheteur'));
      await tester.pumpAndSettle();
      expect(fake.roundCalls, isEmpty);
      expect(fake.chosenRoundCalls, isEmpty);
    });

    testWidgets('nothing to add: a word, no call', (tester) async {
      final fake = FakeOrdersService(detail: testDetail(orders: [kZoe, kEric]));
      await pump(tester, const SaleScreen(saleId: kTestSaleId), fake);
      await tester.tap(find.byTooltip('Ajouter à la tournée'));
      await tester.pumpAndSettle();
      expect(fake.roundCalls, isEmpty);
      expect(
        find.text('Tous les acheteurs à livrer sont déjà dans la tournée.'),
        findsOneWidget,
      );
    });

    testWidgets('error state with a retry', (tester) async {
      await pump(
        tester,
        const SaleScreen(saleId: kTestSaleId),
        FakeOrdersService(failing: true),
      );
      expect(find.text('Impossible de charger la vente'), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
    });
  });

  test('filterBuyers', () {
    final buyers = saleSummary(kTestProducts, kTestOrders).buyers;
    List<String> names(BuyerFilter f, [String q = '']) => [
      for (final b in filterBuyers(buyers, f, q)) b.buyerName,
    ];
    expect(names(BuyerFilter.all), ['Éric Test', 'Marie Test', 'zoé Test']);
    expect(names(BuyerFilter.owing), ['Éric Test', 'Marie Test']);
    expect(names(BuyerFilter.paid), ['zoé Test']);
    expect(names(BuyerFilter.pickup), ['zoé Test']);
    expect(names(BuyerFilter.all, 'ERIC'), ['Éric Test']);
    expect(names(BuyerFilter.all, 'zoe'), ['zoé Test']);
  });

  group('a buyer', () {
    const screen = BuyerScreen(saleId: kTestSaleId, orderId: 'o-marie');

    testWidgets('breakdown, payments and details', (tester) async {
      await pump(tester, screen, FakeOrdersService());
      expect(find.text('Marie Test'), findsOneWidget);
      expect(find.text('Livraison'), findsOneWidget);
      expect(find.text('Paiement partiel'), findsOneWidget);
      expect(find.text('Vendu par Anne Test'), findsOneWidget);
      expect(find.text('Passer après 18 h'), findsOneWidget);
      expect(find.text('Bleu de Gex · 500 g'), findsOneWidget);
      expect(find.text('1 × ${formatEuros(850)}'), findsOneWidget);
      expect(find.text('2 × ${formatEuros(1700)}'), findsOneWidget);
      expect(find.text(formatEuros(4250)), findsOneWidget);
      expect(find.text('Reste à payer'), findsOneWidget);
      expect(find.text(formatEuros(1750)), findsOneWidget);
      expect(find.text('Chèque · dim. 25 oct.'), findsOneWidget);
      expect(find.text('Espèces · mer. 21 oct.'), findsOneWidget);
      expect(find.text('Chèque n° 12'), findsOneWidget);
    });

    testWidgets('« Ajouter à la tournée » adds this buyer alone', (
      tester,
    ) async {
      final fake = FakeOrdersService(
        deliveryResult: const DeliveryAddResult(
          deliveryId: 'delivery-test',
          added: 1,
          withoutAddress: 0,
        ),
      );
      await pump(tester, screen, fake);
      await tester.tap(find.byTooltip('Plus d’actions'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ajouter à la tournée'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Ajouter Marie Test'));
      await tester.pumpAndSettle();

      expect(fake.roundCalls, isEmpty);
      expect(fake.chosenRoundCalls.single.$1, kTestSaleId);
      expect(fake.chosenRoundCalls.single.$2, ['o-marie']);
      expect(find.text('Ajouté à la tournée'), findsOneWidget);
    });

    testWidgets('a buyer already in a round is not offered the round', (
      tester,
    ) async {
      await pump(
        tester,
        const BuyerScreen(saleId: kTestSaleId, orderId: 'o-eric'),
        FakeOrdersService(),
      );
      await tester.tap(find.byTooltip('Plus d’actions'));
      await tester.pumpAndSettle();
      expect(find.text('Modifier'), findsOneWidget);
      expect(find.text('Ajouter à la tournée'), findsNothing);
    });

    testWidgets('records a payment prefilled with what is left', (
      tester,
    ) async {
      final fake = FakeOrdersService();
      await pump(tester, screen, fake);
      await tapVisible(tester, find.text('Enregistrer un paiement'));

      expect(find.text('Reste à payer : ${formatEuros(1750)}'), findsOneWidget);
      final amount = tester.widget<TextField>(
        find
            .descendant(
              of: find.byType(PaymentSheet),
              matching: find.byType(TextField),
            )
            .first,
      );
      expect(amount.controller!.text, '17,50');

      // No method yet: the sheet says so and sends nothing.
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(find.text('Choisissez un moyen de paiement'), findsOneWidget);
      expect(fake.payments, isEmpty);

      await tester.tap(find.widgetWithText(ChoiceChip, 'Chèque'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();

      expect(fake.payments.single['amount_cents'], 1750);
      expect(fake.payments.single['method'], 'cheque');
      expect(fake.payments.single['order_id'], 'o-marie');
      expect(find.text('Paiement enregistré'), findsOneWidget);
      // The screen shows the new balance.
      expect(find.text('Payé'), findsWidgets);
      expect(find.text('Paiement partiel'), findsNothing);
    });

    testWidgets('deletes a payment after asking', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, screen, fake);
      await tapVisible(tester, find.byTooltip('Supprimer ce paiement').first);
      expect(find.text('Supprimer ce paiement ?'), findsOneWidget);
      await tester.tap(find.text('Annuler'));
      await tester.pumpAndSettle();
      expect(fake.deletedPayments, isEmpty);

      await tapVisible(tester, find.byTooltip('Supprimer ce paiement').first);
      await tester.tap(find.widgetWithText(FilledButton, 'Supprimer'));
      await tester.pumpAndSettle();
      expect(fake.deletedPayments, ['p-2']);
    });

    testWidgets('« Marquer comme remis »', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, screen, fake);
      await tapVisible(tester, find.text('Marquer comme remis'));
      expect(fake.handedOver, [('o-marie', true)]);
    });

    testWidgets('deletes the order after asking', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, screen, fake);
      await tester.tap(find.byTooltip('Plus d’actions'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Supprimer'));
      await tester.pumpAndSettle();
      expect(find.text('Supprimer la commande ?'), findsOneWidget);
      await tester.tap(find.text('Supprimer la commande'));
      await tester.pumpAndSettle();
      expect(fake.deletedOrders, ['o-marie']);
    });

    testWidgets('a deleted order', (tester) async {
      await pump(
        tester,
        const BuyerScreen(saleId: kTestSaleId, orderId: 'o-gone'),
        FakeOrdersService(),
      );
      expect(find.text('Commande introuvable'), findsOneWidget);
    });
  });

  group('the editor', () {
    testWidgets('refuses what the admin refuses, then saves', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, OrderEditorScreen(detail: fake.detail), fake);
      expect(find.text('Nouvelle commande'), findsOneWidget);
      expect(find.text('FROMAGES'), findsOneWidget);
      expect(find.text('SAUCISSONS'), findsOneWidget);
      expect(find.text(formatEuros(0)), findsOneWidget);

      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(find.text("Le nom de l'acheteur est obligatoire"), findsOneWidget);
      expect(fake.savedOrders, isEmpty);

      await tester.enterText(
        find.widgetWithText(TextField, 'Nom de l’acheteur *'),
        'Paul TEST',
      );
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(find.text('Ajoutez au moins un produit'), findsOneWidget);

      await tester.tap(find.byTooltip('Plus de Raclette · 1 kg'));
      await tester.pumpAndSettle();
      expect(find.text(formatEuros(1700)), findsNWidgets(2)); // price, total
      await tester.tap(find.byTooltip('Plus de Raclette · 1 kg'));
      await tester.pumpAndSettle();
      expect(find.text(formatEuros(3400)), findsOneWidget);
      await tester.tap(find.byTooltip('Moins de Raclette · 1 kg'));
      await tester.pumpAndSettle();
      expect(find.text(formatEuros(1700)), findsNWidgets(2));

      await tester.enterText(find.widgetWithText(TextField, 'Téléphone'), '12');
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(
        find.text("Ce numéro de téléphone n'est pas valide"),
        findsOneWidget,
      );
      expect(fake.savedOrders, isEmpty);

      await tester.enterText(
        find.widgetWithText(TextField, 'Téléphone'),
        '06 12 34 56 78',
      );
      await tester.tap(find.text('Retrait'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();

      final saved = fake.savedOrders.single;
      expect(saved['p_sale_id'], kTestSaleId);
      expect(saved['p_order_id'], isNull);
      final order = saved['p_order'] as Map<String, dynamic>;
      expect(order['buyer_name'], 'Paul TEST');
      expect(order['buyer_phone'], '06 12 34 56 78');
      expect(order['fulfilment'], 'pickup');
      expect(saved['p_items'], [
        {'product_id': productId(1), 'quantity': 1},
      ]);
    });

    testWidgets('picks the member who sold', (tester) async {
      final fake = FakeOrdersService();
      await pump(tester, OrderEditorScreen(detail: fake.detail), fake);
      expect(find.text('Personne'), findsOneWidget);
      await tester.tap(find.text('Personne'));
      await tester.pumpAndSettle();
      expect(find.text('Anne Test'), findsOneWidget);
      await tester.enterText(
        find.widgetWithText(TextField, 'Rechercher un membre'),
        'bob',
      );
      await tester.pumpAndSettle();
      expect(find.text('Anne Test'), findsNothing);
      await tester.tap(find.text('Bob Test'));
      await tester.pumpAndSettle();
      expect(find.text('Bob Test'), findsOneWidget);
      expect(find.text('Personne'), findsNothing);

      await tester.enterText(
        find.widgetWithText(TextField, 'Nom de l’acheteur *'),
        'Paul TEST',
      );
      await tester.tap(find.byTooltip('Plus de Saucisson · Noix'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(
        (fake.savedOrders.single['p_order'] as Map)['sold_by'],
        'member-bob',
      );
    });

    testWidgets('edits an order: fields filled, retired products kept', (
      tester,
    ) async {
      final fake = FakeOrdersService(
        detail: testDetail(products: [...kTestProducts, kRetiredProduct]),
      );
      final marieWithMorbier = OrderRecord(
        id: kMarie.id,
        saleId: kMarie.saleId,
        buyerName: kMarie.buyerName,
        buyerPhone: kMarie.buyerPhone,
        buyerAddress: kMarie.buyerAddress,
        soldBy: kMarie.soldBy,
        items: [
          ...kMarie.items,
          OrderItem(productId: productId(5), quantity: 1),
        ],
      );
      await pump(
        tester,
        OrderEditorScreen(
          detail: fake.detail,
          existing: marieWithMorbier,
          soldByName: 'Anne Test',
        ),
        fake,
      );
      expect(find.text('Modifier la commande'), findsOneWidget);
      expect(find.text('Marie Test'), findsOneWidget);
      expect(find.text('Anne Test'), findsOneWidget);
      expect(find.text('Morbier'), findsOneWidget);
      expect(find.text(formatEuros(4250 + 800)), findsOneWidget);

      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      final saved = fake.savedOrders.single;
      expect(saved['p_order_id'], 'o-marie');
      expect((saved['p_order'] as Map)['sold_by'], 'member-anne');
      expect(
        (saved['p_items'] as List).map((i) => i['product_id']),
        containsAll([productId(1), productId(2), productId(5)]),
      );
    });

    testWidgets('a retired product is hidden from a new order', (tester) async {
      final fake = FakeOrdersService(
        detail: testDetail(products: [...kTestProducts, kRetiredProduct]),
      );
      await pump(tester, OrderEditorScreen(detail: fake.detail), fake);
      expect(find.text('Morbier'), findsNothing);
    });
  });

  group('the payment sheet', () {
    testWidgets('an amount in the wrong shape is refused', (tester) async {
      await pumpScreen(
        tester,
        const Scaffold(body: PaymentSheet(dueCents: 0)),
        overrides: overrides(FakeOrdersService()),
      );
      expect(find.text('Reste à payer'), findsNothing);
      await tester.enterText(find.byType(TextField).first, '12,345');
      await tester.tap(find.widgetWithText(ChoiceChip, 'Espèces'));
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(
        find.text("Le montant doit être différent de 0 et d'au plus 1 000 €"),
        findsOneWidget,
      );
    });
  });
}
