import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/orders/domain/order_totals.dart';
import 'package:lebontemperament/features/orders/domain/orders_models.dart';

import '../../helpers/fake_orders.dart';

/// The same cases, with the same numbers, as
/// packages/domain/src/utils/orders.test.ts: the app and the admin must
/// agree on every total.
void main() {
  final byId = productsById(kTestProducts);

  /// French spacing (narrow no-break and no-break spaces) read as a space.
  String plain(String s) => s.replaceAll(RegExp('[  ]'), ' ');

  group('money', () {
    test('formats euros the French way', () {
      expect(plain(formatEuros(1100)), '11,00 €');
      expect(plain(formatEuros(123450)), '1 234,50 €');
      expect(plain(formatEuros(-400)), '-4,00 €');
      expect(plain(formatEuros(0)), '0,00 €');
      expect(plain(formatEuros(100000000)), '1 000 000,00 €');
    });

    test('reads what a person types', () {
      expect(parseEuros('8,50'), 850);
      expect(parseEuros('8.5'), 850);
      expect(parseEuros(' 12 € '), 1200);
      expect(parseEuros('1 234,5'), 123450);
      expect(parseEuros('-4'), -400);
      expect(parseEuros('8,505'), isNull);
      expect(parseEuros('abc'), isNull);
      expect(parseEuros(''), isNull);
    });
  });

  group('labels and grouping', () {
    test('product labels', () {
      expect(productLabel(kTestProducts[0]), 'Raclette · 1 kg');
      expect(
        productLabel(
          const OrderProduct(
            id: 'x',
            category: 'c',
            name: 'Fondue',
            unitPriceCents: 0,
          ),
        ),
        'Fondue',
      );
      expect(
        productLabel(
          const OrderProduct(
            id: 'x',
            category: 'c',
            name: 'Fondue',
            variant: '  ',
            unitPriceCents: 0,
          ),
        ),
        'Fondue',
      );
    });

    test('groups by category in catalogue order', () {
      final groups = groupProductsByCategory(kTestProducts);
      expect(
        [
          for (final g in groups) [g.category, ...g.products.map((p) => p.id)],
        ],
        [
          ['Fromages', productId(2), productId(1)],
          ['Saucissons', productId(3), productId(4)],
        ],
      );
    });

    test('wording', () {
      expect(paymentMethodLabel('transfer'), 'Virement');
      expect(paymentMethodLabel('cash'), 'Espèces');
      expect(paymentMethodLabel('cheque'), 'Chèque');
      expect(fulfilmentLabel('delivery'), 'Livraison');
      expect(fulfilmentLabel('pickup'), 'Retrait');
      expect(BalanceStatus.unpaid.label, 'À payer');
      expect(BalanceStatus.partial.label, 'Paiement partiel');
      expect(BalanceStatus.paid.label, 'Payé');
      expect(BalanceStatus.overpaid.label, 'Trop perçu');
    });
  });

  test('balance states', () {
    expect(balanceStatus(0, 0), BalanceStatus.empty);
    expect(balanceStatus(1000, 0), BalanceStatus.unpaid);
    expect(balanceStatus(1000, 400), BalanceStatus.partial);
    expect(balanceStatus(1000, 1000), BalanceStatus.paid);
    expect(balanceStatus(1000, 1200), BalanceStatus.overpaid);
    expect(balanceStatus(0, 500), BalanceStatus.overpaid);
  });

  test('one buyer: lines in catalogue order, unknown products ignored', () {
    final m = buyerBreakdown(kMarie, byId);
    expect(
      [for (final l in m.lines) (l.label, l.quantity, l.amountCents)],
      [('Bleu de Gex · 500 g', 1, 850), ('Raclette · 1 kg', 2, 3400)],
    );
    expect(m.totalCents, 4250);
    expect(m.paidCents, 2500);
    expect(m.dueCents, 1750);
    expect(m.status, BalanceStatus.partial);
  });

  group('a sale', () {
    final s = saleSummary(kTestProducts, kTestOrders);

    test('buyers in alphabetical order, accents and case aside', () {
      expect(
        [for (final b in s.buyers) b.buyerName],
        ['Éric Test', 'Marie Test', 'zoé Test'],
      );
    });

    test('figures', () {
      expect(s.orderCount, 3);
      expect(s.totalCents, 4250 + 1200 + 1200);
      expect(s.paidCents, 2500 + 1500);
      expect(s.dueCents, 1750 + 1200, reason: 'overpayment never offsets');
      expect(s.overpaidCents, 300);
      expect(s.paidCount, 1);
      expect(s.owingCount, 2);
      expect(s.byMethod, {'transfer': 1500, 'cash': 2000, 'cheque': 500});
    });

    test('per product and per supplier', () {
      expect(
        [for (final p in s.products) (p.label, p.quantity, p.amountCents)],
        [
          ('Bleu de Gex · 500 g', 1, 850),
          ('Raclette · 1 kg', 2, 3400),
          ('Saucisson · Noix', 4, 1600),
          ('Saucisson · Figues', 2, 800),
        ],
      );
      expect(
        [for (final x in s.suppliers) (x.supplier, x.quantity, x.amountCents)],
        [('Fruitière', 3, 4250), ('Salaison', 4, 1600), (null, 2, 800)],
      );
    });

    test('empty sale', () {
      final empty = saleSummary(kTestProducts, const []);
      expect(empty.totalCents, 0);
      expect(empty.products, isEmpty);
      expect(empty.suppliers, isEmpty);
      expect(empty.owingCount, 0);
    });
  });

  group('phones', () {
    test('normalises like the database', () {
      expect(normalizePhone('06 12 34 56 78'), '+33612345678');
      expect(normalizePhone('06.12.34.56.78'), '+33612345678');
      expect(normalizePhone('0033 6 12 34 56 78'), '+33612345678');
      expect(normalizePhone('0041 79 123 45 67'), '+41791234567');
      expect(normalizePhone('+41 79 123 45 67'), '+41791234567');
      expect(normalizePhone('  '), isNull);
      expect(normalizePhone(null), isNull);
    });

    test('validity', () {
      expect(isValidPhone('06 12 34 56 78'), isTrue);
      expect(isValidPhone('+33 6 12 34 56 78'), isTrue);
      expect(isValidPhone('12'), isFalse);
      expect(isValidPhone('06 12 34'), isFalse);
      expect(isValidPhone('abc'), isFalse);
    });
  });

  group('order input', () {
    final ids = {for (final p in kTestProducts) p.id};

    test('accepts a trimmed order and drops zero quantities', () {
      final good = parseOrderInput(
        buyerName: ' Marie Test ',
        buyerPhone: '06 12 34 56 78',
        buyerAddress: '',
        soldBy: '',
        fulfilment: 'pickup',
        quantities: {productId(1): 2, productId(2): 0},
        productIds: ids,
      );
      expect(good.isOk, isTrue);
      final v = good.value!;
      expect(v.buyerName, 'Marie Test');
      expect(v.buyerPhone, '06 12 34 56 78');
      expect(v.buyerAddress, isNull);
      expect(v.soldBy, isNull);
      expect(v.fulfilment, 'pickup');
      expect(v.notes, isNull);
      expect(v.itemsJson(), [
        {'product_id': productId(1), 'quantity': 2},
      ]);
    });

    Parsed<OrderInput> refuse({
      String buyerName = 'A',
      String? buyerPhone,
      String? buyerAddress,
      String fulfilment = 'delivery',
      Map<String, int>? quantities,
    }) => parseOrderInput(
      buyerName: buyerName,
      buyerPhone: buyerPhone,
      buyerAddress: buyerAddress,
      fulfilment: fulfilment,
      quantities: quantities ?? {productId(1): 1},
      productIds: ids,
    );

    test('refuses what the admin refuses, with the same words', () {
      final noName = refuse(buyerName: '  ');
      expect(noName.field, 'buyer_name');
      expect(noName.error, "Le nom de l'acheteur est obligatoire");

      final badPhone = refuse(buyerPhone: '123');
      expect(badPhone.field, 'buyer_phone');
      expect(badPhone.error, "Ce numéro de téléphone n'est pas valide");

      expect(refuse(fulfilment: 'drone').field, 'fulfilment');

      final nothing = refuse(quantities: {});
      expect(nothing.field, 'items');
      expect(nothing.error, 'Ajoutez au moins un produit');
      expect(refuse(quantities: {productId(1): 0}).field, 'items');
      expect(refuse(quantities: {productId(9): 1}).field, 'items');
      expect(refuse(quantities: {productId(1): 1000}).field, 'items');
      expect(refuse(buyerAddress: 'x' * 301).field, 'buyer_address');
    });
  });

  group('payment input', () {
    test('accepts an amount with a method', () {
      final p = parsePaymentInput(
        amount: '25',
        method: 'cheque',
        paidOn: DateTime(2026, 11, 10, 15, 30),
      );
      expect(p.isOk, isTrue);
      expect(p.value!.amountCents, 2500);
      expect(p.value!.method, 'cheque');
      expect(p.value!.paidOn, DateTime(2026, 11, 10));
      expect(p.value!.note, isNull);
      expect(isoDay(p.value!.paidOn), '2026-11-10');
    });

    test('a refund is allowed', () {
      expect(
        parsePaymentInput(
          amount: '-5',
          method: 'cash',
          paidOn: DateTime(2026, 11, 10),
        ).isOk,
        isTrue,
      );
    });

    test('refusals', () {
      for (final (amount, method, field) in [
        ('0', 'cash', 'amount_cents'),
        ('12,505', 'cash', 'amount_cents'),
        ('1000,01', 'cash', 'amount_cents'),
        ('', 'cash', 'amount_cents'),
        ('1', 'bitcoin', 'method'),
        ('1', null, 'method'),
      ]) {
        final r = parsePaymentInput(
          amount: amount,
          method: method,
          paidOn: DateTime(2026, 11, 10),
        );
        expect(r.isOk, isFalse, reason: '$amount $method');
        expect(r.field, field, reason: '$amount $method');
      }
    });
  });
}
