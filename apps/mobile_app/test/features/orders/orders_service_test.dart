import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/orders/data/orders_service.dart';
import 'package:lebontemperament/features/orders/domain/order_totals.dart';
import 'package:lebontemperament/features/orders/domain/orders_models.dart';

import '../../helpers/fake_orders.dart';

/// What the app sends to the database, and how it reads what comes back.
void main() {
  group('save_order params', () {
    final input = OrderInput(
      buyerName: 'Marie Test',
      buyerPhone: '06 12 34 56 78',
      buyerAddress: null,
      soldBy: 'member-anne',
      fulfilment: 'delivery',
      notes: 'Passer après 18 h',
      items: [
        OrderItem(productId: productId(1), quantity: 2),
        OrderItem(productId: productId(2), quantity: 1),
      ],
    );

    test('a new order has a null id', () {
      expect(saveOrderParams(saleId: kTestSaleId, input: input), {
        'p_sale_id': kTestSaleId,
        'p_order_id': null,
        'p_order': {
          'buyer_name': 'Marie Test',
          'buyer_phone': '06 12 34 56 78',
          'buyer_address': null,
          'sold_by': 'member-anne',
          'fulfilment': 'delivery',
          'notes': 'Passer après 18 h',
        },
        'p_items': [
          {'product_id': productId(1), 'quantity': 2},
          {'product_id': productId(2), 'quantity': 1},
        ],
      });
    });

    test('an edit names the order', () {
      final params = saveOrderParams(
        saleId: kTestSaleId,
        orderId: 'o-marie',
        input: input,
      );
      expect(params['p_order_id'], 'o-marie');
      expect(params['p_sale_id'], kTestSaleId);
    });

    test('the parsed input never carries zero quantities', () {
      final parsed = parseOrderInput(
        buyerName: 'Marie Test',
        quantities: {productId(1): 0, productId(3): 4},
        productIds: {productId(1), productId(3)},
      );
      final params = saveOrderParams(saleId: kTestSaleId, input: parsed.value!);
      expect(params['p_items'], [
        {'product_id': productId(3), 'quantity': 4},
      ]);
    });
  });

  test('a payment row', () {
    final row = paymentRow(
      orderId: 'o-marie',
      input: PaymentInput(
        amountCents: 1750,
        method: 'cheque',
        paidOn: DateTime(2026, 11, 5),
        note: 'Chèque n° 12',
      ),
    );
    expect(row, {
      'order_id': 'o-marie',
      'amount_cents': 1750,
      'method': 'cheque',
      'paid_on': '2026-11-05',
      'note': 'Chèque n° 12',
    });
  });

  test('sales: current first (newest first), archived last', () {
    final older = OrderSale(
      id: 'a',
      title: 'Older current',
      createdAt: DateTime.utc(2026, 1, 1),
    );
    final sorted = sortSales([kArchivedSale, older, kTestSale], (s) => s);
    expect(
      [for (final s in sorted) s.id],
      [kTestSale.id, 'a', kArchivedSale.id],
    );
  });

  group('rows from the database', () {
    test('an order with its items and payments, newest payment first', () {
      final order = OrderRecord.fromJson({
        'id': 'o-1',
        'sale_id': kTestSaleId,
        'buyer_name': 'Marie Test',
        'buyer_phone': null,
        'buyer_address': '1 rue de l’Exemple',
        'sold_by': null,
        'fulfilment': 'pickup',
        'notes': null,
        'delivery_recipient_id': null,
        'handed_over_at': '2026-11-27T10:00:00+00:00',
        'personal_data_erased_at': null,
        'created_at': '2026-10-20T09:00:00+00:00',
        'order_items': [
          {'product_id': productId(1), 'quantity': 2},
        ],
        'order_payments': [
          {
            'id': 'p-a',
            'order_id': 'o-1',
            'amount_cents': 1000,
            'method': 'cash',
            'paid_on': '2026-10-21',
            'note': null,
            'created_at': '2026-10-21T10:00:00+00:00',
          },
          {
            'id': 'p-b',
            'order_id': 'o-1',
            'amount_cents': -200,
            'method': 'cash',
            'paid_on': '2026-10-25',
            'note': 'remboursé',
            'created_at': '2026-10-25T10:00:00+00:00',
          },
        ],
      });
      expect(order.isHandedOver, isTrue);
      expect(order.isDelivery, isFalse);
      expect(order.isInRound, isFalse);
      expect(order.items.single.quantity, 2);
      expect([for (final p in order.payments) p.id], ['p-b', 'p-a']);
      expect(order.payments.first.amountCents, -200);
    });

    test('a sale and a product', () {
      final sale = OrderSale.fromJson({
        'id': kTestSaleId,
        'title': 'Vente',
        'order_deadline': '2026-11-13',
        'delivery_date': null,
        'archived_at': null,
        'created_at': '2026-10-13T22:25:27+00:00',
      });
      expect(sale.orderDeadline, DateTime(2026, 11, 13));
      expect(sale.deliveryDate, isNull);
      expect(sale.isArchived, isFalse);

      final product = OrderProduct.fromJson({
        'id': productId(1),
        'sale_id': kTestSaleId,
        'category': 'Fromages',
        'name': 'Raclette',
        'variant': '1 kg',
        'supplier': 'Fruitière',
        'unit_price_cents': 1700,
        'display_order': 20,
        'is_available': false,
      });
      expect(productLabel(product), 'Raclette · 1 kg');
      expect(product.isAvailable, isFalse);
    });

    test('what the round function reports', () {
      final r = DeliveryAddResult.fromJson({
        'delivery_id': 'd-1',
        'added': 12,
        'without_address': 2,
      });
      expect((r.deliveryId, r.added, r.withoutAddress), ('d-1', 12, 2));
    });
  });
}
