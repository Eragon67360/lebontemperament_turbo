// The rules of « Commandes » the app shares with the admin: labels, money,
// buyer and sale totals, phones, and the checks an order or a payment must
// pass. This file is the Dart twin of packages/domain/src/utils/orders.ts
// (only what the app needs): keep the two in step, and the same cases in
// test/features/orders/order_totals_test.dart and orders.test.ts.

import 'orders_models.dart';

// ---------------------------------------------------------------------------
// Labels

const paymentMethods = ['transfer', 'cash', 'cheque'];

const paymentMethodLabels = {
  'transfer': 'Virement',
  'cash': 'Espèces',
  'cheque': 'Chèque',
};

const fulfilments = ['delivery', 'pickup'];

const fulfilmentLabels = {'delivery': 'Livraison', 'pickup': 'Retrait'};

enum BalanceStatus {
  empty('Rien commandé'),
  unpaid('À payer'),
  partial('Paiement partiel'),
  paid('Payé'),
  overpaid('Trop perçu');

  const BalanceStatus(this.label);
  final String label;

  /// Nothing left to pay.
  bool get isSettled => this == paid || this == overpaid;

  /// Something left to pay.
  bool get isOwing => this == unpaid || this == partial;
}

String paymentMethodLabel(String method) =>
    paymentMethodLabels[method] ?? method;

String fulfilmentLabel(String fulfilment) =>
    fulfilmentLabels[fulfilment] ?? fulfilment;

// Limits (the database checks the same ones).
const kBuyerNameMax = 120;
const kBuyerPhoneMax = 40;
const kBuyerAddressMax = 300;
const kOrderNotesMax = 1000;
const kQuantityMax = 999;
const kPaymentNoteMax = 300;
const kPriceMaxCents = 100000;

// ---------------------------------------------------------------------------
// Money

const _nbsp = ' ';
const _thinSpace = ' ';

/// « 11,00 € », « 1 234,50 € » (French spacing), « -4,00 € ».
String formatEuros(int cents) {
  final sign = cents < 0 ? '-' : '';
  final abs = cents.abs();
  final euros = abs ~/ 100;
  final rest = (abs % 100).toString().padLeft(2, '0');
  final digits = euros.toString();
  final buffer = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    final fromEnd = digits.length - i;
    buffer.write(digits[i]);
    if (fromEnd > 1 && fromEnd % 3 == 1) buffer.write(_thinSpace);
  }
  return '$sign$buffer,$rest$_nbsp€';
}

final _amount = RegExp(r'^-?\d+(\.\d{1,2})?$');

/// Reads an amount typed by a person: « 8,50 », « 8.5 », « 12 », « 12 € ».
/// Returns cents, or null when it isn't an amount with at most two decimals.
int? parseEuros(String input) {
  var s = input.replaceAll(RegExp('[\\s$_nbsp$_thinSpace]'), '');
  if (s.endsWith('€')) s = s.substring(0, s.length - 1);
  s = s.replaceFirst(',', '.');
  if (!_amount.hasMatch(s)) return null;
  final value = double.tryParse(s);
  if (value == null) return null;
  return (value * 100).round();
}

// ---------------------------------------------------------------------------
// Products and orders

/// « Raclette · 1 kg », « Saucisson · Noix », or the name alone.
String productLabel(OrderProduct p) {
  final variant = p.variant?.trim() ?? '';
  return variant.isEmpty ? p.name : '${p.name} · $variant';
}

/// Letters without accents, lowercased, so « Éric » sorts with « eric »
/// the way the admin's `localeCompare('fr')` does.
String sortKey(String s) {
  const from = 'àáâäãåçèéêëìíîïñòóôöõùúûüýÿœæ';
  const to = 'aaaaaaceeeeiiiinooooouuuuyyoa';
  final buffer = StringBuffer();
  for (final rune in s.toLowerCase().runes) {
    final ch = String.fromCharCode(rune);
    final i = from.indexOf(ch);
    buffer.write(i >= 0 ? to[i] : ch);
  }
  return buffer.toString();
}

