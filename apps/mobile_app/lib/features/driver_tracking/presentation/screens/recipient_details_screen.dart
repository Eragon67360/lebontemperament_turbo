import 'dart:io' show Platform; // Import Platform to check OS

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../data/models/delivery.dart';
import '../../../../data/models/delivery_recipient.dart';
import '../providers/driver_tracking_provider.dart';

class RecipientDetailsScreen extends ConsumerWidget {
  final Delivery delivery;
  final DeliveryRecipient recipient;

  const RecipientDetailsScreen({
    super.key,
    required this.delivery,
    required this.recipient,
  });

  /// Launches the most appropriate map application with the recipient's coordinates.
  /// Falls back to the address string if coordinates are not available.
  Future<void> _launchMaps(
    BuildContext context, {
    double? lat,
    double? lng,
    String? address,
  }) async {
    Uri? uri;

    // --- NEW LOGIC ---
    // Prioritize precise coordinates
    if (lat != null && lng != null) {
      if (Platform.isIOS) {
        // Use Apple Maps URL scheme for iOS for the best experience
        uri = Uri.parse('https://maps.apple.com/?q=$lat,$lng');
      } else {
        // Use the universal 'geo' scheme for Android. This will open a chooser
        // dialog if multiple map apps (Google Maps, Waze, etc.) are installed.
        uri = Uri.parse('geo:$lat,$lng');
      }
    }
    // Fallback to address string if no coordinates are present
    else if (address != null && address.isNotEmpty) {
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

    // Determine if we have enough info to launch maps
    final canLaunchMaps = (currentRecipient.latitude != null &&
            currentRecipient.longitude != null) ||
        (currentRecipient.address != null &&
            currentRecipient.address!.isNotEmpty);

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
                        child: Text(
                          statusLabel,
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            color: statusColor,
                          ),
                        ),
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
              onPressed: () => ref
                  .read(driverTrackingProvider.notifier)
                  .startDrivingToRecipient(currentRecipient.id),
            ),
          if (isInProgress) ...[
            _ActionButton(
              label: 'Marquer comme livré',
              icon: Icons.check_circle_outline_rounded,
              onPressed: () {
                ref
                    .read(driverTrackingProvider.notifier)
                    .markRecipientDelivered(currentRecipient.id);
                Navigator.of(context).pop();
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

          // --- NOTE: These buttons need the dialogs from the main screen ---
          // This example shows them disabled, but you would pass the functions
          // from the main screen to enable them if you choose to.
          _ActionButton(
            label: 'Modifier les informations',
            icon: Icons.edit_outlined,
            isSecondary: true,
            onPressed: null, // To be implemented via main screen
          ),
          const SizedBox(height: 12),
          _ActionButton(
            label: 'Copier le lien de suivi',
            icon: Icons.copy_all_outlined,
            isSecondary: true,
            onPressed: null, // To be implemented via main screen
          ),
          const SizedBox(height: 12),
          _ActionButton(
            label: 'Supprimer le destinataire',
            icon: Icons.delete_outline_rounded,
            color: theme.colorScheme.error,
            isSecondary: true,
            onPressed: null, // To be implemented via main screen
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

  const _ActionButton({
    required this.label,
    required this.icon,
    this.onPressed,
    this.color,
    this.isSecondary = false,
  });

  @override
  Widget build(BuildContext context) {
    if (isSecondary) {
      return OutlinedButton.icon(
        icon: Icon(icon),
        label: Text(label),
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: color,
          side: BorderSide(
              color: color ??
                  Theme.of(context).colorScheme.outline.withOpacity(0.5)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          textStyle:
              GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      );
    }

    return FilledButton.icon(
      icon: Icon(icon, size: 24),
      label: Text(label),
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 16),
        textStyle:
            GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }
}
