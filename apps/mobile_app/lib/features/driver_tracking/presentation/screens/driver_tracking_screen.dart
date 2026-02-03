import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart' show locationFromAddress;
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:mobile_app/core/constants/ui_constants.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'package:timezone/timezone.dart' as tz;

import '../../../../core/config/app_config.dart';
import '../../../../data/models/delivery.dart';
import '../../../../data/models/delivery_recipient.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../providers/driver_tracking_provider.dart';

class DriverTrackingScreen extends ConsumerWidget {
  const DriverTrackingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSuperadminAsync = ref.watch(isSuperadminProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: isSuperadminAsync.when(
        data: (isSuperadmin) {
          if (!isSuperadmin) return const _UnauthorizedState();
          return const _TrackingContent();
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erreur: $err')),
      ),
    );
  }
}

// MARK: - Main Content Widget

class _TrackingContent extends ConsumerStatefulWidget {
  const _TrackingContent();

  @override
  ConsumerState<_TrackingContent> createState() => _TrackingContentState();
}

class _TrackingContentState extends ConsumerState<_TrackingContent> {
  final _problemController = TextEditingController();
  final _delayController = TextEditingController();

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(driverTrackingProvider.notifier).loadDelivery();
    });
  }

  @override
  void dispose() {
    _problemController.dispose();
    _delayController.dispose();
    super.dispose();
  }

  // --- Dialog & Picker Logic ---

  Future<void> _pickScheduledTimeRange(BuildContext context) async {
    final state = ref.read(driverTrackingProvider);
    final now = DateTime.now();
    final initialStart = state.delivery?.scheduledAt ?? now;
    final initialEnd = state.delivery?.scheduledEndAt ??
        initialStart.add(const Duration(hours: 1));

    // Start date + time
    final startDate = await showDatePicker(
      context: context,
      initialDate: initialStart,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (startDate == null || !context.mounted) return;
    final startTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialStart),
    );
    if (startTime == null || !context.mounted) return;
    final scheduledAt = DateTime(
      startDate.year,
      startDate.month,
      startDate.day,
      startTime.hour,
      startTime.minute,
    );

    // End date + time (must be >= start)
    final endDate = await showDatePicker(
      context: context,
      initialDate: initialEnd.isBefore(scheduledAt) ? scheduledAt : initialEnd,
      firstDate: scheduledAt,
      lastDate: now.add(const Duration(days: 365)),
    );
    if (endDate == null || !context.mounted) return;
    final endTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(
        initialEnd.isBefore(scheduledAt)
            ? scheduledAt.add(const Duration(hours: 1))
            : initialEnd,
      ),
    );
    if (endTime == null || !context.mounted) return;
    final scheduledEndAt = DateTime(
      endDate.year,
      endDate.month,
      endDate.day,
      endTime.hour,
      endTime.minute,
    );
    if (scheduledEndAt.isBefore(scheduledAt)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('L\'heure de fin doit être après l\'heure de début')),
        );
      }
      return;
    }

    // Treat picked times as Europe/Paris wall-clock to fix timezone sync with website
    final paris = tz.getLocation('Europe/Paris');
    final scheduledAtUtc = tz.TZDateTime(
      paris,
      scheduledAt.year,
      scheduledAt.month,
      scheduledAt.day,
      scheduledAt.hour,
      scheduledAt.minute,
    ).toUtc();
    final scheduledEndAtUtc = tz.TZDateTime(
      paris,
      scheduledEndAt.year,
      scheduledEndAt.month,
      scheduledEndAt.day,
      scheduledEndAt.hour,
      scheduledEndAt.minute,
    ).toUtc();

    await ref.read(driverTrackingProvider.notifier).updateScheduledRange(
          scheduledAt: scheduledAtUtc,
          scheduledEndAt: scheduledEndAtUtc,
        );
  }

  Future<void> _showAddOrEditRecipientDialog(
      {DeliveryRecipient? recipient}) async {
    final newRecipient = await showDialog<
        ({
          String label,
          String? address,
          double? latitude,
          double? longitude,
          String? phoneNumber
        })?>(
      context: context,
      builder: (_) => _AddOrEditRecipientDialog(recipient: recipient),
    );
    if (newRecipient != null && mounted) {
      if (recipient == null) {
        await ref.read(driverTrackingProvider.notifier).addRecipient(
              label: newRecipient.label,
              address: newRecipient.address,
              latitude: newRecipient.latitude,
              longitude: newRecipient.longitude,
              phoneNumber: newRecipient.phoneNumber,
            );
      } else {
        await ref.read(driverTrackingProvider.notifier).updateRecipient(
              recipient.id,
              label: newRecipient.label,
              address: newRecipient.address,
              latitude: newRecipient.latitude,
              longitude: newRecipient.longitude,
              phoneNumber: newRecipient.phoneNumber,
            );
      }
    }
  }

  Future<void> _confirmResetToken() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Réinitialiser le token'),
        content: const Text(
            'L\'ancien lien ne fonctionnera plus. Les clients devront utiliser la nouvelle URL. Continuer ?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Annuler')),
          FilledButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Confirmer')),
        ],
      ),
    );
    if (ok == true && mounted) {
      await ref.read(driverTrackingProvider.notifier).resetToken();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(driverTrackingProvider);
    final theme = Theme.of(context);

    if (state.isLoading && state.delivery == null) {
      return Scaffold(
          appBar: AppBar(),
          body: const Center(child: CircularProgressIndicator()));
    }

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: theme.colorScheme.surface,
            surfaceTintColor: theme.colorScheme.surface,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => context.pop(),
            ),
            title: Text('Suivi livraison',
                style: GoogleFonts.poppins(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w600)),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
                20, 20, 20, kFloatingNavBarBottomPadding),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                FadeInUp(delay: 100, child: _TrackingStatusHero(state: state)),
                const SizedBox(height: 32),
                const FadeInUp(
                    delay: 200,
                    child: _SectionTitle(title: 'Panneau de Contrôle')),
                const SizedBox(height: 12),
                FadeInUp(delay: 300, child: _ActionButtons(state: state)),
                if (state.delivery != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 32),
                      const FadeInUp(
                          delay: 400,
                          child: _SectionTitle(title: 'Destinataires')),
                      const SizedBox(height: 12),
                      FadeInUp(
                          delay: 500,
                          child: _RecipientsCard(
                            delivery: state.delivery!,
                            recipients: state.recipients,
                            onAdd: () => _showAddOrEditRecipientDialog(),
                            onTapRecipient: (recipient) {
                              // THIS IS THE PART TO CHANGE
                              context.push(
                                '/driver-tracking/recipient',
                                extra: {
                                  'delivery': state.delivery!,
                                  'recipient': recipient,
                                  // Add the callback here
                                  'onEdit': () => _showAddOrEditRecipientDialog(
                                      recipient: recipient),
                                },
                              );
                            },
                            onReorder: (newOrder) => ref
                                .read(driverTrackingProvider.notifier)
                                .reorderRecipients(newOrder),
                          )),
                      const SizedBox(height: 32),
                      const FadeInUp(
                          delay: 600,
                          child:
                              _SectionTitle(title: 'Mises à Jour en Direct')),
                      const SizedBox(height: 12),
                      FadeInUp(
                          delay: 700,
                          child: _LiveUpdatesCard(
                            delivery: state.delivery!,
                            problemController: _problemController,
                            delayController: _delayController,
                            onPickTime: () => _pickScheduledTimeRange(context),
                          )),
                      const SizedBox(height: 32),
                      const FadeInUp(
                          delay: 800, child: _SectionTitle(title: 'Partage')),
                      const SizedBox(height: 12),
                      FadeInUp(
                          delay: 900,
                          child: _SessionDetailsCard(
                              delivery: state.delivery!,
                              onResetToken: _confirmResetToken)),
                      const SizedBox(height: 24),
                      FadeInUp(
                        delay: 950,
                        child: TextButton.icon(
                          onPressed: () =>
                              context.push('/driver-tracking/history'),
                          icon: const Icon(Icons.history_rounded, size: 20),
                          label: const Text('Historique des tournées'),
                        ),
                      ),
                    ],
                  )
              ]),
            ),
          )
        ],
      ),
    );
  }
}