int _compareLabels(String a, String b) {
  final byKey = sortKey(a).compareTo(sortKey(b));
  return byKey != 0 ? byKey : a.compareTo(b);
}

/// Products in the catalogue's order (display order, then label).
List<OrderProduct> sortProducts(Iterable<OrderProduct> products) {
  final list = products.toList();
  list.sort((a, b) {
    final byOrder = a.displayOrder.compareTo(b.displayOrder);
    if (byOrder != 0) return byOrder;
    return _compareLabels(productLabel(a), productLabel(b));
  });
  return list;
}

class ProductGroup {
  const ProductGroup({required this.category, required this.products});
  final String category;
  final List<OrderProduct> products;
}

/// Products grouped by category, categories in the order they first appear.
List<ProductGroup> groupProductsByCategory(Iterable<OrderProduct> products) {
  final groups = <ProductGroup>[];
  for (final p in sortProducts(products)) {
    final existing = groups.where((g) => g.category == p.category);
    if (existing.isNotEmpty) {
      existing.first.products.add(p);
    } else {
      groups.add(ProductGroup(category: p.category, products: [p]));
    }
  }
  return groups;
}

Map<String, OrderProduct> productsById(Iterable<OrderProduct> products) => {
  for (final p in products) p.id: p,
};

int orderTotalCents(Iterable<OrderItem> items, Map<String, OrderProduct> byId) {
  var sum = 0;
  for (final item in items) {
    sum += item.quantity * (byId[item.productId]?.unitPriceCents ?? 0);
  }
  return sum;
}

int orderPaidCents(Iterable<OrderPayment> payments) =>
    payments.fold(0, (sum, p) => sum + p.amountCents);

/// The payments as the screens list them: the most recent day first, then
/// the most recently recorded.
List<OrderPayment> paymentsNewestFirst(Iterable<OrderPayment> payments) {
  final list = payments.toList();
  list.sort((a, b) {
    final byDay = b.paidOn.compareTo(a.paidOn);
    if (byDay != 0) return byDay;
    return (b.createdAt ?? b.paidOn).compareTo(a.createdAt ?? a.paidOn);
  });
  return list;
}

BalanceStatus balanceStatus(int totalCents, int paidCents) {
  if (totalCents == 0 && paidCents == 0) return BalanceStatus.empty;
  if (paidCents > totalCents) return BalanceStatus.overpaid;
  if (paidCents == totalCents) return BalanceStatus.paid;
  if (paidCents > 0) return BalanceStatus.partial;
  return BalanceStatus.unpaid;
}

class OrderLine {
  const OrderLine({
    required this.productId,
    required this.label,
    required this.quantity,
    required this.unitPriceCents,
    required this.amountCents,
  });

  final String productId;
  final String label;
  final int quantity;
  final int unitPriceCents;
  final int amountCents;
}

class BuyerBreakdown {
  const BuyerBreakdown({
    required this.order,
    required this.lines,
    required this.totalCents,
    required this.paidCents,
    required this.dueCents,
    required this.status,
  });

  final OrderRecord order;
  final List<OrderLine> lines;
  final int totalCents;
  final int paidCents;

  /// What is left to pay; negative when the buyer paid too much.
  final int dueCents;
  final BalanceStatus status;

  String get orderId => order.id;
  String get buyerName => order.buyerName;
  String get fulfilment => order.fulfilment;
}

/// One order: its lines in the catalogue's order, total, paid and due.
BuyerBreakdown buyerBreakdown(
  OrderRecord order,
  Map<String, OrderProduct> byId,
) {
  final withProduct = <(OrderProduct, OrderLine)>[];
  for (final item in order.items) {
    final p = byId[item.productId];
    if (item.quantity <= 0 || p == null) continue;
    withProduct.add((
      p,
      OrderLine(
        productId: p.id,
        label: productLabel(p),
        quantity: item.quantity,
        unitPriceCents: p.unitPriceCents,
        amountCents: item.quantity * p.unitPriceCents,
      ),
    ));
  }
  withProduct.sort((a, b) {
    final byOrder = a.$1.displayOrder.compareTo(b.$1.displayOrder);
    if (byOrder != 0) return byOrder;
    return _compareLabels(a.$2.label, b.$2.label);
  });
  final lines = [for (final x in withProduct) x.$2];
  final totalCents = lines.fold(0, (s, l) => s + l.amountCents);
  final paidCents = orderPaidCents(order.payments);
  return BuyerBreakdown(
    order: order,
    lines: lines,
    totalCents: totalCents,
    paidCents: paidCents,
    dueCents: totalCents - paidCents,
    status: balanceStatus(totalCents, paidCents),
  );
}

