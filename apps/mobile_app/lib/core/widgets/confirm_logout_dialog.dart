import 'package:flutter/material.dart';

/// « Se déconnecter ? » — asks before the header's logout button signs the
/// member out, since it sits next to the calendar button. Returns true when
/// the member confirms.
Future<bool> confirmLogout(BuildContext context) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Se déconnecter ?'),
      content: const Text(
        'Vous devrez vous reconnecter pour accéder à l’espace membres.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Annuler'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(ctx).pop(true),
          child: const Text('Se déconnecter'),
        ),
      ],
    ),
  );
  return confirmed == true;
}

/// The message shown when signing out fails (never the raw exception).
const String kLogoutFailedMessage =
    'La déconnexion a échoué. Vérifiez votre connexion et réessayez.';
