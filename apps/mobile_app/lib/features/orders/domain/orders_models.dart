/// The rows of the « Commandes » tables (supabase/migrations/
/// 20261013222527_orders.sql), as the app reads them. Totals are never
/// stored: see order_totals.dart.
library;

import 'order_totals.dart' show paymentsNewestFirst;

DateTime? _date(Object? v) =>
    v is String && v.isNotEmpty ? DateTime.tryParse(v) : null;

/// A sale (« vente »): one catalogue, one deadline, one delivery day.
class OrderSale {
  const OrderSale({
    required this.id,
    required this.title,
    this.orderDeadline,
    this.deliveryDate,
    this.archivedAt,
    this.createdAt,
  });

  final String id;
  final String title;
  final DateTime? orderDeadline;
  final DateTime? deliveryDate;
  final DateTime? archivedAt;
  final DateTime? createdAt;

  bool get isArchived => archivedAt != null;

  factory OrderSale.fromJson(Map<String, dynamic> json) => OrderSale(
    id: json['id'] as String,
    title: (json['title'] as String?) ?? '',
    orderDeadline: _date(json['order_deadline']),
    deliveryDate: _date(json['delivery_date']),
    archivedAt: _date(json['archived_at']),
    createdAt: _date(json['created_at']),
  );
}

/// One line of a sale's catalogue.
class OrderProduct {
  const OrderProduct({
    required this.id,
    required this.category,
    required this.name,
    this.variant,
    this.supplier,
    required this.unitPriceCents,
    this.displayOrder = 0,
    this.isAvailable = true,
  });

  final String id;
  final String category;
  final String name;
  final String? variant;
  final String? supplier;
  final int unitPriceCents;
  final int displayOrder;

  /// False hides the product from new orders (it stays on existing ones).
  final bool isAvailable;

  factory OrderProduct.fromJson(Map<String, dynamic> json) => OrderProduct(
    id: json['id'] as String,
    category: (json['category'] as String?) ?? '',
    name: (json['name'] as String?) ?? '',
    variant: json['variant'] as String?,
    supplier: json['supplier'] as String?,
    unitPriceCents: (json['unit_price_cents'] as num?)?.toInt() ?? 0,
    displayOrder: (json['display_order'] as num?)?.toInt() ?? 0,
    isAvailable: json['is_available'] as bool? ?? true,
  );
}

/// A quantity of one product on an order.
class OrderItem {
  const OrderItem({required this.productId, required this.quantity});

  final String productId;
  final int quantity;

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
    productId: json['product_id'] as String,
    quantity: (json['quantity'] as num?)?.toInt() ?? 0,
  );

  Map<String, dynamic> toJson() => {
    'product_id': productId,
    'quantity': quantity,
  };
}

/// Money received for an order; negative is a refund.
class OrderPayment {
  const OrderPayment({
    required this.id,
    required this.orderId,
    required this.amountCents,
    required this.method,
    required this.paidOn,
    this.note,
    this.createdAt,
  });

  final String id;
  final String orderId;
  final int amountCents;

  /// `transfer`, `cash` or `cheque`.
  final String method;
  final DateTime paidOn;
  final String? note;
  final DateTime? createdAt;

  factory OrderPayment.fromJson(Map<String, dynamic> json) => OrderPayment(
    id: json['id'] as String,
    orderId: json['order_id'] as String,
    amountCents: (json['amount_cents'] as num?)?.toInt() ?? 0,
    method: (json['method'] as String?) ?? '',
    paidOn: _date(json['paid_on']) ?? DateTime.now(),
    note: json['note'] as String?,
    createdAt: _date(json['created_at']),
  );
}

/// One buyer's order with its quantities and payments.
class OrderRecord {
  const OrderRecord({
    required this.id,
    required this.saleId,
    required this.buyerName,
    this.buyerPhone,
    this.buyerAddress,
    this.soldBy,
    this.fulfilment = 'delivery',
    this.notes,
    this.deliveryRecipientId,
    this.handedOverAt,
    this.personalDataErasedAt,
    this.createdAt,
    this.items = const [],
    this.payments = const [],
  });