class ProductTotal {
  const ProductTotal({
    required this.productId,
    required this.label,
    required this.category,
    required this.supplier,
    required this.quantity,
    required this.amountCents,
  });

  final String productId;
  final String label;
  final String category;
  final String? supplier;
  final int quantity;
  final int amountCents;
}

class SupplierTotal {
  SupplierTotal({required this.supplier});

  /// null: products without a supplier.
  final String? supplier;
  int quantity = 0;
  int amountCents = 0;
  final products = <ProductTotal>[];
}

class SaleSummary {
  const SaleSummary({
    required this.orderCount,
    required this.totalCents,
    required this.paidCents,
    required this.dueCents,
    required this.overpaidCents,
    required this.paidCount,
    required this.owingCount,
    required this.byMethod,
    required this.buyers,
    required this.products,
    required this.suppliers,
  });

  final int orderCount;
  final int totalCents;
  final int paidCents;

  /// Sum of what buyers still owe (overpayments don't offset it).
  final int dueCents;

  /// Sum of what buyers paid too much.
  final int overpaidCents;

  /// Orders fully paid (or overpaid).
  final int paidCount;

  /// Orders with something left to pay.
  final int owingCount;
  final Map<String, int> byMethod;

  /// Every order, buyers in alphabetical order.
  final List<BuyerBreakdown> buyers;

  /// Ordered products only (quantity > 0), in the catalogue's order.
  final List<ProductTotal> products;

  /// The same products by supplier, for the orders to place.
  final List<SupplierTotal> suppliers;
}

SaleSummary saleSummary(
  Iterable<OrderProduct> products,
  Iterable<OrderRecord> orders,
) {
  final byId = productsById(products);
  final orderList = orders.toList();
  final buyers = [for (final o in orderList) buyerBreakdown(o, byId)];
  buyers.sort((a, b) {
    final byName = sortKey(a.buyerName).compareTo(sortKey(b.buyerName));
    if (byName != 0) return byName;
    return a.orderId.compareTo(b.orderId);
  });

  final byMethod = {for (final m in paymentMethods) m: 0};
  for (final o in orderList) {
    for (final p in o.payments) {
      if (byMethod.containsKey(p.method)) {
        byMethod[p.method] = byMethod[p.method]! + p.amountCents;
      }
    }
  }

  final quantities = <String, int>{};
  for (final o in orderList) {
    for (final item in o.items) {
      if (item.quantity > 0 && byId.containsKey(item.productId)) {
        quantities[item.productId] =
            (quantities[item.productId] ?? 0) + item.quantity;
      }
    }
  }
  final productTotals = <ProductTotal>[];
  for (final p in sortProducts(products)) {
    final quantity = quantities[p.id] ?? 0;
    if (quantity <= 0) continue;
    final supplier = p.supplier?.trim() ?? '';
    productTotals.add(
      ProductTotal(
        productId: p.id,
        label: productLabel(p),
        category: p.category,
        supplier: supplier.isEmpty ? null : supplier,
        quantity: quantity,
        amountCents: quantity * p.unitPriceCents,
      ),
    );
  }

  final suppliers = <SupplierTotal>[];
  for (final t in productTotals) {
    final existing = suppliers.where((s) => s.supplier == t.supplier);
    final s = existing.isNotEmpty
        ? existing.first
        : (() {
            final created = SupplierTotal(supplier: t.supplier);
            suppliers.add(created);
            return created;
          })();
    s.quantity += t.quantity;
    s.amountCents += t.amountCents;
    s.products.add(t);
  }

  return SaleSummary(
    orderCount: orderList.length,
    totalCents: buyers.fold(0, (s, b) => s + b.totalCents),
    paidCents: buyers.fold(0, (s, b) => s + b.paidCents),
    dueCents: buyers.fold(0, (s, b) => s + (b.dueCents > 0 ? b.dueCents : 0)),
    overpaidCents: buyers.fold(
      0,
      (s, b) => s + (b.dueCents < 0 ? -b.dueCents : 0),
    ),
    paidCount: buyers.where((b) => b.status.isSettled).length,
    owingCount: buyers.where((b) => b.status.isOwing).length,
    byMethod: byMethod,
    buyers: buyers,
    products: productTotals,
    suppliers: suppliers,
  );
}

