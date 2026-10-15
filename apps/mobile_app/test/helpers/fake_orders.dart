import 'package:lebontemperament/features/orders/data/orders_service.dart';
import 'package:lebontemperament/features/orders/domain/order_totals.dart';
import 'package:lebontemperament/features/orders/domain/orders_models.dart';

/// Obviously fake fixtures for « Commandes »: the same catalogue and buyers
/// as packages/domain/src/utils/orders.test.ts, so the numbers match.
String productId(int n) =>
    '00000000-0000-4000-8000-${n.toString().padLeft(12, '0')}';

const kTestSaleId = '55555555-5555-4555-8555-555555555555';

final kTestProducts = [
  OrderProduct(
    id: productId(1),
    category: 'Fromages',
    name: 'Raclette',
    variant: '1 kg',
    supplier: 'Fruitière',
    unitPriceCents: 1700,
    displayOrder: 20,
  ),
  OrderProduct(
    id: productId(2),
    category: 'Fromages',
    name: 'Bleu de Gex',
    variant: '500 g',
    supplier: 'Fruitière',
    unitPriceCents: 850,
    displayOrder: 10,
  ),
  OrderProduct(
    id: productId(3),
    category: 'Saucissons',
    name: 'Saucisson',
    variant: 'Noix',
    supplier: 'Salaison',
    unitPriceCents: 400,
    displayOrder: 30,
  ),
  OrderProduct(
    id: productId(4),
    category: 'Saucissons',
    name: 'Saucisson',
    variant: 'Figues',
    supplier: null,
    unitPriceCents: 400,
    displayOrder: 40,
  ),
];

/// A product nobody can order any more (hidden from new orders).
final kRetiredProduct = OrderProduct(
  id: productId(5),
  category: 'Fromages',
  name: 'Morbier',
  variant: null,
  supplier: 'Fruitière',
  unitPriceCents: 800,
  displayOrder: 15,
  isAvailable: false,
);

final kMarie = OrderRecord(
  id: 'o-marie',
  saleId: kTestSaleId,
  buyerName: 'Marie Test',
  buyerPhone: '+33600000000',
  buyerAddress: '1 rue de l’Exemple, 25000 Testville',
  soldBy: 'member-anne',
  fulfilment: 'delivery',
  notes: 'Passer après 18 h',
  createdAt: DateTime.utc(2026, 10, 20, 9),
  items: [
    OrderItem(productId: productId(1), quantity: 2),
    OrderItem(productId: productId(2), quantity: 1),
    const OrderItem(productId: 'unknown', quantity: 5),
    OrderItem(productId: productId(3), quantity: 0),
  ],
  payments: [
    OrderPayment(
      id: 'p-1',
      orderId: 'o-marie',
      amountCents: 2000,
      method: 'cash',
      paidOn: DateTime(2026, 10, 21),
    ),
    OrderPayment(
      id: 'p-2',
      orderId: 'o-marie',
      amountCents: 500,
      method: 'cheque',
      paidOn: DateTime(2026, 10, 25),
      note: 'Chèque n° 12',
    ),
  ],
);

final kZoe = OrderRecord(
  id: 'o-zoe',
  saleId: kTestSaleId,
  buyerName: 'zoé Test',
  fulfilment: 'pickup',
  handedOverAt: DateTime.utc(2026, 11, 27, 10),
  items: [OrderItem(productId: productId(3), quantity: 3)],
  payments: [
    OrderPayment(
      id: 'p-3',
      orderId: 'o-zoe',
      amountCents: 1500,
      method: 'transfer',
      paidOn: DateTime(2026, 10, 22),
    ),
  ],
);

final kEric = OrderRecord(
  id: 'o-eric',
  saleId: kTestSaleId,
  buyerName: 'Éric Test',
  buyerAddress: '2 place du Marché, 25000 Testville',
  fulfilment: 'delivery',
  deliveryRecipientId: 'recipient-eric',
  items: [
    OrderItem(productId: productId(4), quantity: 2),
    OrderItem(productId: productId(3), quantity: 1),
  ],
);

final kTestOrders = [kMarie, kZoe, kEric];

