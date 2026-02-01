import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:mobile_app/core/constants/ui_constants.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

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
    if (mounted && ref.read(driverTrackingProvider).isTracking) {
      ref.read(driverTrackingProvider.notifier).stopTracking();
    }
    super.dispose();
  }

  // --- Dialog & Picker Logic ---

  Future<void> _pickScheduledTime(BuildContext context) async {
    final state = ref.read(driverTrackingProvider);
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: state.delivery?.scheduledAt ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(state.delivery?.scheduledAt ?? now),
    );
    if (time == null || !context.mounted) return;
    final scheduledAt =
        DateTime(date.year, date.month, date.day, time.hour, time.minute);
    await ref
        .read(driverTrackingProvider.notifier)
        .updateScheduledAt(scheduledAt);
  }

  Future<void> _showAddOrEditRecipientDialog(
      {DeliveryRecipient? recipient}) async {
    final newRecipient =
        await showDialog<({String label, DateTime scheduledAt})?>(
      context: context,
      builder: (_) => _AddOrEditRecipientDialog(recipient: recipient),
    );
    if (newRecipient != null && mounted) {
      if (recipient == null) {
        await ref.read(driverTrackingProvider.notifier).addRecipient(
              label: newRecipient.label,
              scheduledAt: newRecipient.scheduledAt,
            );
      } else {
        await ref.read(driverTrackingProvider.notifier).updateRecipient(
              recipient.id,
              label: newRecipient.label,
              scheduledAt: newRecipient.scheduledAt,
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
                if (state.delivery != null) ...[
                  const SizedBox(height: 32),
                  const FadeInUp(
                      delay: 400, child: _SectionTitle(title: 'Destinataires')),
                  const SizedBox(height: 12),
                  FadeInUp(
                      delay: 500,
                      child: _RecipientsCard(
                        recipients: state.recipients,
                        onAdd: () => _showAddOrEditRecipientDialog(),
                        onEdit: (r) =>
                            _showAddOrEditRecipientDialog(recipient: r),
                      )),
                  const SizedBox(height: 32),
                  const FadeInUp(
                      delay: 600,
                      child: _SectionTitle(title: 'Mises à Jour en Direct')),
                  const SizedBox(height: 12),
                  FadeInUp(
                      delay: 700,
                      child: _LiveUpdatesCard(
                        delivery: state.delivery!,
                        problemController: _problemController,
                        delayController: _delayController,
                        onPickTime: () => _pickScheduledTime(context),
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
                ]
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
          if (state.error != null) ...[
            _ErrorBanner(error: state.error!),
            const SizedBox(height: 16),
          ],
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
  final List<DeliveryRecipient> recipients;
  final Future<void> Function() onAdd;
  final Future<void> Function(DeliveryRecipient) onEdit;

  const _RecipientsCard({
    required this.recipients,
    required this.onAdd,
    required this.onEdit,
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
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: recipients.length,
              itemBuilder: (_, index) => _RecipientTile(
                recipient: recipients[index],
                onEdit: onEdit,
              ),
              separatorBuilder: (_, __) => Divider(
                  height: 1,
                  indent: 20,
                  endIndent: 20,
                  color: theme.colorScheme.outline.withOpacity(0.2)),
            ),
          Divider(height: 1, color: theme.colorScheme.outline.withOpacity(0.2)),
          InkWell(
            onTap: onAdd,
            borderRadius:
                const BorderRadius.vertical(bottom: Radius.circular(15)),
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
  final DeliveryRecipient recipient;
  final Future<void> Function(DeliveryRecipient) onEdit;

  const _RecipientTile({required this.recipient, required this.onEdit});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return ListTile(
      title: Text(recipient.label,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      subtitle: Text(
        'Prévu à ${DateFormat('HH:mm', 'fr_FR').format(recipient.scheduledAt)}',
        style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurfaceVariant, fontSize: 13),
      ),
      trailing: PopupMenuButton<String>(
        icon: const Icon(Icons.more_vert),
        onSelected: (value) async {
          if (value == 'edit') {
            onEdit(recipient);
          } else if (value == 'delete') {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Supprimer'),
                content: Text('Supprimer "${recipient.label}" de la liste ?'),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.of(ctx).pop(false),
                      child: const Text('Annuler')),
                  FilledButton(
                    onPressed: () => Navigator.of(ctx).pop(true),
                    style: FilledButton.styleFrom(
                        backgroundColor: theme.colorScheme.error),
                    child: const Text('Supprimer'),
                  ),
                ],
              ),
            );
            if (confirm == true && context.mounted) {
              await ref
                  .read(driverTrackingProvider.notifier)
                  .deleteRecipient(recipient.id);
            }
          }
        },
        itemBuilder: (context) => [
          const PopupMenuItem(value: 'edit', child: Text('Modifier')),
          const PopupMenuItem(value: 'delete', child: Text('Supprimer')),
        ],
      ),
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
    final scheduledStr = delivery.scheduledAt != null
        ? DateFormat('dd/MM à HH:mm', 'fr_FR').format(delivery.scheduledAt!)
        : 'Non définie';

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
            title: Text('Heure de livraison prévue',
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
    return '$base/track/${delivery.id}?token=${delivery.publicToken}';
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

class _AddOrEditRecipientDialog extends StatefulWidget {
  final DeliveryRecipient? recipient;
  const _AddOrEditRecipientDialog({this.recipient});
  @override
  State<_AddOrEditRecipientDialog> createState() =>
      _AddOrEditRecipientDialogState();
}

class _AddOrEditRecipientDialogState extends State<_AddOrEditRecipientDialog> {
  late final TextEditingController _labelController;
  late DateTime _scheduledAt;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.recipient?.label);
    _scheduledAt = widget.recipient?.scheduledAt ??
        DateTime.now().add(const Duration(hours: 1));
  }

  @override
  void dispose() {
    _labelController.dispose();
    super.dispose();
  }

  Future<void> _pickDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _scheduledAt,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_scheduledAt),
    );
    if (time != null) {
      setState(() {
        _scheduledAt =
            DateTime(date.year, date.month, date.day, time.hour, time.minute);
      });
    }
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
            ),
            const SizedBox(height: 16),
            ListTile(
              title: Text('Heure prévue:',
                  style: GoogleFonts.poppins(fontSize: 14)),
              subtitle: Text(
                  DateFormat('dd/MM HH:mm', 'fr_FR').format(_scheduledAt),
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.edit_calendar),
              onTap: _pickDateTime,
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Annuler')),
        FilledButton(
          onPressed: () {
            if (_labelController.text.trim().isEmpty) return;
            Navigator.of(context).pop((
              label: _labelController.text.trim(),
              scheduledAt: _scheduledAt
            ));
          },
          child: const Text('Enregistrer'),
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
        if (error.toLowerCase().contains('permission')) ...[
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
