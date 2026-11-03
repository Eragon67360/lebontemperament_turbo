import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../reports/presentation/widgets/report_widgets.dart';
import '../../domain/order_totals.dart';
import '../../domain/orders_models.dart';
import '../providers/orders_providers.dart';
import '../widgets/orders_widgets.dart';
import 'order_editor_screen.dart';
import 'payment_sheet.dart';

/// One buyer: what they ordered, what they paid, and the actions on their
/// order. Reads the sale so every change shows at once.
class BuyerScreen extends StatelessWidget {
  const BuyerScreen({super.key, required this.saleId, required this.orderId});

  final String saleId;
  final String orderId;

  @override
  Widget build(BuildContext context) => OrdersGate(
    builder: (_) => _BuyerBody(saleId: saleId, orderId: orderId),
  );
}

class _BuyerBody extends ConsumerWidget {
  const _BuyerBody({required this.saleId, required this.orderId});

  final String saleId;
  final String orderId;

  Future<void> _refresh(WidgetRef ref) =>
      ref.refresh(saleDetailProvider(saleId).future);

  Future<void> _addPayment(
    BuildContext context,
    WidgetRef ref,
    BuyerBreakdown b,
  ) async {
    final input = await showPaymentSheet(context, dueCents: b.dueCents);
    if (input == null || !context.mounted) return;
    try {
      await ref
          .read(ordersServiceProvider)
          .addPayment(orderId: orderId, input: input);
      ref.invalidate(saleDetailProvider(saleId));
      ref.invalidate(salesListProvider);
      if (context.mounted) showOrdersSnack(context, 'Paiement enregistré');
    } catch (_) {
      if (context.mounted) {
        showOrdersSnack(context, 'Le paiement n’a pas pu être enregistré.');
      }
    }
  }

  Future<void> _deletePayment(
    BuildContext context,
    WidgetRef ref,
    OrderPayment p,
  ) async {
    final ok = await showConfirmSheet(
      context,
      title: 'Supprimer ce paiement ?',
      message:
          '${formatEuros(p.amountCents)} en ${paymentMethodLabel(p.method).toLowerCase()} '
          'le ${shortDay(p.paidOn)}. Le reste à payer sera recalculé.',
      confirmLabel: 'Supprimer',
      destructive: true,
    );
    if (!ok || !context.mounted) return;
    try {
      await ref.read(ordersServiceProvider).deletePayment(p.id);
      ref.invalidate(saleDetailProvider(saleId));
      ref.invalidate(salesListProvider);
      if (context.mounted) showOrdersSnack(context, 'Paiement supprimé');
    } catch (_) {
      if (context.mounted) {
        showOrdersSnack(context, 'Le paiement n’a pas pu être supprimé.');
      }
    }
  }

  Future<void> _toggleHandedOver(
    BuildContext context,
    WidgetRef ref,
    OrderRecord order,
  ) async {
    try {
      await ref
          .read(ordersServiceProvider)
          .setHandedOver(order.id, handedOver: !order.isHandedOver);
      ref.invalidate(saleDetailProvider(saleId));
      if (context.mounted) {
        showOrdersSnack(
          context,
          order.isHandedOver ? 'Remise annulée' : 'Commande marquée remise',
        );
      }
    } catch (_) {
      if (context.mounted) {
        showOrdersSnack(
          context,
          'La modification n’a pas pu être enregistrée.',
        );
      }
    }
  }

  /// « Ajouter à la tournée » for this buyer alone: into the current round
  /// (or a new one), the others of the sale left for another day.
  Future<void> _addToRound(
    BuildContext context,
    WidgetRef ref,
    OrderRecord order,
  ) async {
    final ok = await showConfirmSheet(
      context,
      title: 'Ajouter à la tournée',
      message:
          '${order.buyerName} deviendra un arrêt de votre tournée en cours '
          '(ou d’une nouvelle), avec son adresse et son téléphone. Les autres '
          'acheteurs ne sont pas ajoutés.',
      confirmLabel: 'Ajouter ${order.buyerName}',
    );
    if (!ok || !context.mounted) return;
    try {
      final result = await ref.read(ordersServiceProvider).addOrdersToDelivery(
        saleId,
        [order.id],
      );
      ref.invalidate(saleDetailProvider(saleId));
      if (context.mounted) {
        showOrdersSnack(
          context,
          result.added == 1
              ? 'Ajouté à la tournée'
              : 'Déjà dans une tournée : rien n’a été ajouté.',
        );
      }
    } catch (_) {
      ref.invalidate(saleDetailProvider(saleId));
      if (context.mounted) {
        showOrdersSnack(context, 'La tournée n’a pas pu être mise à jour.');
      }
    }
  }

