import 'dart:convert';

import 'package:intl/intl.dart';

import '../../../data/models/delivery_recipient.dart';
import '../../delivery/data/delivery_code.dart';

/// Invitation SMS for a delivery round (#593, part 3).
///
/// One SMS per recipient, sent by the edge function
/// `send-delivery-invitations` when the round is prepared, with the date,
/// the link `www.lebontemperament.com/l/<code>` and the code. The server
/// builds and sends the real text; everything here is what the driver sees.

/// The edge function that sends the invitations (superadmins only).
const String kSendDeliveryInvitationsFunction = 'send-delivery-invitations';

/// The host shown in the invitation link, as in the SMS.
const String kDeliveryLinkHost = 'www.lebontemperament.com';

/// True when [recipient] has a phone number the invitation can go to.
bool hasInvitationPhone(DeliveryRecipient recipient) =>
    (recipient.phoneNumber ?? '').trim().isNotEmpty;

/// The recipients « Envoyer les invitations » sends to: a phone number, not
/// delivered yet and never invited. The server applies the same rule.
List<DeliveryRecipient> recipientsToInvite(
  List<DeliveryRecipient> recipients,
) => recipients
    .where(
      (r) =>
          hasInvitationPhone(r) && r.deliveredAt == null && r.invitedAt == null,
    )
    .toList();

/// « K7MP-4XQ9 », or a placeholder when the code is not loaded yet.
String displayDeliveryCode(String? code) {
  if (code == null || code.trim().isEmpty) return 'XXXX-XXXX';
  return formatDeliveryCode(code);
}

/// The link printed in the SMS: `www.lebontemperament.com/l/K7MP-4XQ9`.
String deliveryInvitationLink(String? code) =>
    '$kDeliveryLinkHost/l/${displayDeliveryCode(code)}';

/// The invitation text as the recipient will read it, for the confirmation
/// dialog (display only). [deliveryDayParis] is the delivery date as
/// Europe/Paris wall-clock time.
String invitationPreviewText({
  required String name,
  required DateTime deliveryDayParis,
  required String? code,
}) {
  final day = DateFormat('EEE dd/MM', 'fr_FR').format(deliveryDayParis);
  final shown = displayDeliveryCode(code);
  final greeting = name.trim().isEmpty ? 'Bonjour' : 'Bonjour ${name.trim()}';
  return '$greeting, votre commande Le Bon Tempérament arrive le $day. '
      'Suivez-la et soyez prévenu : $kDeliveryLinkHost/l/$shown '
      '(code $shown)';
}

/// « Envoyer l’invitation par SMS à 3 destinataires pour la livraison du
/// samedi 14 novembre ? »
String invitationConfirmQuestion({
  required int count,
  required DateTime deliveryDayParis,
}) {
  final day = DateFormat('EEEE d MMMM', 'fr_FR').format(deliveryDayParis);
  final who = count == 1 ? '1 destinataire' : '$count destinataires';
  return 'Envoyer l’invitation par SMS à $who pour la livraison du $day ?';
}

/// The invitation line of a recipient: « Invitation envoyée le 08/10 à
/// 14 h 05 », « Pas encore invité », or null when there is nothing to say
/// (no phone number, or delivered without an invitation). [toLocal] converts the
/// stored UTC time for display; the default is the device's time zone.
String? invitationStatusLabel(
  DeliveryRecipient recipient, {
  DateTime Function(DateTime utc)? toLocal,
}) {
  final invitedAt = recipient.invitedAt;
  if (invitedAt != null) {
    final local = (toLocal ?? (d) => d.toLocal())(invitedAt);
    final day = DateFormat('dd/MM', 'fr_FR').format(local);
    final time = DateFormat("HH 'h' mm", 'fr_FR').format(local);
    return 'Invitation envoyée le $day à $time';
  }
  if (!hasInvitationPhone(recipient) || recipient.deliveredAt != null) {
    return null;
  }
  return 'Pas encore invité';
}

/// What `send-delivery-invitations` answered.
class InvitationSendResult {
  final int sentCount;
  final int failedCount;
  final int skippedNoPhone;

  /// Set when nothing was sent: `no_date` (the delivery has no date yet),
  /// or another error code or message from the server.
  final String? error;

  const InvitationSendResult({
    this.sentCount = 0,
    this.failedCount = 0,
    this.skippedNoPhone = 0,
    this.error,
  });

  /// The delivery needs a date before invitations can go out.
  bool get needsDate => error == 'no_date';

  /// Reads the function's JSON body (`{"sentCount": n, "failedCount": n,
  /// "skippedNoPhone": n}` or `{"error": "..."}`) for an HTTP [status].
  factory InvitationSendResult.fromResponse(int? status, Object? data) {
    final json = _asJson(data);
    final error = json?['error'];
    if (status != 200 || error != null) {
      return InvitationSendResult(
        error: error is String && error.isNotEmpty ? error : 'http_$status',
      );
    }
    int count(String key) => (json?[key] as num?)?.toInt() ?? 0;
    return InvitationSendResult(
      sentCount: count('sentCount'),
      failedCount: count('failedCount'),
      skippedNoPhone: count('skippedNoPhone'),
    );
  }

  static Map<String, dynamic>? _asJson(Object? data) {
    if (data is Map) return data.cast<String, dynamic>();
    if (data is String && data.isNotEmpty) {
      try {
        final decoded = jsonDecode(data);
        if (decoded is Map) return decoded.cast<String, dynamic>();
      } on FormatException {
        return null;
      }
    }
    return null;
  }

  /// The SnackBar text: « 3 invitations envoyées. », with the failures.
  String get message {
    if (needsDate) {
      return 'Indiquez d’abord la date de livraison : elle figure dans '
          'l’invitation.';
    }
    if (error != null) {
      return 'Les invitations n’ont pas pu être envoyées. Réessayez dans un '
          'instant.';
    }
    final sent = switch (sentCount) {
      0 => 'Aucune invitation envoyée',
      1 => '1 invitation envoyée',
      _ => '$sentCount invitations envoyées',
    };
    if (failedCount == 0) return '$sent.';
    final failed = failedCount == 1
        ? '1 envoi a échoué'
        : '$failedCount envois ont échoué';
    return '$sent, $failed : vérifiez le numéro et réessayez.';
  }
}
