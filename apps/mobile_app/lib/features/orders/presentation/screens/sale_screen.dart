import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../domain/order_totals.dart';
import '../../domain/orders_models.dart';
import '../providers/orders_providers.dart';
import '../widgets/orders_widgets.dart';
import 'buyer_screen.dart';
import 'order_editor_screen.dart';

/// The buyers of a sale and what the suppliers must be asked for.
class SaleScreen extends StatelessWidget {
  const SaleScreen({super.key, required this.saleId});

  final String saleId;

  @override
  Widget build(BuildContext context) =>
      OrdersGate(builder: (_) => _SaleBody(saleId: saleId));
}

enum BuyerFilter {
  all('Tous'),
  owing('À régler'),
  paid('Payés'),
  pickup('Retrait');

  const BuyerFilter(this.label);
  final String label;

  bool keeps(BuyerBreakdown b) => switch (this) {
    all => true,
    owing => b.status.isOwing,
    paid => b.status.isSettled,
    pickup => b.fulfilment == 'pickup',
  };
}

/// The buyers [filter] keeps whose name contains [query] (accents and case
/// aside).
List<BuyerBreakdown> filterBuyers(
  List<BuyerBreakdown> buyers,
  BuyerFilter filter,
  String query,
) {
  final key = sortKey(query.trim());
  return [
    for (final b in buyers)
      if (filter.keeps(b) &&
          (key.isEmpty || sortKey(b.buyerName).contains(key)))
        b,
  ];
}

class _SaleBody extends ConsumerStatefulWidget {
  const _SaleBody({required this.saleId});
  final String saleId;

  @override
  ConsumerState<_SaleBody> createState() => _SaleBodyState();
}

class _SaleBodyState extends ConsumerState<_SaleBody> {
  BuyerFilter _filter = BuyerFilter.all;
  String _query = '';
  bool _addingToRound = false;

  Future<void> _refresh() =>
      ref.refresh(saleDetailProvider(widget.saleId).future);