// ---------------------------------------------------------------------------
// Phones (same rule as public.normalize_order_phone)

/// « 06 12 34 56 78 » → « +33612345678 » (the form SMS need); « 0041… » →
/// « +41… »; anything else without spaces; empty → null.
String? normalizePhone(String? input) {
  final d = (input ?? '').replaceAll(RegExp(r'[\s.\-()/]'), '');
  if (d.isEmpty) return null;
  if (RegExp(r'^0[1-9]\d{8}$').hasMatch(d)) return '+33${d.substring(1)}';
  if (RegExp(r'^0033[1-9]\d{8}$').hasMatch(d)) return '+${d.substring(2)}';
  if (RegExp(r'^00[1-9]\d{6,14}$').hasMatch(d)) return '+${d.substring(2)}';
  return d;
}

/// True for a number an SMS can reach once normalised.
bool isValidPhone(String input) {
  final n = normalizePhone(input);
  return n != null && RegExp(r'^\+[1-9]\d{6,14}$').hasMatch(n);
}

/// How a buyer's number is shown and stored (same rule as the admin's
/// formatPhone): a French number in any usual form (« 0677565184 »,
/// « +33 6 77 56 51 84 », « 0033… ») becomes « 06 77 56 51 84 ». A French
/// number still being typed (« 06775 ») gets its pairs (« 06 77 5 »);
/// anything else, foreign numbers included, is kept as written.
String formatPhone(String input) {
  final d = input.replaceAll(RegExp(r'[\s.\-()/]'), '');
  String pairs(String digits) =>
      digits.replaceAllMapped(RegExp(r'(\d{2})(?=\d)'), (m) => '${m[1]} ');
  if (RegExp(r'^0([1-9]\d{0,8})?$').hasMatch(d)) return pairs(d);
  final intl = RegExp(r'^(?:\+33|0033)0?([1-9]\d{8})$').firstMatch(d);
  if (intl != null) return pairs('0${intl[1]}');
  return input;
}

// ---------------------------------------------------------------------------
// Input checks (the same messages as the admin's parsers)

/// An order as `save_order` takes it.
class OrderInput {
  const OrderInput({
    required this.buyerName,
    this.buyerPhone,
    this.buyerAddress,
    this.soldBy,
    this.fulfilment = 'delivery',
    this.notes,
    required this.items,
  });

  final String buyerName;
  final String? buyerPhone;
  final String? buyerAddress;
  final String? soldBy;
  final String fulfilment;
  final String? notes;

  /// Quantities above 0 only.
  final List<OrderItem> items;

  Map<String, dynamic> orderJson() => {
    'buyer_name': buyerName,
    'buyer_phone': buyerPhone,
    'buyer_address': buyerAddress,
    'sold_by': soldBy,
    'fulfilment': fulfilment,
    'notes': notes,
  };

  List<Map<String, dynamic>> itemsJson() => [for (final i in items) i.toJson()];
}

/// Either a value or one error with the field it concerns.
class Parsed<T> {
  const Parsed.ok(this.value) : error = null, field = null;
  const Parsed.fail(this.error, [this.field]) : value = null;

  final T? value;
  final String? error;
  final String? field;

  bool get isOk => error == null;
}

