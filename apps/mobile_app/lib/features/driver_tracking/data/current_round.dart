import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../data/models/delivery.dart';
import '../../../data/models/delivery_recipient.dart';

/// Which round « Mode livraison » has open, in words, so the driver can
/// match it with what the admin filled through « Ajouter à la tournée ».
///
/// A driver's current round is their latest one, unless every one of its
/// stops is delivered: then the next round is a new one. The database
/// function `add_sale_orders_to_delivery` applies the same rule, so the app
/// and the admin always mean the same round.

/// Keeps a date or a count on one line (« sam. 14 nov. », « 4 destinataires »).
const _nbsp = ' ';

/// True when every stop of the round is delivered: the round is over and
/// the next « Mode livraison » or « Ajouter à la tournée » starts a new one.
/// An empty round is not finished: it is the one to fill.
bool isRoundFinished(List<DeliveryRecipient> recipients) =>
    recipients.isNotEmpty && recipients.every((r) => r.deliveredAt != null);

/// « sam. 14 nov. », or « 21 févr. 2025 » when the year is not [now]'s.
String roundDay(DateTime day, DateTime now) {
  final dayMonth = '${day.day}$_nbsp${monthShort(day)}';
  return day.year == now.year
      ? '${weekdayShort(day)}$_nbsp$dayMonth'
      : '$dayMonth$_nbsp${day.year}';
}

String _time(DateTime t) =>
    '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

/// The créneau as the driver set it: « sam. 14 nov., 18:00 – 20:00 », or
/// null before one is chosen. Times are Europe/Paris wall-clock times.
String? roundSlot(DateTime? startParis, DateTime? endParis, DateTime now) {
  if (startParis == null) return null;
  final day = roundDay(startParis, now);
  if (endParis == null) return '$day, ${_time(startParis)}';
  return '$day, ${_time(startParis)} – ${_time(endParis)}';
}

/// The round's name: the sales its stops come from, or its day when they
/// were all added by hand (the créneau's day, else the day it was opened).
String roundTitle({
  required List<String> saleTitles,
  required DateTime? slotStartParis,
  required DateTime? openedParis,
  required DateTime now,
}) {
  if (saleTitles.length == 1) return saleTitles.first;
  if (saleTitles.length == 2) return '${saleTitles[0]} et ${saleTitles[1]}';
  if (saleTitles.length > 2) {
    return '${saleTitles.first} et ${saleTitles.length - 1} autres ventes';
  }
  if (slotStartParis != null) {
    return 'Tournée du ${roundDay(slotStartParis, now)}';
  }
  if (openedParis != null) {
    return 'Tournée ouverte le ${roundDay(openedParis, now)}';
  }
  return 'Tournée en cours';
}

String _recipients(int n) => '$n${_nbsp}destinataire${n > 1 ? 's' : ''}';

/// « 4 destinataires · 1 livré », « 1 destinataire · aucun livré »,
/// « 3 destinataires · tous livrés », or « Aucun destinataire » when empty.
String roundProgress(List<DeliveryRecipient> recipients) {
  final total = recipients.length;
  if (total == 0) return 'Aucun destinataire';
  final done = recipients.where((r) => r.deliveredAt != null).length;
  final stops = _recipients(total);
  if (done == 0) return '$stops · aucun livré';
  if (done == total) return '$stops · ${total > 1 ? 'tous livrés' : 'livré'}';
  return '$stops · $done${_nbsp}livré${done > 1 ? 's' : ''}';
}

const _startNew =
    'Pour une autre livraison, démarrez une nouvelle tournée$_nbsp: '
    'l’ancienne restera dans l’historique.';

/// Why the round looks like an earlier delivery left open, or null when it
/// doesn't: it still has stops to deliver, and its créneau ended more than a
/// day ago or it was opened more than two weeks ago. The screen then
/// suggests « Nouvelle tournée » rather than adding tonight's stops to it.
String? oldRoundNote(
  Delivery delivery,
  List<DeliveryRecipient> recipients,
  DateTime now,
) {
  if (!recipients.any((r) => r.deliveredAt == null)) return null;
  final slotEnd = delivery.scheduledEndAt ?? delivery.scheduledAt;
  if (slotEnd != null && now.difference(slotEnd) > const Duration(days: 1)) {
    return 'Son créneau est passé. $_startNew';
  }
  final opened = delivery.createdAt;
  if (opened != null && now.difference(opened) > const Duration(days: 14)) {
    return 'Elle a plus de deux semaines. $_startNew';
  }
  return null;
}

/// The question « Nouvelle tournée » asks: what happens to the round left
/// behind ([title], [recipients]) and to the next orders.
String newRoundQuestion(String title, List<DeliveryRecipient> recipients) {
  final pending = recipients.where((r) => r.deliveredAt == null).length;
  final left = pending == 0
      ? ''
      : ', avec ${_recipients(pending)} pas encore livré${pending > 1 ? 's' : ''}';
  return '«$_nbsp$title$_nbsp» passe dans l’historique des tournées$left. '
      'La nouvelle tournée commence vide$_nbsp: '
      '«${_nbsp}Ajouter à la tournée$_nbsp» la remplira, dans l’application '
      'comme dans l’admin.';
}

/// The home card's line about the current round: « Vente de fromages ·
/// 4 destinataires · 1 livré », « Tournée vide pour l'instant », or
/// « Aucune tournée en cours » when [recipients] is null (no round, or the
/// last one is finished).
String homeRoundLine({
  required List<DeliveryRecipient>? recipients,
  required String title,
}) {
  if (recipients == null) return 'Aucune tournée en cours';
  if (recipients.isEmpty) return 'Tournée vide pour l’instant';
  return '$title · ${roundProgress(recipients)}';
}

/// The distinct titles of [titleByRecipient] (a stop's sale, when it came
/// from an order), in the order of [recipientIds].
List<String> saleTitlesInOrder(
  List<String> recipientIds,
  Map<String, String> titleByRecipient,
) {
  final titles = <String>[];
  for (final id in recipientIds) {
    final title = titleByRecipient[id]?.trim();
    if (title != null && title.isNotEmpty && !titles.contains(title)) {
      titles.add(title);
    }
  }
  return titles;
}
