import 'package:flutter/material.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/notice_banner.dart';

import '../../domain/order_totals.dart';
import '../widgets/orders_widgets.dart';

/// « Enregistrer un paiement »: the amount (what is left, to start with),
/// Virement / Espèces / Chèque, the day and a remark. Resolves to the
/// payment, or null when dismissed.
Future<PaymentInput?> showPaymentSheet(
  BuildContext context, {
  required int dueCents,
  DateTime? today,
}) => showModalBottomSheet<PaymentInput>(
  context: context,
  isScrollControlled: true,
  showDragHandle: true,
  builder: (_) => PaymentSheet(dueCents: dueCents, today: today),
);

class PaymentSheet extends StatefulWidget {
  const PaymentSheet({super.key, required this.dueCents, this.today});

  final int dueCents;

  /// Today, for tests.
  final DateTime? today;

  @override
  State<PaymentSheet> createState() => _PaymentSheetState();
}

class _PaymentSheetState extends State<PaymentSheet> {
  late final TextEditingController _amount;
  final _note = TextEditingController();
  String? _method;
  late DateTime _paidOn;
  String? _error;

  @override
  void initState() {
    super.initState();
    _amount = TextEditingController(
      text: widget.dueCents > 0 ? _euros(widget.dueCents) : '',
    );
    _paidOn = widget.today ?? DateTime.now();
  }

  @override
  void dispose() {
    _amount.dispose();
    _note.dispose();
    super.dispose();
  }

  /// « 8,50 » as typed in the field (no sign, no space).
  static String _euros(int cents) =>
      (cents / 100).toStringAsFixed(2).replaceFirst('.', ',');

  Future<void> _pickDay() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _paidOn,
      firstDate: DateTime(_paidOn.year - 2),
      lastDate: DateTime(_paidOn.year + 1, 12, 31),
      helpText: 'Date du paiement',
    );
    if (picked != null && mounted) setState(() => _paidOn = picked);
  }

  void _save() {
    final parsed = parsePaymentInput(
      amount: _amount.text,
      method: _method,
      paidOn: _paidOn,
      note: _note.text,
    );
    if (!parsed.isOk) {
      setState(() => _error = parsed.error);
      return;
    }
    Navigator.of(context).pop(parsed.value);
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final insets = MediaQuery.viewInsetsOf(context).bottom;
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + insets),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Enregistrer un paiement',
              style: AppFonts.display(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: s.onSurface,
              ),
            ),
            if (widget.dueCents > 0) ...[
              const SizedBox(height: 4),
              Text(
                'Reste à payer : ${formatEuros(widget.dueCents)}',
                style: AppFonts.sans(fontSize: 15, color: s.onSurfaceVariant),
              ),
            ],
            const SizedBox(height: 20),
            TextField(
              controller: _amount,
              autofocus: false,
              keyboardType: const TextInputType.numberWithOptions(
                decimal: true,
              ),
              style: AppFonts.display(
                fontSize: 24,
                fontWeight: FontWeight.w600,
                color: s.onSurface,
              ),
              decoration: const InputDecoration(
                labelText: 'Montant',
                suffixText: '€',
                hintText: '0,00',
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Moyen de paiement',
              style: AppFonts.sans(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: s.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final m in paymentMethods)
                  ChoiceChip(
                    label: Text(paymentMethodLabel(m)),
                    selected: _method == m,
                    onSelected: (_) => setState(() {
                      _method = m;
                      _error = null;
                    }),
                  ),
              ],
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: _pickDay,
              icon: const Icon(Icons.event_outlined),
              label: Text('Reçu le ${shortDay(_paidOn)}'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _note,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Remarque (facultatif)',
                hintText: 'Ex. : chèque n° 12',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              NoticeBanner(
                icon: Icons.error_outline_rounded,
                title: _error!,
                tone: NoticeTone.warning,
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(onPressed: _save, child: const Text('Enregistrer')),
          ],
        ),
      ),
    );
  }
}