String? _text(String? raw, int max, String label, {bool required = false}) {
  final value = raw?.trim() ?? '';
  if (value.isEmpty) return required ? '$label est obligatoire' : null;
  if (value.length > max) return '$label : $max caractères au plus';
  return null;
}

String? _clean(String? raw) {
  final value = raw?.trim() ?? '';
  return value.isEmpty ? null : value;
}

/// One order as typed in the editor. `productIds` are the sale's products:
/// anything else is refused. Quantities of 0 are dropped; at least one
/// product must remain.
Parsed<OrderInput> parseOrderInput({
  required String buyerName,
  String? buyerPhone,
  String? buyerAddress,
  String? soldBy,
  String fulfilment = 'delivery',
  String? notes,
  required Map<String, int> quantities,
  required Set<String> productIds,
}) {
  final nameError = _text(
    buyerName,
    kBuyerNameMax,
    "Le nom de l'acheteur",
    required: true,
  );
  if (nameError != null) return Parsed.fail(nameError, 'buyer_name');
  final phoneError = _text(buyerPhone, kBuyerPhoneMax, 'Le téléphone');
  if (phoneError != null) return Parsed.fail(phoneError, 'buyer_phone');
  final phone = _clean(buyerPhone);
  if (phone != null && !isValidPhone(phone)) {
    return const Parsed.fail(
      "Ce numéro de téléphone n'est pas valide",
      'buyer_phone',
    );
  }
  final addressError = _text(buyerAddress, kBuyerAddressMax, "L'adresse");
  if (addressError != null) return Parsed.fail(addressError, 'buyer_address');
  final notesError = _text(notes, kOrderNotesMax, 'La remarque');
  if (notesError != null) return Parsed.fail(notesError, 'notes');
  if (!fulfilments.contains(fulfilment)) {
    return const Parsed.fail('Mode de remise inconnu', 'fulfilment');
  }
  final items = <OrderItem>[];
  for (final entry in quantities.entries) {
    if (!productIds.contains(entry.key)) {
      return const Parsed.fail('Produit inconnu dans cette vente', 'items');
    }
    if (entry.value < 0 || entry.value > kQuantityMax) {
      return const Parsed.fail(
        'Les quantités vont de 0 à $kQuantityMax',
        'items',
      );
    }
    if (entry.value > 0) {
      items.add(OrderItem(productId: entry.key, quantity: entry.value));
    }
  }
  if (items.isEmpty) {
    return const Parsed.fail('Ajoutez au moins un produit', 'items');
  }
  return Parsed.ok(
    OrderInput(
      buyerName: buyerName.trim(),
      buyerPhone: phone == null ? null : formatPhone(phone),
      buyerAddress: _clean(buyerAddress),
      soldBy: _clean(soldBy),
      fulfilment: fulfilment,
      notes: _clean(notes),
      items: items,
    ),
  );
}

/// A payment as typed in the sheet.
class PaymentInput {
  const PaymentInput({
    required this.amountCents,
    required this.method,
    required this.paidOn,
    this.note,
  });

  final int amountCents;
  final String method;
  final DateTime paidOn;
  final String? note;
}

Parsed<PaymentInput> parsePaymentInput({
  required String amount,
  required String? method,
  required DateTime paidOn,
  String? note,
}) {
  final cents = parseEuros(amount);
  if (cents == null || cents == 0 || cents.abs() > kPriceMaxCents) {
    return const Parsed.fail(
      "Le montant doit être différent de 0 et d'au plus 1 000 €",
      'amount_cents',
    );
  }
  if (method == null || !paymentMethods.contains(method)) {
    return const Parsed.fail('Choisissez un moyen de paiement', 'method');
  }
  final noteError = _text(note, kPaymentNoteMax, 'La remarque');
  if (noteError != null) return Parsed.fail(noteError, 'note');
  return Parsed.ok(
    PaymentInput(
      amountCents: cents,
      method: method,
      paidOn: DateTime(paidOn.year, paidOn.month, paidOn.day),
      note: _clean(note),
    ),
  );
}

/// « 2026-11-13 » for a `date` column.
String isoDay(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';
