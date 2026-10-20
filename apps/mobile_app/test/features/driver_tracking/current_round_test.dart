import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/delivery.dart';
import 'package:lebontemperament/data/models/delivery_recipient.dart';
import 'package:lebontemperament/features/driver_tracking/data/current_round.dart';

/// « Mode livraison » names the round it has open (Thomas, 2026-10-20: the
/// screen didn't say which round it was delivering, so he couldn't tell
/// whether it matched the admin's « Ajouter à la tournée »).

DeliveryRecipient _stop(String id, {bool delivered = false}) =>
    DeliveryRecipient(
      id: id,
      deliveryId: 'delivery-test',
      label: 'Famille $id',
      deliveredAt: delivered ? DateTime.utc(2099, 11, 14, 18) : null,
    );

Delivery _round({
  required DateTime createdAt,
  DateTime? scheduledAt,
  DateTime? scheduledEndAt,
}) => Delivery(
  id: 'delivery-test',
  driverId: 'driver-test',
  publicToken: 'token-test',
  isTrackingActive: false,
  expiresAt: DateTime.utc(2099, 12, 31),
  createdAt: createdAt,
  scheduledAt: scheduledAt,
  scheduledEndAt: scheduledEndAt,
);

/// The strings keep dates and counts together with no-break spaces; the
/// expectations read better with plain ones.
String _plain(String? s) => s!.replaceAll(' ', ' ');

