import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

import '../../../core/widgets/stage.dart';

/// Where a delivery stands, from the tracking JSON (#593).
enum DeliveryStage {
  /// The round has not started: a window, or a date to come by SMS.
  planned,

  /// The driver is on the road (`is_tracking_active`).
  started,

  /// This recipient is the one being served (`current_recipient_id`).
  next,

  /// `delivered_at` is set.
  delivered,
}

/// What `get_tracking_by_recipient_token` returns for one recipient: the
/// recipient's own row and the round's public state. Never another
/// recipient, an address or a phone.
class DeliveryTracking {
  const DeliveryTracking({
    required this.recipientId,
    required this.label,
    this.recipientScheduledAt,
    this.deliveredAt,
    this.isTrackingActive = false,
    this.expiresAt,
    this.roundScheduledAt,
    this.roundScheduledEndAt,
    this.isDelayed = false,
    this.delayMinutes = 0,
    this.problemMessage,
    this.currentRecipientId,
  });

  final String recipientId;
  final String label;
  final DateTime? recipientScheduledAt;
  final DateTime? deliveredAt;
  final bool isTrackingActive;
  final DateTime? expiresAt;
  final DateTime? roundScheduledAt;
  final DateTime? roundScheduledEndAt;
  final bool isDelayed;
  final int delayMinutes;
  final String? problemMessage;
  final String? currentRecipientId;

  /// Null when the JSON is not a tracking answer (the server answers null
  /// for an unknown token or an expired round).
  static DeliveryTracking? fromJson(Object? json) {
    if (json is! Map) return null;
    final recipient = json['recipient'];
    final delivery = json['delivery'];
    if (recipient is! Map || delivery is! Map) return null;
    final id = recipient['id']?.toString() ?? '';
    if (id.isEmpty) return null;
    return DeliveryTracking(
      recipientId: id,
      label: recipient['label']?.toString() ?? '',
      recipientScheduledAt: _date(recipient['scheduled_at']),
      deliveredAt: _date(recipient['delivered_at']),
      isTrackingActive: delivery['is_tracking_active'] == true,
      expiresAt: _date(delivery['expires_at']),
      roundScheduledAt: _date(delivery['scheduled_at']),
      roundScheduledEndAt: _date(delivery['scheduled_end_at']),
      isDelayed: delivery['is_delayed'] == true,
      delayMinutes: switch (delivery['delay_minutes']) {
        final int m => m,
        final num m => m.round(),
        final String m => int.tryParse(m) ?? 0,
        _ => 0,
      },
      problemMessage: _text(delivery['problem_message']),
      currentRecipientId: _text(delivery['current_recipient_id']),
    );
  }

  static DateTime? _date(Object? value) =>
      value == null ? null : DateTime.tryParse(value.toString())?.toUtc();

  static String? _text(Object? value) {
    final s = value?.toString().trim() ?? '';
    return s.isEmpty ? null : s;
  }

  bool isExpired({DateTime? now}) {
    final e = expiresAt;
    return e != null && (now ?? DateTime.now()).toUtc().isAfter(e);
  }

  DeliveryStage get stage {
    if (deliveredAt != null) return DeliveryStage.delivered;
    if (currentRecipientId != null && currentRecipientId == recipientId) {
      return DeliveryStage.next;
    }
    if (isTrackingActive) return DeliveryStage.started;
    return DeliveryStage.planned;
  }

  /// The announced delay, when there is one to announce.
  int get announcedDelay => isDelayed && delayMinutes > 0 ? delayMinutes : 0;
}

// MARK: - Paris time

tz.Location _paris() {
  if (!tz.timeZoneDatabase.isInitialized) tz_data.initializeTimeZones();
  return tz.getLocation('Europe/Paris');
}

/// The wall clock in Paris for [utc], as a plain [DateTime] (the people we
/// deliver to are in Alsace, whatever the phone's own zone says).
DateTime parisWallClock(DateTime utc) {
  final p = tz.TZDateTime.from(utc.toUtc(), _paris());
  return DateTime(p.year, p.month, p.day, p.hour, p.minute);
}

/// « 9 h 15 », « 20 h ».
String parisTime(DateTime utc) {
  final p = parisWallClock(utc);
  return frenchTime('${p.hour}:${p.minute.toString().padLeft(2, '0')}');
}

/// « aujourd’hui », « demain », or « le samedi 14 novembre » (Paris days).
String parisDay(DateTime utc, {DateTime? now}) {
  final day = parisWallClock(utc);
  final today = parisWallClock(now ?? DateTime.now());
  final days = daysUntil(day, now: today);
  if (days == 0) return 'aujourd’hui';
  if (days == 1) return 'demain';
  return 'le ${longDate(day)}';
}

/// Rounds [utc] to the nearest quarter of an hour, like the SMS of
/// `start-delivery-round` (09:29 → 09:30).
DateTime roundToQuarter(DateTime utc) {
  const quarter = 15 * 60 * 1000;
  final ms = utc.toUtc().millisecondsSinceEpoch;
  return DateTime.fromMillisecondsSinceEpoch(
    (ms / quarter).round() * quarter,
    isUtc: true,
  );
}

/// When to expect the driver, in one sentence, or null when nothing is
/// scheduled yet. The recipient's own slot gives a 30-minute window around
/// the quarter of an hour (09:29 → « entre 9 h 15 et 9 h 45 »), the SMS
/// wording; otherwise the round's own hours. An announced delay shifts it.
String? deliveryWindowText(DeliveryTracking t, {DateTime? now}) {
  final delay = Duration(minutes: t.announcedDelay);
  final slot = t.recipientScheduledAt;
  if (slot != null) {
    final centre = roundToQuarter(slot.add(delay));
    final start = centre.subtract(const Duration(minutes: 15));
    final end = centre.add(const Duration(minutes: 15));
    return 'Passage prévu ${parisDay(centre, now: now)} entre '
        '${parisTime(start)} et ${parisTime(end)}.';
  }
  final roundStart = t.roundScheduledAt;
  if (roundStart != null) {
    final start = roundStart.add(delay);
    final end = t.roundScheduledEndAt?.add(delay);
    if (end != null && end.isAfter(start)) {
      return 'Passage prévu ${parisDay(start, now: now)} entre '
          '${parisTime(start)} et ${parisTime(end)}.';
    }
    return 'Passage prévu ${parisDay(start, now: now)} vers '
        '${parisTime(start)}.';
  }
  return null;
}
