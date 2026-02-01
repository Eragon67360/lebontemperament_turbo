/// Helpers for parsing and comparing dates (events, concerts, rehearsals).
/// Uses local time for "now"; all comparisons are in local timezone.

/// Returns true if the event is not yet ended (end date/time >= now).
/// Uses [dateTo] if present, else [dateFrom]. Optional [time] can be used
/// to build a full DateTime for the end.
bool isEventUpcoming({
  String? dateFrom,
  String? dateTo,
  String? time,
}) {
  final endDateStr = dateTo ?? dateFrom;
  if (endDateStr == null || endDateStr.isEmpty) return true;
  DateTime? end;
  try {
    end = DateTime.tryParse(endDateStr);
    if (end == null) return true;
    if (time != null && time.isNotEmpty) {
      final parts = time.split(':');
      if (parts.length >= 2) {
        final h = int.tryParse(parts[0]) ?? 0;
        final m = int.tryParse(parts[1]) ?? 0;
        end = DateTime(end.year, end.month, end.day, h, m);
      }
    }
  } catch (_) {
    return true;
  }
  return end.isAfter(DateTime.now()) || end.isAtSameMomentAs(DateTime.now());
}

/// Returns true if the concert date (and optional time) is today or in the future.
bool isConcertUpcoming({required String date, String? time}) {
  if (date.isEmpty) return true;
  DateTime? dt;
  try {
    dt = DateTime.tryParse(date);
    if (dt == null) return true;
    if (time != null && time.isNotEmpty) {
      final parts = time.split(':');
      if (parts.length >= 2) {
        final h = int.tryParse(parts[0]) ?? 0;
        final m = int.tryParse(parts[1]) ?? 0;
        dt = DateTime(dt.year, dt.month, dt.day, h, m);
      } else {
        dt = DateTime(dt.year, dt.month, dt.day, 23, 59, 59);
      }
    } else {
      dt = DateTime(dt.year, dt.month, dt.day, 23, 59, 59);
    }
  } catch (_) {
    return true;
  }
  return dt.isAfter(DateTime.now()) || dt.isAtSameMomentAs(DateTime.now());
}

/// Returns true if the rehearsal date (and optional end time) is today or in the future.
bool isRehearsalUpcoming({
  String? date,
  String? startTime,
  String? endTime,
}) {
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
        end = DateTime(end.year, end.month, end.day, 23, 59, 59);
      }
    } else {
      end = DateTime(end.year, end.month, end.day, 23, 59, 59);
    }
  } catch (_) {
    return true;
  }
  return end.isAfter(DateTime.now()) || end.isAtSameMomentAs(DateTime.now());
}