  Future<void> _edit(
    BuildContext context,
    WidgetRef ref,
    SaleDetail detail,
    OrderRecord order,
  ) async {
    await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => OrderEditorScreen(
          detail: detail,
          existing: order,
          soldByName: detail.soldByName(order),
        ),
      ),
    );
  }

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    OrderRecord order,
  ) async {
    final ok = await showConfirmSheet(
      context,
      title: 'Supprimer la commande ?',
      message:
          'La commande de ${order.buyerName} et ses paiements seront '
          'supprimés. Cette action ne peut pas être annulée.',
      confirmLabel: 'Supprimer la commande',
      destructive: true,
    );
    if (!ok || !context.mounted) return;
    try {
      await ref.read(ordersServiceProvider).deleteOrder(order.id);
      ref.invalidate(saleDetailProvider(saleId));
      ref.invalidate(salesListProvider);
      if (context.mounted) Navigator.of(context).maybePop();
    } catch (_) {
      if (context.mounted) {
        showOrdersSnack(context, 'La commande n’a pas pu être supprimée.');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(saleDetailProvider(saleId));
    final s = Theme.of(context).colorScheme;

    return switch (detailAsync) {
      AsyncData(value: final detail) => _page(context, ref, detail, s),
      AsyncError() => ReportsPage(
        title: 'Acheteur',
        onRefresh: () => _refresh(ref),
        slivers: [
          SliverFillRemaining(
            hasScrollBody: false,
            child: OrdersMessage(
              icon: Icons.cloud_off_rounded,
              title: 'Impossible de charger la commande',
              text: 'Vérifiez la connexion, puis réessayez.',
              actionLabel: 'Réessayer',
              onAction: () => ref.invalidate(saleDetailProvider(saleId)),
            ),
          ),
        ],
      ),
      _ => const ReportsPage(
        title: 'Acheteur',
        slivers: [
          SliverFillRemaining(
            hasScrollBody: false,
            child: Center(child: CircularProgressIndicator()),
          ),
        ],
      ),
    };
  }

  Widget _page(
    BuildContext context,
    WidgetRef ref,
    SaleDetail detail,
    ColorScheme s,
  ) {
    final order = detail.orderById(orderId);
    if (order == null) {
      return ReportsPage(
        title: 'Acheteur',
        slivers: const [
          SliverFillRemaining(
            hasScrollBody: false,
            child: OrdersMessage(
              icon: Icons.person_off_outlined,
              title: 'Commande introuvable',
              text: 'Elle a peut-être été supprimée entre-temps.',
            ),
          ),
        ],
      );
    }
    final b = buyerBreakdown(order, productsById(detail.products));
    final soldBy = detail.soldByName(order);

    return ReportsPage(
      title: order.buyerName,
      onRefresh: () => _refresh(ref),
      actions: [
        PopupMenuButton<String>(
          tooltip: 'Plus d’actions',
          onSelected: (v) => switch (v) {
            'edit' => _edit(context, ref, detail, order),
            'round' => _addToRound(context, ref, order),
            'delete' => _delete(context, ref, order),
            _ => null,
          },
          itemBuilder: (_) => [
            const PopupMenuItem(
              value: 'edit',
              child: ListTile(
                leading: Icon(Icons.edit_outlined),
                title: Text('Modifier'),
              ),
            ),
            if (order.canJoinRound)
              const PopupMenuItem(
                value: 'round',
                child: ListTile(
                  leading: Icon(Icons.local_shipping_outlined),
                  title: Text('Ajouter à la tournée'),
                ),
              ),
            const PopupMenuItem(
              value: 'delete',
              child: ListTile(
                leading: Icon(Icons.delete_outline_rounded),
                title: Text('Supprimer'),
              ),
            ),
          ],
        ),
      ],
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(
            kScreenHorizontalPadding,
            4,
            kScreenHorizontalPadding,
            32,
          ),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              _BuyerCard(order: order, status: b.status, soldBy: soldBy),
              const OrdersSectionTitle('Commande'),
              for (final line in b.lines)
                AmountRow(
                  label: line.label,
                  detail:
                      '${line.quantity} × ${formatEuros(line.unitPriceCents)}',
                  amount: formatEuros(line.amountCents),
                ),
              if (b.lines.isEmpty)
                Text(
                  'Aucun produit sur cette commande.',
                  style: AppFonts.sans(fontSize: 15, color: s.onSurfaceVariant),
                ),
              const Divider(height: 20),
              AmountRow(
                label: 'Total',
                amount: formatEuros(b.totalCents),
                strong: true,
              ),
              AmountRow(label: 'Payé', amount: formatEuros(b.paidCents)),
              AmountRow(
                label: b.dueCents < 0 ? 'Trop perçu' : 'Reste à payer',
                amount: formatEuros(b.dueCents.abs()),
                strong: true,
              ),
              const OrdersSectionTitle('Paiements'),
              if (order.payments.isEmpty)
                Text(
                  'Aucun paiement enregistré.',
                  style: AppFonts.sans(fontSize: 15, color: s.onSurfaceVariant),
                ),
              for (final p in paymentsNewestFirst(order.payments))
                _PaymentTile(
                  payment: p,
                  onDelete: () => _deletePayment(context, ref, p),
                ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => _addPayment(context, ref, b),
                icon: const Icon(Icons.payments_outlined),
                label: const Text('Enregistrer un paiement'),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: () => _toggleHandedOver(context, ref, order),
                icon: Icon(
                  order.isHandedOver
                      ? Icons.undo_rounded
                      : Icons.check_circle_outline_rounded,
                ),
                label: Text(
                  order.isHandedOver
                      ? 'Annuler la remise'
                      : 'Marquer comme remis',
                ),
              ),
            ]),
          ),
        ),
      ],
    );
  }
}

