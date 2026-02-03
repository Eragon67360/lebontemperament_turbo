import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

import '../../../../data/models/delivery.dart';
import '../../../../data/models/delivery_recipient.dart';
import '../../../../data/services/delivery_service.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../providers/driver_tracking_provider.dart';

class DeliveryHistoryScreen extends ConsumerStatefulWidget {
  const DeliveryHistoryScreen({super.key});

  @override
  ConsumerState<DeliveryHistoryScreen> createState() =>
      _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends ConsumerState<DeliveryHistoryScreen> {
  List<DeliveryWithRecipients>? _items;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final service = ref.read(deliveryServiceProvider);
      final items = await service.getPastDeliveries();
      if (mounted) {
        setState(() {
          _items = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Erreur lors du chargement.';
          _isLoading = false;
        });
      }
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '--';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateOnly = DateTime(date.year, date.month, date.day);
    if (dateOnly == today) {
      return "Aujourd'hui";
    }
    if (dateOnly == yesterday) {
      return 'Hier';
    }
    return DateFormat('d MMM yyyy', 'fr_FR').format(date);
  }

  String _formatTime(DateTime? date) {
    if (date == null) return '';
    return DateFormat('HH:mm', 'fr_FR').format(date);
  }

  String _formatScheduledWindow(Delivery d) {
    if (d.scheduledAt == null) return '';
    final start = _formatTime(d.scheduledAt);
    if (d.scheduledEndAt == null) return start;
    return '$start – ${_formatTime(d.scheduledEndAt)}';
  }

  @override
  Widget build(BuildContext context) {
    final isSuperadminAsync = ref.watch(isSuperadminProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Historique des tournées',
          style: GoogleFonts.poppins(
            color: Theme.of(context).colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: isSuperadminAsync.when(
        data: (isSuperadmin) {
          if (!isSuperadmin) {
            return Center(
              child: Text(
                'Accès non autorisé',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            );
          }
          if (_isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (_error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _error!,
                    style: GoogleFonts.poppins(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _load,
                    child: const Text('Réessayer'),
                  ),
                ],
              ),
            );
          }
          final items = _items ?? [];
          if (items.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history_rounded,
                    size: 64,
                    color: Theme.of(context)
                        .colorScheme
                        .onSurfaceVariant
                        .withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Aucune tournée passée',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Vos tournées apparaîtront ici.',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            itemCount: items.length,
            itemBuilder: (context, index) {
              final item = items[index];
              return _HistoryCard(
                item: item,
                formatDate: _formatDate,
                formatScheduledWindow: _formatScheduledWindow,
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Erreur: $err')),
      ),
    );
  }
}

class _HistoryCard extends StatefulWidget {
  final DeliveryWithRecipients item;
  final String Function(DateTime?) formatDate;
  final String Function(Delivery) formatScheduledWindow;

  const _HistoryCard({
    required this.item,
    required this.formatDate,
    required this.formatScheduledWindow,
  });

  @override
  State<_HistoryCard> createState() => _HistoryCardState();
}

class _HistoryCardState extends State<_HistoryCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final d = widget.item.delivery;
    final recipients = widget.item.recipients;
    final deliveredCount =
        recipients.where((r) => r.deliveredAt != null).length;
    final total = recipients.length;
    final dateStr = widget.formatDate(d.createdAt);
    final windowStr = widget.formatScheduledWindow(d);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: () => setState(() => _expanded = !_expanded),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.local_shipping_rounded,
                    color: theme.colorScheme.primary,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          dateStr,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        if (windowStr.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            windowStr,
                            style: GoogleFonts.poppins(
                              fontSize: 13,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Text(
                    '$deliveredCount/$total livrés',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: deliveredCount == total
                          ? Colors.green
                          : theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ],
              ),
              if (_expanded && recipients.isNotEmpty) ...[
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 12),
                ...recipients.map((r) => _RecipientRow(recipient: r)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _RecipientRow extends StatelessWidget {
  final DeliveryRecipient recipient;

  const _RecipientRow({required this.recipient});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDelivered = recipient.deliveredAt != null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            isDelivered
                ? Icons.check_circle_rounded
                : Icons.radio_button_unchecked_rounded,
            size: 20,
            color:
                isDelivered ? Colors.green : theme.colorScheme.onSurfaceVariant,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              recipient.label,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: theme.colorScheme.onSurface,
                decoration: isDelivered ? TextDecoration.lineThrough : null,
              ),
            ),
          ),
          if (recipient.deliveredAt != null)
            Text(
              DateFormat('HH:mm', 'fr_FR').format(recipient.deliveredAt!),
              style: GoogleFonts.poppins(
                fontSize: 12,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
        ],
      ),
    );
  }
}