  Future<void> _newOrder(SaleDetail detail) async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => OrderEditorScreen(detail: detail)),
    );
  }

  void _openBuyer(String orderId) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BuyerScreen(saleId: widget.saleId, orderId: orderId),
      ),
    );
  }

  Future<void> _addToRound(SaleDetail detail) async {
    final candidates = [
      for (final o in detail.orders)
        if (o.isDelivery && !o.isInRound && !o.isErased) o,
    ];
    final withAddress = candidates
        .where((o) => (o.buyerAddress ?? '').trim().isNotEmpty)
        .length;
    final without = candidates.length - withAddress;
    if (withAddress == 0) {
      showOrdersSnack(
        context,
        without == 0
            ? 'Tous les acheteurs à livrer sont déjà dans la tournée.'
            : '${countOf(without, 'acheteur')} à livrer sans adresse : '
                  'ajoutez leur adresse d’abord.',
      );
      return;
    }
    final ok = await showConfirmSheet(
      context,
      title: 'Ajouter à la tournée',
      message:
          '${countOf(withAddress, 'acheteur')} en livraison, pas encore dans '
          'une tournée, deviendront des arrêts de votre tournée en cours (ou '
          'd’une nouvelle).'
          '${without > 0 ? ' ${countOf(without, 'acheteur')} sans adresse '
                    'resteront en dehors.' : ''}',
      confirmLabel: 'Ajouter ${countOf(withAddress, 'acheteur')}',
    );
    if (!ok || !mounted) return;
    setState(() => _addingToRound = true);
    DeliveryAddResult result;
    try {
      result = await ref
          .read(ordersServiceProvider)
          .addSaleOrdersToDelivery(widget.saleId);
    } catch (_) {
      if (mounted) {
        setState(() => _addingToRound = false);
        showOrdersSnack(context, 'La tournée n’a pas pu être mise à jour.');
      }
      return;
    }
    ref.invalidate(saleDetailProvider(widget.saleId));
    if (!mounted) return;
    setState(() => _addingToRound = false);
    await _showRoundResult(result);
  }

  Future<void> _showRoundResult(DeliveryAddResult result) {
    final s = Theme.of(context).colorScheme;
    return showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (sheet) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Tournée mise à jour',
                style: AppFonts.display(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: s.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${result.added} ${result.added == 1 ? 'ajouté' : 'ajoutés'} · '
                '${result.withoutAddress} sans adresse',
                style: AppFonts.sans(
                  fontSize: 16,
                  height: 1.5,
                  color: s.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  Navigator.of(sheet).pop();
                  context.push('/driver-tracking');
                },
                icon: const Icon(Icons.local_shipping_outlined),
                label: const Text('Ouvrir la tournée'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(sheet).pop(),
                child: const Text('Fermer'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(saleDetailProvider(widget.saleId));
    final s = Theme.of(context).colorScheme;
    final detail = detailAsync.value;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          tooltip: 'Retour',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(detail?.sale.title ?? 'Vente'),
        actions: [
          if (detail != null)
            _addingToRound
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : IconButton(
                    tooltip: 'Ajouter à la tournée',
                    icon: const Icon(Icons.local_shipping_outlined),
                    onPressed: () => _addToRound(detail),
                  ),
        ],
      ),
      floatingActionButton: detail == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _newOrder(detail),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Ajouter une commande'),
            ),
      body: switch (detailAsync) {
        AsyncData(value: final d) => _content(d, s),
        AsyncError() => RefreshIndicator(
          onRefresh: _refresh,
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            children: [
              OrdersMessage(
                icon: Icons.cloud_off_rounded,
                title: 'Impossible de charger la vente',
                text: 'Vérifiez la connexion, puis réessayez.',
                actionLabel: 'Réessayer',
                onAction: () =>
                    ref.invalidate(saleDetailProvider(widget.saleId)),
              ),
            ],
          ),
        ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }

  Widget _content(SaleDetail detail, ColorScheme s) {
    final summary = saleSummary(detail.products, detail.orders);
    final sale = detail.sale;
    final dates = <String>[
      if (sale.orderDeadline != null)
        'Commandes jusqu’au ${shortDay(sale.orderDeadline!)}',
      if (sale.deliveryDate != null)
        'Livraison le ${shortDay(sale.deliveryDate!)}',
    ];
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(
              kScreenHorizontalPadding,
              4,
              kScreenHorizontalPadding,
              12,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (dates.isNotEmpty) ...[
                  Text(
                    dates.join(' · '),
                    style: AppFonts.sans(
                      fontSize: 14,
                      color: s.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                _Figures(summary: summary),
              ],
            ),
          ),
          TabBar(
            tabs: [
              Tab(text: 'Acheteurs (${summary.orderCount})'),
              const Tab(text: 'Totaux'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _BuyersTab(
                  summary: summary,
                  filter: _filter,
                  query: _query,
                  onFilter: (f) => setState(() => _filter = f),
                  onQuery: (q) => setState(() => _query = q),
                  onRefresh: _refresh,
                  onOpen: _openBuyer,
                  onAdd: () => _newOrder(detail),
                ),
                _TotalsTab(summary: summary, onRefresh: _refresh),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Total commandé, Encaissé, Reste à encaisser, N à régler.
class _Figures extends StatelessWidget {
  const _Figures({required this.summary});
  final SaleSummary summary;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: FigureTile(
                label: 'Total commandé',
                value: formatEuros(summary.totalCents),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FigureTile(
                label: 'Encaissé',
                value: formatEuros(summary.paidCents),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: FigureTile(
                label: 'Reste à encaisser',
                value: formatEuros(summary.dueCents),
                accent: summary.dueCents > 0,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FigureTile(
                label: 'À régler',
                value: countOf(summary.owingCount, 'acheteur'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _BuyersTab extends StatelessWidget {
  const _BuyersTab({
    required this.summary,
    required this.filter,
    required this.query,
    required this.onFilter,
    required this.onQuery,
    required this.onRefresh,
    required this.onOpen,
    required this.onAdd,
  });

  final SaleSummary summary;
  final BuyerFilter filter;
  final String query;
  final ValueChanged<BuyerFilter> onFilter;
  final ValueChanged<String> onQuery;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onOpen;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final shown = filterBuyers(summary.buyers, filter, query);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          kScreenHorizontalPadding,
          12,
          kScreenHorizontalPadding,
          96,
        ),
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Rechercher un acheteur',
              prefixIcon: Icon(Icons.search_rounded),
              isDense: true,
            ),
            onChanged: onQuery,
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final f in BuyerFilter.values)
                ChoiceChip(
                  label: Text(f.label),
                  selected: filter == f,
                  onSelected: (_) => onFilter(f),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (summary.buyers.isEmpty)
            OrdersMessage(
              icon: Icons.shopping_basket_outlined,
              title: 'Aucune commande',
              text: 'Saisissez la première commande de cette vente.',
              actionLabel: 'Ajouter une commande',
              onAction: onAdd,
            )
          else if (shown.isEmpty)
            const OrdersMessage(
              icon: Icons.search_off_rounded,
              title: 'Aucun acheteur ne correspond',
              text: 'Changez le filtre ou la recherche.',
            )
          else
            for (final b in shown) ...[
              _BuyerRow(breakdown: b, onTap: () => onOpen(b.orderId)),
              const SizedBox(height: 10),
            ],
        ],
      ),
    );
  }
}

class _BuyerRow extends StatelessWidget {
  const _BuyerRow({required this.breakdown, required this.onTap});

  final BuyerBreakdown breakdown;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final o = breakdown.order;
    final settled = breakdown.status.isSettled;
    final rest = breakdown.dueCents > 0
        ? 'Reste ${formatEuros(breakdown.dueCents)}'
        : null;
    return StageCard(
      onTap: onTap,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      semanticLabel: [
        o.buyerName,
        fulfilmentLabel(o.fulfilment),
        formatEuros(breakdown.totalCents),
        settled ? breakdown.status.label : (rest ?? breakdown.status.label),
        if (o.isHandedOver) 'remis' else if (o.isInRound) 'dans la tournée',
      ].join(', '),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  o.buyerName,
                  style: AppFonts.sans(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: s.onSurface,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    OrdersPill(
                      fulfilmentLabel(o.fulfilment),
                      icon: o.isDelivery
                          ? Icons.local_shipping_outlined
                          : Icons.storefront_outlined,
                    ),
                    if (o.isHandedOver)
                      OrdersPill(
                        'Remis',
                        icon: Icons.check_rounded,
                        color: s.primary,
                      )
                    else if (o.isInRound)
                      const OrdersPill(
                        'Dans la tournée',
                        icon: Icons.route_outlined,
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                formatEuros(breakdown.totalCents),
                style: AppFonts.sans(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: s.onSurface,
                ),
              ),
              const SizedBox(height: 6),
              if (settled)
                BalancePill(breakdown.status)
              else
                Text(
                  rest ?? breakdown.status.label,
                  style: AppFonts.sans(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: s.tertiary,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Per supplier, then per product: quantity and amount; then what came in
/// by payment method.
class _TotalsTab extends StatelessWidget {
  const _TotalsTab({required this.summary, required this.onRefresh});

  final SaleSummary summary;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(
          kScreenHorizontalPadding,
          0,
          kScreenHorizontalPadding,
          96,
        ),
        children: [
          if (summary.products.isEmpty)
            const OrdersMessage(
              icon: Icons.inventory_2_outlined,
              title: 'Rien à commander pour l’instant',
              text:
                  'Les totaux par fournisseur apparaîtront avec les '
                  'premières commandes.',
            ),
          for (final sup in summary.suppliers) ...[
            OrdersSectionTitle(
              sup.supplier ?? 'Sans fournisseur',
              trailing: Text(
                formatEuros(sup.amountCents),
                style: AppFonts.sans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: s.onSurfaceVariant,
                ),
              ),
            ),
            for (final p in sup.products)
              _TotalRow(
                label: p.label,
                quantity: p.quantity,
                amount: formatEuros(p.amountCents),
              ),
          ],
          if (summary.products.isNotEmpty) ...[
            const OrdersSectionTitle('Encaissements'),
            for (final m in paymentMethods)
              AmountRow(
                label: paymentMethodLabel(m),
                amount: formatEuros(summary.byMethod[m] ?? 0),
              ),
            const Divider(height: 20),
            AmountRow(
              label: 'Encaissé',
              amount: formatEuros(summary.paidCents),
              strong: true,
            ),
          ],
        ],
      ),
    );
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow({
    required this.label,
    required this.quantity,
    required this.amount,
  });

  final String label;
  final int quantity;
  final String amount;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Semantics(
      label: '$label : $quantity, $amount',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            border: Border(bottom: BorderSide(color: s.outlineVariant)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  label,
                  style: AppFonts.sans(fontSize: 16, color: s.onSurface),
                ),
              ),
              SizedBox(
                width: 48,
                child: Text(
                  '× $quantity',
                  textAlign: TextAlign.end,
                  style: AppFonts.sans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: s.primary,
                  ),
                ),
              ),
              SizedBox(
                width: 92,
                child: Text(
                  amount,
                  textAlign: TextAlign.end,
                  style: AppFonts.sans(fontSize: 16, color: s.onSurface),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