void main() {
  final now = DateTime(2099, 11, 14, 12);

  group('isRoundFinished, the rule add_sale_orders_to_delivery applies', () {
    test('an empty round is the one to fill, not finished', () {
      expect(isRoundFinished(const []), isFalse);
    });
    test('a round with a stop to deliver is current', () {
      expect(
        isRoundFinished([_stop('a', delivered: true), _stop('b')]),
        isFalse,
      );
    });
    test('every stop delivered: the next round is a new one', () {
      expect(
        isRoundFinished([
          _stop('a', delivered: true),
          _stop('b', delivered: true),
        ]),
        isTrue,
      );
    });
  });

  group('roundTitle', () {
    String title(List<String> sales, {DateTime? slot, DateTime? opened}) =>
        _plain(
          roundTitle(
            saleTitles: sales,
            slotStartParis: slot,
            openedParis: opened,
            now: now,
          ),
        );

    test('names the sale the stops come from', () {
      expect(title(['Vente de fromages']), 'Vente de fromages');
      expect(title(['Vente A', 'Vente B']), 'Vente A et Vente B');
      expect(
        title(['Vente A', 'Vente B', 'Vente C']),
        'Vente A et 2 autres ventes',
      );
    });
    test('stops typed by hand: the créneau day, else the opening day', () {
      expect(
        title(
          const [],
          slot: DateTime(2099, 11, 14, 18),
          opened: DateTime(2099, 11, 2),
        ),
        'Tournée du sam. 14 nov.',
      );
      expect(
        title(const [], opened: DateTime(2099, 11, 2)),
        'Tournée ouverte le lun. 2 nov.',
      );
      expect(title(const []), 'Tournée en cours');
    });
  });

  test('roundDay adds the year only when it is not this one', () {
    expect(_plain(roundDay(DateTime(2099, 11, 14), now)), 'sam. 14 nov.');
    expect(_plain(roundDay(DateTime(2098, 2, 21), now)), '21 févr. 2098');
  });

  test('roundSlot: the day and the hours, or nothing yet', () {
    expect(
      _plain(
        roundSlot(DateTime(2099, 11, 14, 18), DateTime(2099, 11, 14, 20), now),
      ),
      'sam. 14 nov., 18:00 – 20:00',
    );
    expect(
      _plain(roundSlot(DateTime(2099, 11, 14, 9, 5), null, now)),
      'sam. 14 nov., 09:05',
    );
    expect(roundSlot(null, null, now), isNull);
  });

  test('roundProgress counts the stops and those delivered', () {
    expect(roundProgress(const []), 'Aucun destinataire');
    expect(_plain(roundProgress([_stop('a')])), '1 destinataire · aucun livré');
    expect(
      _plain(roundProgress([_stop('a', delivered: true)])),
      '1 destinataire · livré',
    );
    expect(
      _plain(
        roundProgress([
          _stop('a', delivered: true),
          _stop('b'),
          _stop('c'),
          _stop('d'),
        ]),
      ),
      '4 destinataires · 1 livré',
    );
    expect(
      _plain(
        roundProgress([
          _stop('a', delivered: true),
          _stop('b', delivered: true),
          _stop('c'),
        ]),
      ),
      '3 destinataires · 2 livrés',
    );
    expect(
      _plain(
        roundProgress([
          _stop('a', delivered: true),
          _stop('b', delivered: true),
        ]),
      ),
      '2 destinataires · tous livrés',
    );
  });

  group('oldRoundNote', () {
    final pending = [_stop('a', delivered: true), _stop('b')];

    test('a round opened a week ago with no créneau yet is tonight\'s', () {
      final round = _round(createdAt: now.subtract(const Duration(days: 7)));
      expect(oldRoundNote(round, pending, now), isNull);
    });
    test('opened more than two weeks ago, with stops left: flagged', () {
      final round = _round(createdAt: now.subtract(const Duration(days: 241)));
      expect(
        _plain(oldRoundNote(round, pending, now)),
        startsWith('Elle a plus de deux semaines. Pour une autre livraison'),
      );
    });
    test('its créneau ended more than a day ago: flagged', () {
      final round = _round(
        createdAt: now.subtract(const Duration(days: 5)),
        scheduledAt: now.subtract(const Duration(days: 3, hours: 2)),
        scheduledEndAt: now.subtract(const Duration(days: 3)),
      );
      expect(
        _plain(oldRoundNote(round, pending, now)),
        startsWith('Son créneau est passé.'),
      );
    });
    test('tonight\'s créneau, just ended: not flagged', () {
      final round = _round(
        createdAt: now.subtract(const Duration(days: 2)),
        scheduledAt: now.subtract(const Duration(hours: 3)),
        scheduledEndAt: now.subtract(const Duration(hours: 1)),
      );
      expect(oldRoundNote(round, pending, now), isNull);
    });
    test('nothing left to deliver, or empty: nothing to say', () {
      final round = _round(createdAt: now.subtract(const Duration(days: 241)));
      expect(oldRoundNote(round, [_stop('a', delivered: true)], now), isNull);
      expect(oldRoundNote(round, const [], now), isNull);
    });
  });

  test('newRoundQuestion says what stays behind', () {
    expect(
      _plain(
        newRoundQuestion('Vente A', [
          _stop('a', delivered: true),
          _stop('b'),
          _stop('c'),
        ]),
      ),
      '« Vente A » passe dans l’historique des tournées, avec 2 destinataires '
      'pas encore livrés. La nouvelle tournée commence vide : « Ajouter à la '
      'tournée » la remplira, dans l’application comme dans l’admin.',
    );
    expect(
      _plain(newRoundQuestion('Vente A', [_stop('a')])),
      startsWith(
        '« Vente A » passe dans l’historique des tournées, avec 1 '
        'destinataire pas encore livré. ',
      ),
    );
    expect(
      _plain(newRoundQuestion('Vente A', [_stop('a', delivered: true)])),
      startsWith(
        '« Vente A » passe dans l’historique des tournées. La nouvelle',
      ),
    );
  });

  test('homeRoundLine: the round, an empty one, or none', () {
    expect(
      _plain(
        homeRoundLine(recipients: [_stop('a'), _stop('b')], title: 'Vente A'),
      ),
      'Vente A · 2 destinataires · aucun livré',
    );
    expect(
      homeRoundLine(recipients: const [], title: 'x'),
      'Tournée vide pour l’instant',
    );
    expect(
      homeRoundLine(recipients: null, title: 'x'),
      'Aucune tournée en cours',
    );
  });

  test('saleTitlesInOrder: distinct titles in the order of the stops', () {
    expect(
      saleTitlesInOrder(
        ['s1', 's2', 's3', 's4'],
        {'s3': 'Vente B', 's1': 'Vente A', 's4': ' Vente A ', 's2': ''},
      ),
      ['Vente A', 'Vente B'],
    );
  });
}
