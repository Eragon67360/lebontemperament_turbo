import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:lebontemperament/core/utils/date_utils.dart';

String _iso(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-'
    '${d.month.toString().padLeft(2, '0')}-'
    '${d.day.toString().padLeft(2, '0')}';

void main() {
  setUpAll(() => initializeDateFormatting('fr_FR'));

  group('formatEventDates', () {
    test('a single day keeps the weekday', () {
      expect(formatEventDates('2026-07-05', null), 'dimanche 5 juillet 2026');
      expect(
        formatEventDates('2026-07-05', '2026-07-05'),
        'dimanche 5 juillet 2026',
      );
    });

    test('a range in one month writes the month and the year once', () {
      expect(
        formatEventDates('2026-07-05', '2026-07-15'),
        'Du 5 au 15 juillet 2026',
      );
    });

    test('a range across months or years repeats what differs', () {
      expect(
        formatEventDates('2026-06-28', '2026-07-03'),
        'Du 28 juin au 3 juillet 2026',
      );
      expect(
        formatEventDates('2026-12-30', '2027-01-02'),
        'Du 30 décembre 2026 au 2 janvier 2027',
      );
    });

    test('missing or odd values never throw', () {
      expect(formatEventDates(null, null), 'Date non spécifiée');
      expect(
        formatEventDates('', null, fallback: 'Non spécifiée'),
        'Non spécifiée',
      );
      expect(formatEventDates('bientôt', null), 'bientôt');
    });
  });

  group('upcoming', () {
    final today = _iso(DateTime.now());
    final yesterday = _iso(DateTime.now().subtract(const Duration(days: 1)));

    test('a concert stays listed the whole day, whatever its start time', () {
      expect(isConcertUpcoming(date: today, time: '00:01:00'), isTrue);
      expect(isConcertUpcoming(date: yesterday, time: '23:59:00'), isFalse);
    });

    test('an event stays listed until the end of its last day', () {
      expect(isEventUpcoming(dateFrom: today, time: '00:01:00'), isTrue);
      expect(isEventUpcoming(dateFrom: yesterday), isFalse);
      expect(isEventUpcoming(dateFrom: yesterday, dateTo: today), isTrue);
    });

    test('a rehearsal leaves the list at its end time', () {
      expect(
        isRehearsalUpcoming(date: yesterday, startTime: '20:00:00'),
        isFalse,
      );
      expect(
        isRehearsalUpcoming(
          date: today,
          startTime: '23:58:00',
          endTime: '23:59:00',
        ),
        isTrue,
      );
    });
  });
}
