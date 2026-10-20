import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../../domain/order_totals.dart';

/// « ven. 13 nov. ».
String shortDay(DateTime d) => '${weekdayShort(d)} ${d.day} ${monthShort(d)}';

/// « 0 commande », « 1 commande », « 12 commandes » (French keeps the
/// singular under 2).
String countOf(int n, String singular, {String? plural}) =>
    '$n ${n < 2 ? singular : (plural ?? '${singular}s')}';

/// Superadmins only: [builder] for them, the driver screens' locked state
/// for everyone else.
class OrdersGate extends ConsumerWidget {
  const OrdersGate({super.key, required this.builder});

  final WidgetBuilder builder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSuperadmin = ref.watch(isSuperadminProvider);
    return isSuperadmin.when(
      data: (ok) => ok
          ? builder(context)
          : const Scaffold(body: OrdersUnauthorizedState()),
      loading: () =>
          const Scaffold(body: Center(child: CircularProgressIndicator())),
      error: (err, _) => Scaffold(body: Center(child: Text('Erreur : $err'))),
    );
  }
}

/// The same locked state as the delivery tracking.
class OrdersUnauthorizedState extends StatelessWidget {
  const OrdersUnauthorizedState({super.key});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline_rounded,
              size: 72,
              color: s.onSurfaceVariant.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 24),
            Text(
              'Accès non autorisé',
              style: AppFonts.sans(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: s.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cette fonctionnalité est réservée aux administrateurs de '
              'l’application.',
              textAlign: TextAlign.center,
              style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.canPop() ? context.pop() : null,
              icon: const Icon(Icons.arrow_back),
              label: const Text('Retour'),
            ),
          ],
        ),
      ),
    );
  }
}

/// A word in a hairline pill, never colour alone: « Payé », « Retrait ».
class OrdersPill extends StatelessWidget {
  const OrdersPill(this.text, {super.key, this.color, this.icon});

  final String text;
  final Color? color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final c = color ?? s.onSurfaceVariant;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: c),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: c),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: AppFonts.sans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: c,
            ),
          ),
        ],
      ),
    );
  }
}

/// The balance of an order as a word: the accent for « Payé », the warm
/// tertiary for what is left, muted otherwise.
class BalancePill extends StatelessWidget {
  const BalancePill(this.status, {super.key});
  final BalanceStatus status;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final color = switch (status) {
      BalanceStatus.paid => s.primary,
      BalanceStatus.unpaid || BalanceStatus.partial => s.tertiary,
      BalanceStatus.overpaid => s.error,
      BalanceStatus.empty => s.onSurfaceVariant,
    };
    return OrdersPill(status.label, color: color);
  }
}

/// A big number with its caption (« Reste à encaisser », « 123,00 € »).
class FigureTile extends StatelessWidget {
  const FigureTile({
    super.key,
    required this.label,
    required this.value,
    this.accent = false,
  });

  final String label;
  final String value;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Semantics(
      label: '$label : $value',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: accent ? s.primaryContainer : null,
            border: Border.all(
              color: accent ? s.primaryContainer : s.outlineVariant,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppFonts.sans(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: accent ? s.onPrimaryContainer : s.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 4),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  value,
                  maxLines: 1,
                  style: AppFonts.display(
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: accent ? s.onPrimaryContainer : s.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A label on the left, an amount on the right, in the running face.
class AmountRow extends StatelessWidget {
  const AmountRow({
    super.key,
    required this.label,
    required this.amount,
    this.detail,
    this.strong = false,
  });

  final String label;
  final String amount;
  final String? detail;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final weight = strong ? FontWeight.w700 : FontWeight.w400;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppFonts.sans(
                    fontSize: 16,
                    fontWeight: weight,
                    color: s.onSurface,
                  ),
                ),
                if (detail != null)
                  Text(
                    detail!,
                    style: AppFonts.sans(
                      fontSize: 14,
                      color: s.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            amount,
            style: AppFonts.sans(
              fontSize: 16,
              fontWeight: weight,
              color: s.onSurface,
            ),
          ),
        ],
      ),
    );
  }
}

/// Centered message for an empty list or an error, with an optional action.
class OrdersMessage extends StatelessWidget {
  const OrdersMessage({
    super.key,
    required this.icon,
    required this.title,
    required this.text,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 48, 28, 24),
      child: Column(
        children: [
          Icon(icon, size: 40, color: s.primary),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: AppFonts.display(
              fontSize: 19,
              fontWeight: FontWeight.w600,
              color: s.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            text,
            textAlign: TextAlign.center,
            style: AppFonts.sans(
              fontSize: 16,
              height: 1.5,
              color: s.onSurfaceVariant,
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 20),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
          ],
        ],
      ),
    );
  }
}

