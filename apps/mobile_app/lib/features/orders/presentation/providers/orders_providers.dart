import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../data/models/member.dart';
import '../../../../data/providers/data_providers.dart';
import '../../data/orders_service.dart';
import '../../domain/orders_models.dart';

final ordersServiceProvider = Provider<OrdersService>(
  (ref) => SupabaseOrdersService(),
);

/// « Commandes »: every sale, the current ones first.
final salesListProvider = FutureProvider.autoDispose<List<SaleOverview>>(
  (ref) => ref.watch(ordersServiceProvider).listSales(),
);

/// Members who can be « Vendu par » (the directory, those with an id).
final orderMembersProvider = FutureProvider.autoDispose<List<Member>>((
  ref,
) async {
  final members = await ref.watch(membersProvider.future);
  return [
    for (final m in members)
      if (m.id != null) m,
  ];
});

/// One sale with its catalogue, orders and the names of « Vendu par ». The
/// directory is read only when an order names a seller, and a failed read
/// leaves the names out rather than the sale.
final saleDetailProvider = FutureProvider.autoDispose
    .family<SaleDetail, String>((ref, saleId) async {
      final detail = await ref.watch(ordersServiceProvider).loadSale(saleId);
      if (!detail.orders.any((o) => o.soldBy != null)) return detail;
      Map<String, String> names = const {};
      try {
        final members = await ref.watch(orderMembersProvider.future);
        names = {for (final m in members) m.id!: m.displayName};
      } catch (_) {}
      return SaleDetail(
        sale: detail.sale,
        products: detail.products,
        orders: detail.orders,
        memberNames: names,
      );
    });
