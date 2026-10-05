/// Helpers for parsing and comparing dates (events, concerts, rehearsals).
/// Uses local time for "now"; all comparisons are in local timezone.
library;

import 'package:intl/intl.dart';

/// The last second of the day [d] falls on.
DateTime _endOfDay(DateTime d) => DateTime(d.year, d.month, d.day, 23, 59, 59);

bool _isNowOrLater(DateTime moment) {
  final now = DateTime.now();
  return moment.isAfter(now) || moment.isAtSameMomentAs(now);
}

/// Returns true if the event is not yet over: it stays listed until the end
/// of its last day ([dateTo] if present, else [dateFrom]), like the website,
/// so a member can still find it the evening it takes place. [time] is the
/// start time and plays no part in this.
bool isEventUpcoming({String? dateFrom, String? dateTo, String? time}) {
  final endDateStr = dateTo ?? dateFrom;
  if (endDateStr == null || endDateStr.isEmpty) return true;
  final end = DateTime.tryParse(endDateStr);
  if (end == null) return true;
  return _isNowOrLater(_endOfDay(end));
}

/// Returns true if the concert is today or in the future: it stays listed
/// until the end of its day, whatever its start [time] (the website keeps
/// the whole day too).
bool isConcertUpcoming({required String date, String? time}) {
  if (date.isEmpty) return true;
  final dt = DateTime.tryParse(date);
  if (dt == null) return true;
  return _isNowOrLater(_endOfDay(dt));
}

/// Returns true if the rehearsal date (and optional end time) is today or in the future.
bool isRehearsalUpcoming({String? date, String? startTime, String? endTime}) {
  if (date == null || date.isEmpty) return true;
  DateTime? end;
  try {
    end = DateTime.tryParse(date);
    if (end == null) return true;
    final timeStr = endTime ?? startTime;
    if (timeStr != null && timeStr.isNotEmpty) {
      final parts = timeStr.split(':');
      if (parts.length >= 2) {
        final h = int.tryParse(parts[0]) ?? 0;
        final m = int.tryParse(parts[1]) ?? 0;
        end = DateTime(end.year, end.month, end.day, h, m);
      } else {
        end = _endOfDay(end);
      }
    } else {
      end = _endOfDay(end);
    }
  } catch (_) {
    return true;
  }
  return _isNowOrLater(end);
}

/// « samedi 5 juillet 2026 », or for an event spanning several days
/// « Du 5 au 15 juillet 2026 » (the month and the year are written once when
/// they are the same, « Du 28 juin au 3 juillet 2026 » otherwise).
/// Falls back to the raw value when it does not parse, and to [fallback]
/// when there is no date at all.
String formatEventDates(
  String? dateFrom,
  String? dateTo, {
  String fallback = 'Date non spécifiée',
}) {
  if (dateFrom == null || dateFrom.isEmpty) return fallback;
  final from = DateTime.tryParse(dateFrom);
  if (from == null) return dateFrom;
  final to = dateTo == null ? null : DateTime.tryParse(dateTo);
  final single = DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(from);
  if (to == null || !to.isAfter(from)) return single;

  final sameYear = from.year == to.year;
  final sameMonth = sameYear && from.month == to.month;
  final fromText = sameMonth
      ? '${from.day}'
      : DateFormat(sameYear ? 'd MMMM' : 'd MMMM yyyy', 'fr_FR').format(from);
  final toText = DateFormat('d MMMM yyyy', 'fr_FR').format(to);
  return 'Du $fromText au $toText';
}