final kTestSale = OrderSale(
  id: kTestSaleId,
  title: 'Fromages et saucissons · novembre 2026',
  orderDeadline: DateTime(2026, 11, 13),
  deliveryDate: DateTime(2026, 11, 27),
  createdAt: DateTime.utc(2026, 10, 13),
);

final kArchivedSale = OrderSale(
  id: '66666666-6666-4666-8666-666666666666',
  title: 'Fromages · novembre 2025',
  deliveryDate: DateTime(2025, 11, 28),
  archivedAt: DateTime.utc(2025, 12, 30),
  createdAt: DateTime.utc(2025, 10, 10),
);

SaleDetail testDetail({
  List<OrderRecord>? orders,
  List<OrderProduct>? products,
}) => SaleDetail(
  sale: kTestSale,
  products: products ?? kTestProducts,
  orders: orders ?? kTestOrders,
  memberNames: const {'member-anne': 'Anne Test'},
);

/// Answers from memory and records every write; [failing] makes every call
/// throw (the error states).
class FakeOrdersService implements OrdersService {
  FakeOrdersService({
    SaleDetail? detail,
    List<SaleOverview>? sales,
    this.failing = false,
    this.deliveryResult = const DeliveryAddResult(
      deliveryId: 'delivery-test',
      added: 2,
      withoutAddress: 1,
    ),
  }) : detail = detail ?? testDetail(),
       sales =
           sales ??
           [
             SaleOverview(
               sale: kTestSale,
               orderCount: 3,
               dueCents: saleSummary(kTestProducts, kTestOrders).dueCents,
             ),
             SaleOverview(sale: kArchivedSale, orderCount: 41, dueCents: 0),
           ];

  SaleDetail detail;
  List<SaleOverview> sales;
  bool failing;
  DeliveryAddResult deliveryResult;

  final savedOrders = <Map<String, dynamic>>[];
  final payments = <Map<String, dynamic>>[];
  final deletedPayments = <String>[];
  final handedOver = <(String, bool)>[];
  final deletedOrders = <String>[];
  final roundCalls = <String>[];
  int loads = 0;

  void _check() {
    if (failing) throw Exception('offline');
  }

  @override
  Future<List<SaleOverview>> listSales() async {
    _check();
    return sales;
  }

  @override
  Future<SaleDetail> loadSale(String saleId) async {
    _check();
    loads++;
    return detail;
  }

  @override
  Future<String> saveOrder({
    required String saleId,
    String? orderId,
    required OrderInput input,
  }) async {
    _check();
    savedOrders.add(
      saveOrderParams(saleId: saleId, orderId: orderId, input: input),
    );
    return orderId ?? 'o-new';
  }

  @override
  Future<void> addPayment({
    required String orderId,
    required PaymentInput input,
  }) async {
    _check();
    payments.add(paymentRow(orderId: orderId, input: input));
    final order = detail.orderById(orderId);
    if (order != null) {
      detail = SaleDetail(
        sale: detail.sale,
        products: detail.products,
        memberNames: detail.memberNames,
        orders: [
          for (final o in detail.orders)
            if (o.id == orderId)
              o.copyWith(
                payments: [
                  ...o.payments,
                  OrderPayment(
                    id: 'p-new-${payments.length}',
                    orderId: orderId,
                    amountCents: input.amountCents,
                    method: input.method,
                    paidOn: input.paidOn,
                    note: input.note,
                  ),
                ],
              )
            else
              o,
        ],
      );
    }
  }

  @override
  Future<void> deletePayment(String paymentId) async {
    _check();
    deletedPayments.add(paymentId);
  }

  @override
  Future<void> setHandedOver(String orderId, {required bool handedOver}) async {
    _check();
    this.handedOver.add((orderId, handedOver));
  }

  @override
  Future<void> deleteOrder(String orderId) async {
    _check();
    deletedOrders.add(orderId);
  }

  @override
  Future<DeliveryAddResult> addSaleOrdersToDelivery(String saleId) async {
    _check();
    roundCalls.add(saleId);
    return deliveryResult;
  }
}