// MARK: - UI Components

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _TrackingStatusHero extends StatelessWidget {
  final DriverTrackingState state;
  const _TrackingStatusHero({required this.state});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: state.isTracking
              ? [Colors.green.shade400, Colors.green.shade600]
              : [
                  theme.colorScheme.surfaceVariant,
                  theme.colorScheme.surfaceVariant.withOpacity(0.5)
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: state.isTracking
                ? Colors.green.withOpacity(0.3)
                : Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          if (state.error != null)
            Column(
              children: [
                _ErrorBanner(error: state.error!),
                const SizedBox(height: 16),
              ],
            ),
          _StatusIndicator(isActive: state.isTracking),
          const SizedBox(height: 12),
          Text(
            state.isTracking ? 'Suivi Actif' : 'Suivi Arrêté',
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color:
                  state.isTracking ? Colors.white : theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            state.isTracking
                ? 'Votre position est partagée en temps réel.'
                : 'Démarrez le suivi pour partager votre position.',
            textAlign: TextAlign.center,
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: (state.isTracking
                      ? Colors.white
                      : theme.colorScheme.onSurfaceVariant)
                  .withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButtons extends ConsumerWidget {
  final DriverTrackingState state;
  const _ActionButtons({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton.icon(
          onPressed: state.isTracking
              ? null
              : () => ref.read(driverTrackingProvider.notifier).startTracking(),
          icon: const Icon(Icons.play_arrow_rounded, size: 28),
          label: const Text('Démarrer le suivi'),
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            textStyle:
                GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: !state.isTracking
              ? null
              : () => ref.read(driverTrackingProvider.notifier).stopTracking(),
          icon: const Icon(Icons.stop_rounded, size: 28),
          label: const Text('Arrêter le suivi'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Theme.of(context).colorScheme.error,
            side: BorderSide(
                color: !state.isTracking
                    ? Colors.grey.withOpacity(0.4)
                    : Theme.of(context).colorScheme.error),
            padding: const EdgeInsets.symmetric(vertical: 16),
            textStyle:
                GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
          ),
        )
      ],
    );
  }
}

class _RecipientsCard extends ConsumerWidget {
  final Delivery delivery;
  final List<DeliveryRecipient> recipients;
  final Future<void> Function() onAdd;
  final void Function(DeliveryRecipient) onTapRecipient;
  final void Function(List<String> newOrderIds) onReorder;

  const _RecipientsCard({
    required this.delivery,
    required this.recipients,
    required this.onAdd,
    required this.onTapRecipient,
    required this.onReorder,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          if (recipients.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Text(
                'Ajoutez des destinataires pour afficher leurs horaires de livraison prévus.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                    color: theme.colorScheme.onSurfaceVariant, fontSize: 14),
              ),
            )
          else
            ReorderableListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: EdgeInsets.zero,
              itemCount: recipients.length,
              onReorder: (oldIndex, newIndex) {
                if (oldIndex < newIndex) newIndex--;
                final newOrder = List<DeliveryRecipient>.from(recipients);
                final item = newOrder.removeAt(oldIndex);
                newOrder.insert(newIndex, item);
                onReorder(newOrder.map((r) => r.id).toList());
              },
              itemBuilder: (_, index) => _RecipientTile(
                key: ValueKey(recipients[index].id),
                reorderIndex: index,
                delivery: delivery,
                recipient: recipients[index],
                onTap: () => onTapRecipient(recipients[index]),
              ),
            ),
          Divider(height: 1, color: theme.colorScheme.outline.withOpacity(0.2)),
          InkWell(
            onTap: onAdd,
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add, size: 20, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text('Ajouter un destinataire',
                      style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.primary)),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

class _RecipientTile extends ConsumerWidget {
  final int reorderIndex;
  final Delivery delivery;
  final DeliveryRecipient recipient;
  final VoidCallback onTap;

  const _RecipientTile({
    super.key,
    required this.reorderIndex,
    required this.delivery,
    required this.recipient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDelivered = recipient.deliveredAt != null;
    final isInProgress = delivery.currentRecipientId == recipient.id;

    String statusLabel;
    if (isDelivered) {
      statusLabel = 'Livré';
    } else if (isInProgress) {
      statusLabel = 'En route';
    } else {
      statusLabel = 'En attente';
    }

    final subtitle = recipient.address ?? 'Aucune adresse';

    return ListTile(
      key: key,
      onTap: onTap,
      leading: ReorderableDragStartListener(
        index: reorderIndex,
        child:
            Icon(Icons.drag_handle, color: theme.colorScheme.onSurfaceVariant),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(recipient.label,
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isDelivered
                  ? theme.colorScheme.primaryContainer
                  : isInProgress
                      ? theme.colorScheme.tertiaryContainer
                      : theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(statusLabel,
                style: GoogleFonts.poppins(
                    fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      subtitle: Text(
        subtitle,
        style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurfaceVariant, fontSize: 13),
      ),
      trailing: const Icon(Icons.chevron_right_rounded),
    );
  }
}

class _LiveUpdatesCard extends ConsumerWidget {
  final Delivery delivery;
  final TextEditingController problemController;
  final TextEditingController delayController;
  final VoidCallback onPickTime;

  const _LiveUpdatesCard({
    required this.delivery,
    required this.problemController,
    required this.delayController,
    required this.onPickTime,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    String scheduledStr;
    if (delivery.scheduledAt == null) {
      scheduledStr = 'Non définie';
    } else if (delivery.scheduledEndAt != null) {
      scheduledStr =
          '${DateFormat('dd/MM', 'fr_FR').format(delivery.scheduledAt!)} '
          '${DateFormat('HH:mm', 'fr_FR').format(delivery.scheduledAt!)} – '
          '${DateFormat('HH:mm', 'fr_FR').format(delivery.scheduledEndAt!)}';
    } else {
      scheduledStr =
          DateFormat('dd/MM à HH:mm', 'fr_FR').format(delivery.scheduledAt!);
    }

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.schedule_outlined),
            title: Text('Créneau de livraison prévu',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
            subtitle: Text(scheduledStr,
                style: GoogleFonts.poppins(
                    color: theme.colorScheme.onSurfaceVariant)),
            trailing: TextButton(
                onPressed: onPickTime, child: const Text('Modifier')),
          ),
          const Divider(height: 1, indent: 20, endIndent: 20),
          SwitchListTile(
            title: Text('Signaler un retard',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
            value: delivery.isDelayed,
            onChanged: (value) => ref
                .read(driverTrackingProvider.notifier)
                .setDelay(
                    isDelayed: value, delayMinutes: delivery.delayMinutes),
            secondary: const Icon(Icons.timer_off_outlined),
          ),
          if (delivery.isDelayed)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: TextField(
                controller: delayController,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  labelText: 'Minutes de retard (approx.)',
                  hintText: '${delivery.delayMinutes ?? 0}',
                  border: const OutlineInputBorder(),
                ),
                onSubmitted: (v) {
                  final m = int.tryParse(v);
                  if (m != null && m >= 0) {
                    ref
                        .read(driverTrackingProvider.notifier)
                        .setDelay(isDelayed: true, delayMinutes: m);
                  }
                },
              ),
            ),
          const Divider(height: 1, indent: 20, endIndent: 20),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Signaler un problème',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['Bouchons', 'Accident', 'Autre']
                      .map((label) => FilterChip(
                            label: Text(label),
                            selected: delivery.problemMessage == label,
                            onSelected: (selected) => ref
                                .read(driverTrackingProvider.notifier)
                                .setProblemMessage(selected ? label : null),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: problemController,
                  decoration: const InputDecoration(
                    hintText: 'Ou saisir un message libre...',
                    border: OutlineInputBorder(),
                  ),
                  onSubmitted: (v) {
                    if (v.trim().isNotEmpty) {
                      ref
                          .read(driverTrackingProvider.notifier)
                          .setProblemMessage(v.trim());
                    } else {
                      ref
                          .read(driverTrackingProvider.notifier)
                          .setProblemMessage(null);
                    }
                    problemController.clear();
                  },
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _SessionDetailsCard extends StatelessWidget {
  final Delivery delivery;
  final VoidCallback onResetToken;

  const _SessionDetailsCard(
      {required this.delivery, required this.onResetToken});

  String _trackingUrl(Delivery delivery) {
    final base = AppConfig.siteUrl.replaceAll(RegExp(r'/$'), '');
    return '$base/track?token=${delivery.publicToken}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final url = _trackingUrl(delivery);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Lien de partage client',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          SelectableText(url,
              style: GoogleFonts.firaCode(
                  fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
                child: OutlinedButton(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: url));
                      ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Lien copié')));
                    },
                    child: const Text('Copier'))),
            const SizedBox(width: 12),
            Expanded(
                child: FilledButton(
                    onPressed: () => Share.share(url),
                    child: const Text('Partager'))),
          ]),
          const Divider(height: 32),
          Text(
              'Expire le ${DateFormat('dd/MM/yyyy à HH:mm', 'fr_FR').format(delivery.expiresAt)}',
              style: GoogleFonts.poppins(
                  fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 8),
          Center(
              child: TextButton(
                  onPressed: onResetToken,
                  child: const Text('Réinitialiser le token de partage'))),
        ],
      ),
    );
  }
}

// This replaces the existing _AddOrEditRecipientDialog in driver_tracking_screen.dart

class _AddOrEditRecipientDialog extends StatefulWidget {
  final DeliveryRecipient? recipient;
  const _AddOrEditRecipientDialog({this.recipient});
  @override
  State<_AddOrEditRecipientDialog> createState() =>
      _AddOrEditRecipientDialogState();
}

class _AddOrEditRecipientDialogState extends State<_AddOrEditRecipientDialog> {
  late final TextEditingController _labelController;
  late final TextEditingController _addressController;
  late final TextEditingController _phoneController;
  bool _isGeocoding = false;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.recipient?.label);
    _addressController = TextEditingController(text: widget.recipient?.address);
    _phoneController =
        TextEditingController(text: widget.recipient?.phoneNumber);
  }

  @override
  void dispose() {
    _labelController.dispose();
    _addressController.dispose();
    _phoneController.dispose(); // <-- ADDED disposal
    super.dispose();
  }

  Future<void> _save() async {
    final label = _labelController.text.trim();
    if (label.isEmpty) return;
    final addressStr = _addressController.text.trim();
    final phoneStr = _phoneController.text.trim(); // <-- ADDED get phone value

    String? savedAddress;
    double? savedLatitude;
    double? savedLongitude;

    if (addressStr.isNotEmpty) {
      setState(() => _isGeocoding = true);
      try {
        final locations = await locationFromAddress(addressStr);
        if (locations.isNotEmpty && mounted) {
          savedAddress = addressStr;
          savedLatitude = locations.first.latitude;
          savedLongitude = locations.first.longitude;
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Adresse introuvable. Enregistrement sans position.',
              ),
            ),
          );
          savedAddress = addressStr;
        }
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Adresse introuvable. Enregistrement sans position.',
              ),
            ),
          );
          savedAddress = addressStr;
        }
      }
      if (mounted) setState(() => _isGeocoding = false);
    }

    if (!mounted) return;

    // <-- MODIFIED the returned object to include the phone number
    Navigator.of(context).pop((
      label: label,
      address: savedAddress?.isEmpty == true ? null : savedAddress,
      latitude: savedLatitude,
      longitude: savedLongitude,
      phoneNumber: phoneStr.isEmpty ? null : phoneStr, // <-- ADDED phone number
    ));
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.recipient == null
          ? 'Ajouter un destinataire'
          : 'Modifier le destinataire'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _labelController,
              decoration: const InputDecoration(
                  labelText: 'Nom ou libellé', border: OutlineInputBorder()),
              autofocus: true,
              textCapitalization: TextCapitalization.words,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Adresse (optionnel)',
                hintText: 'Ex: 10 Rue de la Paix, 67000 Strasbourg',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Téléphone (pour SMS)',
                hintText: 'Format international (ex: +336...))',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: _isGeocoding ? null : () => Navigator.of(context).pop(),
            child: const Text('Annuler')),
        FilledButton(
          onPressed: _isGeocoding ? null : _save,
          child: _isGeocoding
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Enregistrer'),
        ),
      ],
    );
  }
}

