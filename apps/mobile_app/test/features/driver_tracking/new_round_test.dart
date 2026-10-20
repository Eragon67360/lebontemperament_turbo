import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/delivery.dart';
import 'package:lebontemperament/data/models/delivery_recipient.dart';
import 'package:lebontemperament/data/services/delivery_service.dart';
import 'package:lebontemperament/features/driver_tracking/presentation/providers/driver_tracking_provider.dart';

/// The round's name comes with it, and « Nouvelle tournée » leaves the old
/// round behind for an empty one.
class _FakeDeliveryService extends DeliveryService {
  _FakeDeliveryService({this.titlesFail = false, this.live = false});

  final bool titlesFail;

  /// The database says the round is live (the app was killed mid-round).
  final bool live;
  int created = 0;
  List<String>? askedTitlesFor;

  late final current = Delivery(
    id: 'delivery-old',
    driverId: 'driver-test',
    publicToken: 'token-old',
    isTrackingActive: live,
    expiresAt: DateTime.utc(2099, 1, 1),
  );

  final recipients = const [
    DeliveryRecipient(
      id: 'stop-1',
      deliveryId: 'delivery-old',
      label: 'Famille Test',
      latitude: 47.0,
      longitude: 6.0,
    ),
  ];

  @override
  Future<Delivery?> getOrCreateDelivery() async => current;

  @override
  Future<List<DeliveryRecipient>> getRecipients(String deliveryId) async =>
      deliveryId == current.id ? recipients : const [];

  @override
  Future<List<String>> getSaleTitles(List<String> recipientIds) async {
    askedTitlesFor = recipientIds;
    if (titlesFail) throw Exception('offline');
    return const ['Vente de test'];
  }

  @override
  Future<Delivery?> createDelivery() async {
    created++;
    return Delivery(
      id: 'delivery-new',
      driverId: 'driver-test',
      publicToken: 'token-new',
      isTrackingActive: false,
      expiresAt: DateTime.utc(2099, 1, 2),
    );
  }
}

void main() {
  test('loading the round also loads the sales its stops come from', () async {
    final service = _FakeDeliveryService();
    final notifier = DriverTrackingNotifier(service);
    await notifier.loadDelivery();

    expect(service.askedTitlesFor, ['stop-1']);
    expect(notifier.state.saleTitles, ['Vente de test']);
    expect(notifier.state.recipients, hasLength(1));
  });

  test('the round still opens when its sales cannot be read', () async {
    final notifier = DriverTrackingNotifier(
      _FakeDeliveryService(titlesFail: true),
    );
    await notifier.loadDelivery();

    expect(notifier.state.delivery?.id, 'delivery-old');
    expect(notifier.state.saleTitles, isEmpty);
    expect(notifier.state.error, isNull);
  });

  test('« Nouvelle tournée » opens an empty round, named afresh', () async {
    final service = _FakeDeliveryService();
    final notifier = DriverTrackingNotifier(service);
    await notifier.loadDelivery();

    expect(await notifier.startNewRound(), isTrue);
    expect(service.created, 1);
    expect(notifier.state.delivery?.id, 'delivery-new');
    expect(notifier.state.recipients, isEmpty);
    expect(notifier.state.saleTitles, isEmpty);
    expect(notifier.state.isActionLoading, isFalse);
  });

  test('« Nouvelle tournée » is refused while the round is live', () async {
    final service = _FakeDeliveryService(live: true);
    final notifier = DriverTrackingNotifier(service);
    await notifier.loadDelivery();
    expect(notifier.state.isTrackingInterrupted, isTrue);

    expect(await notifier.startNewRound(), isFalse);
    expect(service.created, 0);
    expect(notifier.state.delivery?.id, 'delivery-old');
  });
}