  final String id;
  final String saleId;
  final String buyerName;
  final String? buyerPhone;
  final String? buyerAddress;

  /// The member who took the order (profiles.id), if any.
  final String? soldBy;

  /// `delivery` or `pickup`.
  final String fulfilment;
  final String? notes;

  /// Set once the buyer is a stop of a delivery round.
  final String? deliveryRecipientId;

  /// « Remis »: the buyer has their goods.
  final DateTime? handedOverAt;
  final DateTime? personalDataErasedAt;
  final DateTime? createdAt;
  final List<OrderItem> items;
  final List<OrderPayment> payments;

  bool get isDelivery => fulfilment == 'delivery';
  bool get isHandedOver => handedOverAt != null;
  bool get isInRound => deliveryRecipientId != null;
  bool get isErased => personalDataErasedAt != null;

  factory OrderRecord.fromJson(Map<String, dynamic> json) => OrderRecord(
    id: json['id'] as String,
    saleId: json['sale_id'] as String,
    buyerName: (json['buyer_name'] as String?) ?? '',
    buyerPhone: json['buyer_phone'] as String?,
    buyerAddress: json['buyer_address'] as String?,
    soldBy: json['sold_by'] as String?,
    fulfilment: (json['fulfilment'] as String?) ?? 'delivery',
    notes: json['notes'] as String?,
    deliveryRecipientId: json['delivery_recipient_id'] as String?,
    handedOverAt: _date(json['handed_over_at']),
    personalDataErasedAt: _date(json['personal_data_erased_at']),
    createdAt: _date(json['created_at']),
    items: [
      for (final row in (json['order_items'] as List<dynamic>?) ?? const [])
        OrderItem.fromJson(row as Map<String, dynamic>),
    ],
    payments: paymentsNewestFirst([
      for (final row in (json['order_payments'] as List<dynamic>?) ?? const [])
        OrderPayment.fromJson(row as Map<String, dynamic>),
    ]),
  );

  OrderRecord copyWith({
    DateTime? handedOverAt,
    bool clearHandedOverAt = false,
    List<OrderPayment>? payments,
  }) => OrderRecord(
    id: id,
    saleId: saleId,
    buyerName: buyerName,
    buyerPhone: buyerPhone,
    buyerAddress: buyerAddress,
    soldBy: soldBy,
    fulfilment: fulfilment,
    notes: notes,
    deliveryRecipientId: deliveryRecipientId,
    handedOverAt: clearHandedOverAt
        ? null
        : (handedOverAt ?? this.handedOverAt),
    personalDataErasedAt: personalDataErasedAt,
    createdAt: createdAt,
    items: items,
    payments: payments ?? this.payments,
  );
}

/// A sale with its catalogue and every order, as the sale screen needs it.
class SaleDetail {
  const SaleDetail({
    required this.sale,
    required this.products,
    required this.orders,
    this.memberNames = const {},
  });

  final OrderSale sale;
  final List<OrderProduct> products;
  final List<OrderRecord> orders;

  /// profiles.id → display name, for « Vendu par ».
  final Map<String, String> memberNames;

  OrderRecord? orderById(String id) {
    for (final o in orders) {
      if (o.id == id) return o;
    }
    return null;
  }

  String? soldByName(OrderRecord order) =>
      order.soldBy == null ? null : memberNames[order.soldBy!];
}

/// A sale in the list: the sale and what its orders add up to.
class SaleOverview {
  const SaleOverview({
    required this.sale,
    required this.orderCount,
    required this.dueCents,
  });

  final OrderSale sale;
  final int orderCount;
  final int dueCents;
}

/// What `add_sale_orders_to_delivery` reports.
class DeliveryAddResult {
  const DeliveryAddResult({
    required this.deliveryId,
    required this.added,
    required this.withoutAddress,
  });

  final String? deliveryId;
  final int added;
  final int withoutAddress;

  factory DeliveryAddResult.fromJson(Map<String, dynamic> json) =>
      DeliveryAddResult(
        deliveryId: json['delivery_id'] as String?,
        added: (json['added'] as num?)?.toInt() ?? 0,
        withoutAddress: (json['without_address'] as num?)?.toInt() ?? 0,
      );
}
