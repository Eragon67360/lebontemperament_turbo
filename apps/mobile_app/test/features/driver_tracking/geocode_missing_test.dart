import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/delivery.dart';
import 'package:lebontemperament/data/models/delivery_recipient.dart';
import 'package:lebontemperament/data/services/delivery_service.dart';
import 'package:lebontemperament/features/driver_tracking/presentation/providers/driver_tracking_provider.dart';

/// Stops created from orders (« Ajouter à la tournée ») have an address but
/// no coordinates: the round looks them up once and saves them, quietly.
class _FakeDeliveryService extends DeliveryService {
  _FakeDeliveryService(this.recipients);

  List<DeliveryRecipient> recipients;
  final updates = <(String, double?, double?)>[];
  int recipientReads = 0;

  final delivery = Delivery(
    id: 'delivery-test',
    driverId: 'driver-test',
    publicToken: 'token-test',
    isTrackingActive: false,
    expiresAt: DateTime.utc(2099, 1, 1),
  );

  @override
  Future<Delivery?> getOrCreateDelivery() async => delivery;

  @override
  Future<List<DeliveryRecipient>> getRecipients(String deliveryId) async {
    recipientReads++;
    return recipients;
  }

  @override
  Future<DeliveryRecipient> updateRecipient(
    String recipientId, {
    String? label,
    DateTime? scheduledAt,
    int? sortOrder,
    String? address,
    double? latitude,
    double? longitude,
    String? phoneNumber,
  }) async {
    updates.add((recipientId, latitude, longitude));
    recipients = [
      for (final r in recipients)
        r.id == recipientId
            ? r.copyWith(latitude: latitude, longitude: longitude)
            : r,
    ];
    return recipients.firstWhere((r) => r.id == recipientId);
  }
}

DeliveryRecipient _stop(
  String id, {
  String? address,
  double? lat,
  double? lng,
  DateTime? deliveredAt,
}) => DeliveryRecipient(
  id: id,
  deliveryId: 'delivery-test',
  label: 'Famille $id',
  address: address,
  latitude: lat,
  longitude: lng,
  deliveredAt: deliveredAt,
);

void main() {
  test('looks up stops with an address and no position, once each', () async {
    final service = _FakeDeliveryService([
      _stop('a', address: '1 rue de l’Exemple, 25000 Testville'),
      _stop('b', address: '2 place du Marché', lat: 47.0, lng: 6.0),
      _stop('c'),
      _stop('d', address: 'Livrée', deliveredAt: DateTime.utc(2099)),
    ]);
    final asked = <String>[];
    final notifier = DriverTrackingNotifier(
      service,
      geocode: (address) async {
        asked.add(address);
        return (47.25, 6.02);
      },
    );
    addTearDown(notifier.dispose);

    await notifier.loadDelivery();
    await notifier.pendingGeocoding;

    expect(asked, ['1 rue de l’Exemple, 25000 Testville']);
    expect(service.updates, [('a', 47.25, 6.02)]);
    expect(
      notifier.state.recipients.firstWhere((r) => r.id == 'a').latitude,
      47.25,
    );

    // A second load asks nothing again.
    await notifier.loadDelivery();
    await notifier.pendingGeocoding;
    await notifier.geocodeMissingPositions(notifier.state.recipients);
    expect(asked.length, 1);
    expect(service.updates.length, 1);
  });

  test(
    'an address nobody can place, or a failure, leaves the stop as it is',
    () async {
      final service = _FakeDeliveryService([
        _stop('x', address: 'Nulle part'),
        _stop('y', address: 'Erreur'),
      ]);
      final notifier = DriverTrackingNotifier(
        service,
        geocode: (address) async {
          if (address == 'Erreur') throw Exception('no network');
          return null;
        },
      );
      addTearDown(notifier.dispose);

      await notifier.loadDelivery();
      await notifier.pendingGeocoding;

      expect(service.updates, isEmpty);
      expect(notifier.state.error, isNull);
      expect(notifier.state.recipients.length, 2);

      // Not retried either.
      await notifier.geocodeMissingPositions(notifier.state.recipients);
      expect(service.updates, isEmpty);
    },
  );
}
