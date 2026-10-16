import 'dart:async';

import 'package:dio/dio.dart' show CancelToken;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/notice_banner.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../../data/models/member.dart';
import '../../data/address_search.dart';
import '../../domain/order_totals.dart';
import '../../domain/orders_models.dart';
import '../providers/orders_providers.dart';
import '../widgets/orders_widgets.dart';

/// A new order, or [existing] again: the buyer, how they get their goods,
/// the quantities by category, a remark. Pops with true once saved.
class OrderEditorScreen extends ConsumerStatefulWidget {
  const OrderEditorScreen({
    super.key,
    required this.detail,
    this.existing,
    this.soldByName,
  });

  final SaleDetail detail;
  final OrderRecord? existing;

  /// The name of [existing]'s seller, when known.
  final String? soldByName;

  @override
  ConsumerState<OrderEditorScreen> createState() => _OrderEditorScreenState();
}

class _OrderEditorScreenState extends ConsumerState<OrderEditorScreen> {
  late final TextEditingController _name;
  late final TextEditingController _phone;
  late final TextEditingController _address;
  late final TextEditingController _notes;
  late String _fulfilment;
  String? _soldBy;
  String? _soldByName;
  late final Map<String, int> _quantities;
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final o = widget.existing;
    _name = TextEditingController(text: o?.buyerName ?? '');
    _phone = TextEditingController(text: o?.buyerPhone ?? '');
    _address = TextEditingController(text: o?.buyerAddress ?? '');
    _notes = TextEditingController(text: o?.notes ?? '');
    _fulfilment = o?.fulfilment ?? 'delivery';
    _soldBy = o?.soldBy;
    _soldByName = widget.soldByName;
    final catalogue = {for (final p in widget.detail.products) p.id};
    _quantities = {
      for (final item in o?.items ?? const <OrderItem>[])
        if (catalogue.contains(item.productId)) item.productId: item.quantity,
    };
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    _notes.dispose();
    super.dispose();
  }

  /// The catalogue to show: available products, plus those already on the
  /// order even when they are not any more.
  List<ProductGroup> get _groups => groupProductsByCategory(
    widget.detail.products.where(
      (p) => p.isAvailable || (_quantities[p.id] ?? 0) > 0,
    ),
  );

  int get _totalCents => orderTotalCents([
    for (final e in _quantities.entries)
      OrderItem(productId: e.key, quantity: e.value),
  ], productsById(widget.detail.products));

  void _step(String productId, int delta) {
    setState(() {
      final next = ((_quantities[productId] ?? 0) + delta).clamp(
        0,
        kQuantityMax,
      );
      _quantities[productId] = next;
      _error = null;
    });
  }

  Future<void> _pickSeller() async {
    final picked = await showModalBottomSheet<(String?, String?)>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _SellerPicker(selectedId: _soldBy),
    );
    if (picked == null || !mounted) return;
    setState(() {
      _soldBy = picked.$1;
      _soldByName = picked.$2;
    });
  }

  Future<void> _save() async {
    final parsed = parseOrderInput(
      buyerName: _name.text,
      buyerPhone: _phone.text,
      buyerAddress: _address.text,
      soldBy: _soldBy,
      fulfilment: _fulfilment,
      notes: _notes.text,
      quantities: _quantities,
      productIds: {for (final p in widget.detail.products) p.id},
    );
    if (!parsed.isOk) {
      setState(() => _error = parsed.error);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    final saleId = widget.detail.sale.id;
    try {
      await ref
          .read(ordersServiceProvider)
          .saveOrder(
            saleId: saleId,
            orderId: widget.existing?.id,
            input: parsed.value!,
          );
      ref.invalidate(saleDetailProvider(saleId));
      ref.invalidate(salesListProvider);
      if (mounted) Navigator.of(context).pop(true);
    } catch (_) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = 'La commande n’a pas pu être enregistrée. Réessayez.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final editing = widget.existing != null;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          tooltip: 'Fermer',
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        title: Text(editing ? 'Modifier la commande' : 'Nouvelle commande'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          kScreenHorizontalPadding,
          8,
          kScreenHorizontalPadding,
          24,
        ),
        children: [
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Nom de l’acheteur *'),
            onChanged: (_) =>
                _error == null ? null : setState(() => _error = null),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            inputFormatters: [_PhoneInputFormatter()],
            decoration: const InputDecoration(
              labelText: 'Téléphone',
              hintText: '06 12 34 56 78',
            ),
          ),
          const SizedBox(height: 12),
          AddressSearchField(controller: _address),
          const SizedBox(height: 12),
          _SellerField(name: _soldByName, onTap: _pickSeller),
          const SizedBox(height: 16),
          SegmentedButton<String>(
            segments: [
              for (final f in fulfilments)
                ButtonSegment(
                  value: f,
                  label: Text(fulfilmentLabel(f)),
                  icon: Icon(
                    f == 'delivery'
                        ? Icons.local_shipping_outlined
                        : Icons.storefront_outlined,
                  ),
                ),
            ],
            selected: {_fulfilment},
            showSelectedIcon: false,
            style: const ButtonStyle(
              minimumSize: WidgetStatePropertyAll(Size(0, 48)),
            ),
            onSelectionChanged: (v) => setState(() => _fulfilment = v.first),
          ),
          for (final group in _groups) ...[
            Padding(
              padding: const EdgeInsets.only(top: 24, bottom: 4),
              child: StageEyebrow(group.category),
            ),
            for (final p in group.products)
              _QuantityRow(
                product: p,
                quantity: _quantities[p.id] ?? 0,
                onMinus: () => _step(p.id, -1),
                onPlus: () => _step(p.id, 1),
              ),
          ],
          const SizedBox(height: 20),
          TextField(
            controller: _notes,
            textCapitalization: TextCapitalization.sentences,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Remarque',
              hintText: 'Ex. : passer après 18 h',
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          decoration: BoxDecoration(
            color: s.surface,
            border: Border(top: BorderSide(color: s.outlineVariant)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_error != null) ...[
                NoticeBanner(
                  icon: Icons.error_outline_rounded,
                  title: _error!,
                  tone: NoticeTone.warning,
                ),
                const SizedBox(height: 12),
              ],
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total',
                          style: AppFonts.sans(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: s.onSurfaceVariant,
                          ),
                        ),
                        Text(
                          formatEuros(_totalCents),
                          style: AppFonts.display(
                            fontSize: 22,
                            fontWeight: FontWeight.w600,
                            color: s.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Enregistrer'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// « Vendu par » as a field: the member's name, or « Personne ».
class _SellerField extends StatelessWidget {
  const _SellerField({required this.name, required this.onTap});

  final String? name;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: 'Vendu par : ${name ?? 'personne'}, choisir un membre',
      child: ExcludeSemantics(
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: InputDecorator(
            decoration: const InputDecoration(
              labelText: 'Vendu par',
              suffixIcon: Icon(Icons.expand_more_rounded),
            ),
            child: Text(
              name ?? 'Personne',
              style: AppFonts.sans(
                fontSize: 16,
                color: name == null ? s.onSurfaceVariant : s.onSurface,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A product with its price and a − / + stepper (44 pt targets).
class _QuantityRow extends StatelessWidget {
  const _QuantityRow({
    required this.product,
    required this.quantity,
    required this.onMinus,
    required this.onPlus,
  });

  final OrderProduct product;
  final int quantity;
  final VoidCallback onMinus;
  final VoidCallback onPlus;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final label = productLabel(product);
    final chosen = quantity > 0;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: s.outlineVariant)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: AppFonts.sans(
                    fontSize: 16,
                    fontWeight: chosen ? FontWeight.w600 : FontWeight.w400,
                    color: s.onSurface,
                  ),
                ),
                Text(
                  formatEuros(product.unitPriceCents),
                  style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Moins de $label',
            onPressed: quantity == 0 ? null : onMinus,
            icon: const Icon(Icons.remove_circle_outline_rounded),
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          ),
          SizedBox(
            width: 32,
            child: Text(
              '$quantity',
              textAlign: TextAlign.center,
              style: AppFonts.sans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: chosen ? s.primary : s.onSurfaceVariant,
              ),
            ),
          ),
          IconButton(
            tooltip: 'Plus de $label',
            onPressed: quantity >= kQuantityMax ? null : onPlus,
            icon: const Icon(Icons.add_circle_outline_rounded),
            color: s.primary,
            constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
          ),
        ],
      ),
    );
  }
}

/// The member who took the order, from the directory, with a search.
class _SellerPicker extends ConsumerStatefulWidget {
  const _SellerPicker({required this.selectedId});
  final String? selectedId;

  @override
  ConsumerState<_SellerPicker> createState() => _SellerPickerState();
}

class _SellerPickerState extends ConsumerState<_SellerPicker> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final members = ref.watch(orderMembersProvider);
    final height = MediaQuery.sizeOf(context).height * 0.75;
    return SizedBox(
      height: height,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
            child: Text(
              'Vendu par',
              style: AppFonts.display(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: s.onSurface,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: TextField(
              autofocus: false,
              decoration: const InputDecoration(
                hintText: 'Rechercher un membre',
                prefixIcon: Icon(Icons.search_rounded),
              ),
              onChanged: (v) => setState(() => _query = v),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: switch (members) {
              AsyncData(value: final list) => _memberList(context, list),
              AsyncError() => const OrdersMessage(
                icon: Icons.cloud_off_rounded,
                title: 'Annuaire indisponible',
                text: 'Les membres n’ont pas pu être chargés.',
              ),
              _ => const Center(child: CircularProgressIndicator()),
            },
          ),
        ],
      ),
    );
  }

  Widget _memberList(BuildContext context, List<Member> all) {
    final key = sortKey(_query.trim());
    final list = [
      for (final m in all)
        if (key.isEmpty || sortKey(m.displayName).contains(key)) m,
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(8, 0, 8, 24),
      children: [
        if (key.isEmpty)
          ListTile(
            leading: const Icon(Icons.person_off_outlined),
            title: const Text('Personne'),
            selected: widget.selectedId == null,
            onTap: () => Navigator.of(context).pop((null, null)),
          ),
        for (final m in list)
          ListTile(
            leading: const Icon(Icons.person_outline_rounded),
            title: Text(m.displayName),
            selected: m.id == widget.selectedId,
            trailing: m.id == widget.selectedId
                ? const Icon(Icons.check_rounded)
                : null,
            onTap: () => Navigator.of(context).pop((m.id, m.displayName)),
          ),
        if (list.isEmpty)
          Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Aucun membre ne correspond.',
              textAlign: TextAlign.center,
              style: AppFonts.sans(
                fontSize: 15,
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
      ],
    );
  }
}

/// Formats the phone field as it is typed, while the caret is at the end
/// (an edit in the middle is left alone until the order is saved).
class _PhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text;
    if (newValue.selection.baseOffset != text.length) return newValue;
    final formatted = formatPhone(text);
    if (formatted == text) return newValue;
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// The buyer's address with suggestions from the national address base:
/// type a few words, tap a line, and the field holds « 31a Rue des Vignes
/// 67520 Wangen », the form the round's map finds. Typing freely still
/// works, and a geocoder that can't be reached leaves a plain text field.
class AddressSearchField extends ConsumerStatefulWidget {
  const AddressSearchField({super.key, required this.controller});

  final TextEditingController controller;

  @override
  ConsumerState<AddressSearchField> createState() => _AddressSearchFieldState();
}

class _AddressSearchFieldState extends ConsumerState<AddressSearchField> {
  static const _debounce = Duration(milliseconds: 300);

  Timer? _timer;
  CancelToken? _cancel;
  List<AddressSuggestion> _suggestions = const [];

  @override
  void dispose() {
    _timer?.cancel();
    _cancel?.cancel();
    super.dispose();
  }

  void _onChanged(String text) {
    _timer?.cancel();
    _cancel?.cancel();
    if (addressQuery(text) == null) {
      if (_suggestions.isNotEmpty) setState(() => _suggestions = const []);
      return;
    }
    _timer = Timer(_debounce, () async {
      final cancel = _cancel = CancelToken();
      final found = await ref
          .read(addressSearchServiceProvider)
          .search(text, cancelToken: cancel);
      if (!mounted || cancel.isCancelled) return;
      setState(() => _suggestions = found);
    });
  }

  void _choose(AddressSuggestion s) {
    _timer?.cancel();
    _cancel?.cancel();
    widget.controller.value = TextEditingValue(
      text: s.label,
      selection: TextSelection.collapsed(offset: s.label.length),
    );
    setState(() => _suggestions = const []);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: widget.controller,
          textCapitalization: TextCapitalization.sentences,
          maxLines: 2,
          minLines: 1,
          autocorrect: false,
          onChanged: _onChanged,
          decoration: const InputDecoration(
            labelText: 'Adresse',
            hintText: 'Tapez le début, puis choisissez',
          ),
        ),
        if (_suggestions.isNotEmpty)
          Card(
            margin: const EdgeInsets.only(top: 4),
            clipBehavior: Clip.antiAlias,
            child: Column(
              children: [
                for (final s in _suggestions)
                  ListTile(
                    dense: true,
                    leading: const Icon(Icons.place_outlined),
                    title: Text(s.label),
                    subtitle: s.context == null
                        ? null
                        : Text(s.context!, style: theme.textTheme.bodySmall),
                    onTap: () => _choose(s),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
