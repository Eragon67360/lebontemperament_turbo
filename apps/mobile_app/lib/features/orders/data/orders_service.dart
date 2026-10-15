import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/supabase_config.dart';
import '../domain/order_totals.dart';
import '../domain/orders_models.dart';

/// Everything the database needs to save an order through `save_order`:
/// `p_order_id` null creates, otherwise the order is replaced along with its
/// quantities (a product left out or at 0 is dropped).
Map<String, dynamic> saveOrderParams({
  required String saleId,
  String? orderId,
  required OrderInput input,
}) => {
  'p_sale_id': saleId,
  'p_order_id': orderId,
  'p_order': input.orderJson(),
  'p_items': input.itemsJson(),
};

/// One row of `order_payments`. `recorded_by` is left to the database.
Map<String, dynamic> paymentRow({
  required String orderId,
  required PaymentInput input,
}) => {
  'order_id': orderId,
  'amount_cents': input.amountCents,
  'method': input.method,
  'paid_on': isoDay(input.paidOn),
  'note': input.note,
};

/// The sales as the list shows them: the current ones first (newest first),
/// then the archived ones.
List<T> sortSales<T>(Iterable<T> sales, OrderSale Function(T) saleOf) {
  final list = sales.toList();
  list.sort((a, b) {
    final sa = saleOf(a);
    final sb = saleOf(b);
    if (sa.isArchived != sb.isArchived) return sa.isArchived ? 1 : -1;
    final ca = sa.createdAt ?? DateTime(0);
    final cb = sb.createdAt ?? DateTime(0);
    return cb.compareTo(ca);
  });
  return list;
}

/// « Commandes » in the app: what the admin does except editing the
/// catalogue. Rights are the database's (RLS, superadmins only): every call
/// runs with the member's session.
abstract class OrdersService {
  Future<List<SaleOverview>> listSales();

  /// The sale with its catalogue and every order (quantities and payments).
  Future<SaleDetail> loadSale(String saleId);

  /// Creates ([orderId] null) or replaces an order; returns its id.
  Future<String> saveOrder({
    required String saleId,
    String? orderId,
    required OrderInput input,
  });

  Future<void> addPayment({
    required String orderId,
    required PaymentInput input,
  });

  Future<void> deletePayment(String paymentId);

  /// « Remis »: the buyer has their goods (or not any more).
  Future<void> setHandedOver(String orderId, {required bool handedOver});

  Future<void> deleteOrder(String orderId);

  /// Adds the sale's buyers to deliver into the signed-in superadmin's
  /// current round (the one the app opens), or a new one.
  Future<DeliveryAddResult> addSaleOrdersToDelivery(String saleId);
}

const _saleWithOrders =
    '*, order_products(*), orders(*, order_items(*), order_payments(*))';

class SupabaseOrdersService implements OrdersService {
  SupabaseOrdersService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  SupabaseClient get _client => SupabaseConfig.client;

  static SaleDetail _detailFromRow(Map<String, dynamic> row) {
    final map = Map<String, dynamic>.from(row);
    final products = [
      for (final p in (map.remove('order_products') as List<dynamic>?) ?? [])
        OrderProduct.fromJson(p as Map<String, dynamic>),
    ];
    final orders = [
      for (final o in (map.remove('orders') as List<dynamic>?) ?? [])
        OrderRecord.fromJson(o as Map<String, dynamic>),
    ];
    return SaleDetail(
      sale: OrderSale.fromJson(map),
      products: products,
      orders: orders,
    );
  }

  @override
  Future<List<SaleOverview>> listSales() async {
    try {
      final rows = await _client
          .from('order_sales')
          .select(_saleWithOrders)
          .order('created_at', ascending: false);
      final details = [for (final row in rows) _detailFromRow(row)];
      return sortSales([
        for (final d in details)
          SaleOverview(
            sale: d.sale,
            orderCount: d.orders.length,
            dueCents: saleSummary(d.products, d.orders).dueCents,
          ),
      ], (o) => o.sale);
    } catch (e) {
      _logger.e('OrdersService listSales', error: e);
      rethrow;
    }
  }

  @override
  Future<SaleDetail> loadSale(String saleId) async {
    try {
      final row = await _client
          .from('order_sales')
          .select(_saleWithOrders)
          .eq('id', saleId)
          .single();
      return _detailFromRow(row);
    } catch (e) {
      _logger.e('OrdersService loadSale', error: e);
      rethrow;
    }
  }

  @override
  Future<String> saveOrder({
    required String saleId,
    String? orderId,
    required OrderInput input,
  }) async {
    try {
      final result = await _client.rpc(
        'save_order',
        params: saveOrderParams(saleId: saleId, orderId: orderId, input: input),
      );
      return result as String;
    } catch (e) {
      _logger.e('OrdersService saveOrder', error: e);
      rethrow;
    }
  }

  @override
  Future<void> addPayment({
    required String orderId,
    required PaymentInput input,
  }) async {
    try {
      await _client
          .from('order_payments')
          .insert(paymentRow(orderId: orderId, input: input));
    } catch (e) {
      _logger.e('OrdersService addPayment', error: e);
      rethrow;
    }
  }

  @override
  Future<void> deletePayment(String paymentId) async {
    try {
      await _client.from('order_payments').delete().eq('id', paymentId);
    } catch (e) {
      _logger.e('OrdersService deletePayment', error: e);
      rethrow;
    }
  }

  @override
  Future<void> setHandedOver(String orderId, {required bool handedOver}) async {
    try {
      await _client
          .from('orders')
          .update({
            'handed_over_at': handedOver
                ? DateTime.now().toUtc().toIso8601String()
                : null,
          })
          .eq('id', orderId);
    } catch (e) {
      _logger.e('OrdersService setHandedOver', error: e);
      rethrow;
    }
  }

  @override
  Future<void> deleteOrder(String orderId) async {
    try {
      await _client.from('orders').delete().eq('id', orderId);
    } catch (e) {
      _logger.e('OrdersService deleteOrder', error: e);
      rethrow;
    }
  }

  @override
  Future<DeliveryAddResult> addSaleOrdersToDelivery(String saleId) async {
    try {
      final result = await _client.rpc(
        'add_sale_orders_to_delivery',
        params: {'p_sale_id': saleId},
      );
      return DeliveryAddResult.fromJson(
        Map<String, dynamic>.from(result as Map),
      );
    } catch (e) {
      _logger.e('OrdersService addSaleOrdersToDelivery', error: e);
      rethrow;
    }
  }
}
