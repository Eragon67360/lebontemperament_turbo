import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../reports/presentation/widgets/report_widgets.dart';
import '../../domain/order_totals.dart';
import '../../domain/orders_models.dart';
import '../providers/orders_providers.dart';
import '../widgets/orders_widgets.dart';

/// « Commandes » (superadmins): the sales, the current one first. Usually
/// there is one; the archived ones follow.
class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) =>
      OrdersGate(builder: (_) => const _SalesList());
}

class _SalesList extends ConsumerWidget {
  const _SalesList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sales = ref.watch(salesListProvider);
    return ReportsPage(
      title: 'Commandes',
      onRefresh: () => ref.refresh(salesListProvider.future),
      slivers: [
        switch (sales) {
          AsyncData(value: final list) when list.isEmpty =>
            const SliverFillRemaining(
              hasScrollBody: false,
              child: OrdersMessage(
                icon: Icons.shopping_basket_outlined,
                title: 'Aucune vente',
                text:
                    'Les ventes et leur catalogue se créent depuis '
                    'l’administration. Les commandes se saisissent ici.',
              ),
            ),
          AsyncData(value: final list) => SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              kScreenHorizontalPadding,
              8,
              kScreenHorizontalPadding,
              kFloatingNavBarBottomPadding,
            ),
            sliver: SliverList.separated(
              itemCount: list.length,
              itemBuilder: (context, i) => _SaleCard(
                overview: list[i],
                onTap: () => context.push('/orders/${list[i].sale.id}'),
              ),
              separatorBuilder: (_, _) => const SizedBox(height: 12),
            ),
          ),
          AsyncError() => SliverFillRemaining(
            hasScrollBody: false,
            child: OrdersMessage(
              icon: Icons.cloud_off_rounded,
              title: 'Impossible de charger les ventes',
              text: 'Vérifiez la connexion, puis réessayez.',
              actionLabel: 'Réessayer',
              onAction: () => ref.invalidate(salesListProvider),
            ),
          ),
          _ => const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(child: CircularProgressIndicator()),
          ),
        },
      ],
    );
  }
}

class _SaleCard extends StatelessWidget {
  const _SaleCard({required this.overview, required this.onTap});

  final SaleOverview overview;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final sale = overview.sale;
    final dates = <String>[
      if (sale.orderDeadline != null)
        'Commandes jusqu’au ${shortDay(sale.orderDeadline!)}',
      if (sale.deliveryDate != null)
        'Livraison le ${shortDay(sale.deliveryDate!)}',
    ];
    final owed = overview.orderCount == 0
        ? null
        : overview.dueCents > 0
        ? 'Reste à encaisser ${formatEuros(overview.dueCents)}'
        : 'Tout est encaissé';
    return StageCard(
      onTap: onTap,
      semanticLabel: [
        sale.title,
        if (sale.isArchived) 'archivée',
        ...dates,
        countOf(overview.orderCount, 'commande'),
        ?owed,
      ].join(', '),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  sale.title,
                  style: AppFonts.display(
                    fontSize: 19,
                    fontWeight: FontWeight.w600,
                    color: s.onSurface,
                  ),
                ),
              ),
              if (sale.isArchived) ...[
                const SizedBox(width: 8),
                const OrdersPill('Archivée'),
              ],
            ],
          ),
          if (dates.isNotEmpty) ...[
            const SizedBox(height: 8),
            for (final d in dates)
              Text(
                d,
                style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
              ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.people_outline_rounded, size: 18, color: s.primary),
              const SizedBox(width: 6),
              Text(
                countOf(overview.orderCount, 'commande'),
                style: AppFonts.sans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: s.onSurface,
                ),
              ),
            ],
          ),
          if (owed != null) ...[
            const SizedBox(height: 4),
            Text(
              owed,
              style: AppFonts.sans(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: overview.dueCents > 0 ? s.tertiary : s.primary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