// MARK: - Helper & State Widgets

class _StatusIndicator extends StatefulWidget {
  final bool isActive;
  const _StatusIndicator({required this.isActive});
  @override
  State<_StatusIndicator> createState() => _StatusIndicatorState();
}

class _StatusIndicatorState extends State<_StatusIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller =
        AnimationController(vsync: this, duration: const Duration(seconds: 1))
          ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final inactiveColor = theme.colorScheme.onSurfaceVariant.withOpacity(0.5);
    return SizedBox(
      width: 20,
      height: 20,
      child: widget.isActive
          ? FadeTransition(
              opacity: Tween<double>(begin: 0.5, end: 1.0).animate(_controller),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                        color: Colors.white.withOpacity(0.8),
                        blurRadius: 8,
                        spreadRadius: 4)
                  ],
                ),
              ),
            )
          : Container(
              decoration:
                  BoxDecoration(shape: BoxShape.circle, color: inactiveColor)),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String error;
  const _ErrorBanner({required this.error});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Expanded(
                child: Text(error,
                    style: GoogleFonts.poppins(color: Colors.white))),
          ],
        ),
        if (error.toLowerCase().contains('permission'))
          Column(
            children: [
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () => openAppSettings(),
                  icon: const Icon(Icons.settings, size: 16),
                  label: const Text('Ouvrir les paramètres'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.green.shade800,
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class _UnauthorizedState extends StatelessWidget {
  const _UnauthorizedState();
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline_rounded,
                size: 72,
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5)),
            const SizedBox(height: 24),
            Text('Accès non autorisé',
                style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface)),
            const SizedBox(height: 8),
            Text(
                'Cette fonctionnalité est réservée aux administrateurs de l\'application.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                    fontSize: 14, color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 24),
            FilledButton.icon(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Retour')),
          ],
        ),
      ),
    );
  }
}

class FadeInUp extends StatefulWidget {
  final Widget child;
  final int delay;
  const FadeInUp({super.key, required this.child, this.delay = 0});
  @override
  State<FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<FadeInUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<double> _translateY;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _opacity = Tween<double>(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(begin: 30.0, end: 0.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Opacity(
        opacity: _opacity.value,
        child: Transform.translate(
            offset: Offset(0, _translateY.value), child: widget.child),
      ),
    );
  }
}