/// A sheet that asks before an action. Resolves true when confirmed.
Future<bool> showConfirmSheet(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  bool destructive = false,
}) async {
  final s = Theme.of(context).colorScheme;
  final result = await showModalBottomSheet<bool>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              title,
              style: AppFonts.display(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: s.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppFonts.sans(
                fontSize: 16,
                height: 1.5,
                color: s.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton(
              style: destructive
                  ? FilledButton.styleFrom(
                      backgroundColor: s.error,
                      foregroundColor: s.onError,
                    )
                  : null,
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(confirmLabel),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Annuler'),
            ),
          ],
        ),
      ),
    ),
  );
  return result ?? false;
}

/// A buyer « Ajouter à la tournée » can add, as its list shows them.
class RoundCandidate {
  const RoundCandidate({
    required this.orderId,
    required this.name,
    required this.address,
  });

  final String orderId;
  final String name;
  final String address;
}

/// « Ajouter à la tournée »: who joins the round. Every buyer is ticked, or
/// only [only] when given (a buyer's own page); « Tous » ticks or unticks
/// them all. Resolves with the ticked order ids in the list's order, or null
/// when cancelled.
Future<List<String>?> showRoundPickerSheet(
  BuildContext context, {
  required List<RoundCandidate> candidates,
  int withoutAddress = 0,
  String? only,
}) {
  final s = Theme.of(context).colorScheme;
  final ticked = <String>{
    if (only != null) only else ...candidates.map((c) => c.orderId),
  };
  return showModalBottomSheet<List<String>>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (sheet) => StatefulBuilder(
      builder: (sheet, setSheet) {
        final count = candidates
            .where((c) => ticked.contains(c.orderId))
            .length;
        final all = count == 0
            ? false
            : count == candidates.length
            ? true
            : null;
        return SafeArea(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(sheet).height * 0.85,
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Ajouter à la tournée',
                    style: AppFonts.display(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: s.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Les acheteurs cochés deviendront des arrêts de votre '
                    'tournée en cours (ou d’une nouvelle). Les autres '
                    'attendront une prochaine tournée.'
                    '${withoutAddress > 0 ? ' ${countOf(withoutAddress, 'acheteur')} sans adresse '
                              'resteront en dehors.' : ''}',
                    style: AppFonts.sans(
                      fontSize: 16,
                      height: 1.5,
                      color: s.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  CheckboxListTile(
                    tristate: true,
                    value: all,
                    controlAffinity: ListTileControlAffinity.leading,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Tous'),
                    secondary: Text(
                      '$count sur ${candidates.length}',
                      style: AppFonts.sans(
                        fontSize: 14,
                        color: s.onSurfaceVariant,
                      ),
                    ),
                    onChanged: (_) => setSheet(() {
                      if (all == true) {
                        ticked.clear();
                      } else {
                        ticked.addAll(candidates.map((c) => c.orderId));
                      }
                    }),
                  ),
                  const Divider(height: 1),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      children: [
                        for (final c in candidates)
                          CheckboxListTile(
                            value: ticked.contains(c.orderId),
                            controlAffinity: ListTileControlAffinity.leading,
                            contentPadding: EdgeInsets.zero,
                            title: Text(c.name),
                            subtitle: Text(
                              c.address,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            onChanged: (v) => setSheet(() {
                              if (v == true) {
                                ticked.add(c.orderId);
                              } else {
                                ticked.remove(c.orderId);
                              }
                            }),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: count == 0
                        ? null
                        : () => Navigator.of(sheet).pop([
                            for (final c in candidates)
                              if (ticked.contains(c.orderId)) c.orderId,
                          ]),
                    child: Text(
                      count == 0
                          ? 'Cochez au moins un acheteur'
                          : 'Ajouter ${countOf(count, 'acheteur')}',
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.of(sheet).pop(),
                    child: const Text('Annuler'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    ),
  );
}

/// A short line at the bottom (« Paiement enregistré »).
void showOrdersSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

/// The page's section title in the display face.
class OrdersSectionTitle extends StatelessWidget {
  const OrdersSectionTitle(this.text, {super.key, this.trailing});
  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 8),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              child: Text(
                text,
                style: AppFonts.display(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  color: s.onSurface,
                ),
              ),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}