/// How the buyer gets their goods, the balance, and how to reach them.
class _BuyerCard extends StatelessWidget {
  const _BuyerCard({
    required this.order,
    required this.status,
    required this.soldBy,
  });

  final OrderRecord order;
  final BalanceStatus status;
  final String? soldBy;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    Widget line(IconData icon, String text) => Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: s.onSurfaceVariant),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: AppFonts.sans(fontSize: 15, color: s.onSurface),
            ),
          ),
        ],
      ),
    );
    return StageCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OrdersPill(
                fulfilmentLabel(order.fulfilment),
                icon: order.isDelivery
                    ? Icons.local_shipping_outlined
                    : Icons.storefront_outlined,
              ),
              BalancePill(status),
              if (order.isHandedOver)
                OrdersPill('Remis', icon: Icons.check_rounded, color: s.primary)
              else if (order.isInRound)
                OrdersPill('Dans la tournée', icon: Icons.route_outlined),
            ],
          ),
          if (order.isErased)
            line(
              Icons.privacy_tip_outlined,
              'Coordonnées effacées (30 jours après la livraison).',
            ),
          if (order.buyerPhone != null)
            line(Icons.phone_outlined, order.buyerPhone!),
          if (order.buyerAddress != null)
            line(Icons.place_outlined, order.buyerAddress!),
          if (soldBy != null)
            line(Icons.person_outline_rounded, 'Vendu par $soldBy'),
          if (order.notes != null) line(Icons.notes_rounded, order.notes!),
        ],
      ),
    );
  }
}

/// One payment: the method and day, the amount, a way to remove it (menu
/// button, or a swipe to the left).
class _PaymentTile extends StatelessWidget {
  const _PaymentTile({required this.payment, required this.onDelete});

  final OrderPayment payment;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final label = paymentMethodLabel(payment.method);
    final day = shortDay(payment.paidOn);
    return Dismissible(
      key: ValueKey(payment.id),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        onDelete();
        return false;
      },
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: s.errorContainer,
        child: Icon(Icons.delete_outline_rounded, color: s.onErrorContainer),
      ),
      child: Container(
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: s.outlineVariant)),
        ),
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            Icon(
              switch (payment.method) {
                'cash' => Icons.payments_outlined,
                'cheque' => Icons.receipt_long_outlined,
                _ => Icons.account_balance_outlined,
              },
              size: 20,
              color: s.onSurfaceVariant,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$label · $day',
                    style: AppFonts.sans(fontSize: 16, color: s.onSurface),
                  ),
                  if (payment.note != null)
                    Text(
                      payment.note!,
                      style: AppFonts.sans(
                        fontSize: 14,
                        color: s.onSurfaceVariant,
                      ),
                    ),
                ],
              ),
            ),
            Text(
              formatEuros(payment.amountCents),
              style: AppFonts.sans(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: payment.amountCents < 0 ? s.error : s.onSurface,
              ),
            ),
            IconButton(
              tooltip: 'Supprimer ce paiement',
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline_rounded),
              constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
            ),
          ],
        ),
      ),
    );
  }
}
