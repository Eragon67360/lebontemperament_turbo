import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Required for Clipboard
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart'; // Required for pop
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/config/app_config.dart'; // Required for site URL
import '../../../../data/models/delivery.dart';
import '../../../../data/models/delivery_recipient.dart';
import '../providers/driver_tracking_provider.dart';

class RecipientDetailsScreen extends ConsumerWidget {
  final Delivery delivery;
  final DeliveryRecipient recipient;
  // This callback allows us to trigger the dialog from the parent screen
  final Future<void> Function() onEdit;

  const RecipientDetailsScreen({
    super.key,
    required this.delivery,
    required this.recipient,
    required this.onEdit,
  });

  /// Launches the most appropriate map application.
  Future<void> _launchMaps(
    BuildContext context, {
    double? lat,
    double? lng,
    String? address,
  }) async {
    Uri? uri;
    if (lat != null && lng != null) {
      if (Platform.isIOS) {
        uri = Uri.parse('https://maps.apple.com/?q=$lat,$lng');
      } else {
        uri = Uri.parse('geo:$lat,$lng');
      }
    } else if (address != null && address.isNotEmpty) {
      if (Platform.isIOS) {
        uri = Uri.parse(
            'https://maps.apple.com/?q=${Uri.encodeComponent(address)}');
      } else {
        uri = Uri.parse('geo:0,0?q=${Uri.encodeComponent(address)}');
      }
    }

    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Impossible d\'ouvrir une application de carte.')),
      );
    }
  }

  /// Constructs the unique tracking URL for this recipient.
  String _getRecipientUrl(DeliveryRecipient recipient) {
    if (recipient.publicToken == null) return '';
    final base = AppConfig.siteUrl.replaceAll(RegExp(r'/$'), '');
    return '$base/track?token=${recipient.publicToken}';
  }

  /// Shows a confirmation dialog before deleting the recipient.
  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, String recipientId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer le destinataire ?'),
        content: const Text('Cette action est irréversible.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('Annuler')),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm == true && context.mounted) {
      await ref
          .read(driverTrackingProvider.notifier)
          .deleteRecipient(recipientId);
      // Go back to the previous screen since this one no longer represents a valid item.
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(driverTrackingProvider);
    final currentDelivery = state.delivery ?? delivery;
    final currentRecipient = state.recipients.firstWhere(
      (r) => r.id == recipient.id,
      orElse: () => recipient,
    );

    final theme = Theme.of(context);
    final isDelivered = currentRecipient.deliveredAt != null;
    final isInProgress =
        currentDelivery.currentRecipientId == currentRecipient.id;
    final canLaunchMaps = (currentRecipient.latitude != null &&
            currentRecipient.longitude != null) ||
        (currentRecipient.address != null &&
            currentRecipient.address!.isNotEmpty);
    final canShare = currentRecipient.publicToken != null;

    String statusLabel;
    Color statusColor;
    if (isDelivered) {
      statusLabel = 'Livré';
      statusColor = theme.colorScheme.primary;
    } else if (isInProgress) {
      statusLabel = 'En route';
      statusColor = theme.colorScheme.tertiary;
    } else {
      statusLabel = 'En attente';
      statusColor = theme.colorScheme.onSurfaceVariant;
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(currentRecipient.label,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // --- Status and Info Card ---
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Statut',
                          style:
                              GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(statusLabel,
                            style: GoogleFonts.poppins(
                                fontWeight: FontWeight.bold,
                                color: statusColor)),
                      ),
                    ],
                  ),
                  const Divider(height: 32),
                  Text('Adresse',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    currentRecipient.address ?? 'Aucune adresse renseignée',
                    style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: theme.colorScheme.onSurfaceVariant),
                  ),
                  const Divider(height: 32), // <-- ADDED a divider
                  Text('Téléphone', // <-- ADDED new section title
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(
                    // <-- ADDED new text field for phone
                    currentRecipient.phoneNumber ?? 'Aucun numéro renseigné',
                    style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: theme.colorScheme.onSurfaceVariant),
                  ),
                  if (isDelivered) ...[
                    const Divider(height: 32),
                    Text('Heure de livraison',
                        style:
                            GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('dd/MM/yyyy à HH:mm', 'fr_FR')
                          .format(currentRecipient.deliveredAt!),
                      style: GoogleFonts.poppins(fontSize: 14),
                    ),
                  ]
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // --- Action Buttons ---
          if (canLaunchMaps) ...[
            _ActionButton(
              label: 'Y aller',
              icon: Icons.directions_rounded,
              onPressed: () => _launchMaps(
                context,
                lat: currentRecipient.latitude,
                lng: currentRecipient.longitude,
                address: currentRecipient.address,
              ),
            ),
            const SizedBox(height: 12),
          ],
          if (!isDelivered && !isInProgress)
            _ActionButton(
              label: 'En route vers ce destinataire',
              icon: Icons.play_arrow_rounded,
              isLoading: state.isActionLoading,
              onPressed: state.isActionLoading
                  ? null
                  : () => ref
                      .read(driverTrackingProvider.notifier)
                      .startDrivingToRecipient(currentRecipient.id),
            ),
          if (isInProgress) ...[
            _ActionButton(
              label: 'Marquer comme livré',
              icon: Icons.check_circle_outline_rounded,
              isLoading: state.isActionLoading,
              onPressed: state.isActionLoading
                  ? null
                  : () async {
                      await ref
                          .read(driverTrackingProvider.notifier)
                          .markRecipientDelivered(currentRecipient.id);
                      if (context.mounted) context.pop();
                    },
            ),
            const SizedBox(height: 12),
            _ActionButton(
              label: 'Reporter en attente',
              icon: Icons.undo_rounded,
              color: theme.colorScheme.secondary,
              onPressed: () =>
                  ref.read(driverTrackingProvider.notifier).revertToPending(),
            ),
          ],
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 24),

          // --- Management Buttons ---
          _ActionButton(
            label: 'Modifier les informations',
            icon: Icons.edit_outlined,
            isSecondary: true,
            onPressed: onEdit,
          ),
          const SizedBox(height: 12),
          _ActionButton(
            label: 'Copier le lien de suivi',
            icon: Icons.copy_all_outlined,
            isSecondary: true,
            onPressed: canShare
                ? () {
                    final url = _getRecipientUrl(currentRecipient);
                    Clipboard.setData(ClipboardData(text: url));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Lien copié dans le presse-papiers')));
                  }
                : null,
          ),
          const SizedBox(height: 12),
          _ActionButton(
            label: 'Supprimer le destinataire',
            icon: Icons.delete_outline_rounded,
            color: theme.colorScheme.error,
            isSecondary: true,
            onPressed: () => _confirmDelete(context, ref, currentRecipient.id),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback? onPressed;
  final Color? color;
  final bool isSecondary;
  final bool isLoading;

  const _ActionButton({
    required this.label,
    required this.icon,
    this.onPressed,
    this.color,
    this.isSecondary = false,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveOnPressed = isLoading ? null : onPressed;
    final leading = isLoading
        ? const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Icon(icon, size: isSecondary ? null : 24);

    if (isSecondary) {
      return OutlinedButton.icon(
        icon: leading,
        label: Text(label),
        onPressed: effectiveOnPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(
              color: effectiveOnPressed == null
                  ? Colors.grey.withOpacity(0.4)
                  : color ??
                      Theme.of(context).colorScheme.outline.withOpacity(0.5)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle:
              GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      );
    }

    return FilledButton.icon(
      icon: leading,
      label: Text(label),
      onPressed: effectiveOnPressed,
      style: FilledButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 16),
        textStyle:
            GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }
}
