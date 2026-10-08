import 'package:flutter/material.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../../../../data/models/delivery_recipient.dart';
import '../../data/delivery_invitations.dart';

/// A UTC timestamp as Europe/Paris wall-clock time (the delivery date the
/// recipients read), whatever the phone's time zone.
DateTime utcToParisWallClock(DateTime utc) {
  if (!tz.timeZoneDatabase.isInitialized) tz_data.initializeTimeZones();
  final inParis = tz.TZDateTime.from(utc, tz.getLocation('Europe/Paris'));
  return DateTime(
    inParis.year,
    inParis.month,
    inParis.day,
    inParis.hour,
    inParis.minute,
  );
}

/// Asks before invitation SMS go out (#593): [question], then the text as
/// the recipient will read it. Resolves to true when the driver confirms.
Future<bool> confirmInvitationSend(
  BuildContext context, {
  required String title,
  required String question,
  required String preview,
  required String confirmLabel,
}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) {
      final theme = Theme.of(ctx);
      return AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(question),
              const SizedBox(height: 16),
              Text(
                'Aperçu du SMS',
                style: AppFonts.sans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  preview,
                  style: AppFonts.sans(
                    fontSize: 13,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(confirmLabel),
          ),
        ],
      );
    },
  );
  return ok == true;
}

/// Explains that the invitation needs the delivery date first. Resolves to
/// true when the driver wants to choose it now ([canPickHere]); otherwise
/// the dialog only tells where to set it.
Future<bool> explainInvitationNeedsDate(
  BuildContext context, {
  required bool canPickHere,
}) async {
  final ok = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Date de livraison à choisir'),
      content: Text(
        canPickHere
            ? 'L’invitation annonce le jour de la livraison : '
                  'choisissez d’abord le créneau, puis vous pourrez '
                  'envoyer les invitations.'
            : 'L’invitation annonce le jour de la livraison : '
                  'choisissez d’abord le créneau dans « Mises à jour en '
                  'direct » sur l’écran Suivi livraison.',
      ),
      actions: [
        if (canPickHere) ...[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Choisir la date'),
          ),
        ] else
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Compris'),
          ),
      ],
    ),
  );
  return ok == true;
}

/// « Envoyer les invitations (N) », N = recipients with a phone number, not
/// delivered and never invited. Hidden when there is nobody to invite.
class SendInvitationsButton extends StatelessWidget {
  final List<DeliveryRecipient> recipients;
  final bool isBusy;
  final VoidCallback onPressed;

  const SendInvitationsButton({
    super.key,
    required this.recipients,
    required this.isBusy,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final count = recipientsToInvite(recipients).length;
    if (count == 0) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton.tonalIcon(
          onPressed: isBusy ? null : onPressed,
          icon: const Icon(Icons.sms_outlined, size: 18),
          label: Text('Envoyer les invitations ($count)'),
          style: FilledButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            textStyle: AppFonts.sans(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }
}
