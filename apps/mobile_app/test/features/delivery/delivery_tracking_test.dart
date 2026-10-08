import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/delivery/data/delivery_tracking.dart';

import '../../helpers/fake_delivery.dart';

/// The delivery's state from the tracking JSON, and the SMS-like window in
/// Paris time (#593).
void main() {
  // A November morning: Paris is UTC+1.
  final now = DateTime.utc(2099, 11, 14, 7);

  test('parses the server JSON, null for anything else', () {
    final t = DeliveryTracking.fromJson(trackingJson(delayMinutes: 20))!;
    expect(t.recipientId, kTestRecipientId);
    expect(t.label, 'Famille Test');
    expect(t.recipientScheduledAt, DateTime.utc(2099, 11, 14, 8, 29));
    expect(t.delayMinutes, 20);
    expect(t.isDelayed, isFalse);
    expect(t.announcedDelay, 0, reason: 'a delay counts once announced');
    expect(DeliveryTracking.fromJson(null), isNull);
    expect(DeliveryTracking.fromJson({'recipient': {}}), isNull);
  });

  test('stage: planned, started, next, delivered', () {
    expect(
      DeliveryTracking.fromJson(trackingJson())!.stage,
      DeliveryStage.planned,
    );
    expect(
      DeliveryTracking.fromJson(trackingJson(isTrackingActive: true))!.stage,
      DeliveryStage.started,
    );
    expect(
      DeliveryTracking.fromJson(
        trackingJson(
          isTrackingActive: true,
          currentRecipientId: kTestRecipientId,
        ),
      )!.stage,
      DeliveryStage.next,
    );
    expect(
      DeliveryTracking.fromJson(
        trackingJson(
          isTrackingActive: true,
          currentRecipientId: 'someone-else',
        ),
      )!.stage,
      DeliveryStage.started,
    );
    expect(
      DeliveryTracking.fromJson(
        trackingJson(deliveredAt: '2099-11-14T09:12:00+00:00'),
      )!.stage,
      DeliveryStage.delivered,
    );
  });

  test('the recipient slot gives the SMS window: 09:29 → 9 h 15 – 9 h 45', () {
    final t = DeliveryTracking.fromJson(trackingJson())!;
    expect(
      deliveryWindowText(t, now: now),
      'Passage prévu aujourd’hui entre 9 h 15 et 9 h 45.',
    );
    // 08:29 UTC is 09:29 in Paris; the window rounds to the quarter.
    expect(parisTime(DateTime.utc(2099, 11, 14, 8, 29)), '9 h 29');
    expect(
      parisTime(DateTime.utc(2027, 7, 14, 18, 0)),
      '20 h',
      reason: 'summer time',
    );
  });

  test('an announced delay shifts the window', () {
    final t = DeliveryTracking.fromJson(
      trackingJson(isDelayed: true, delayMinutes: 30),
    )!;
    expect(t.announcedDelay, 30);
    expect(
      deliveryWindowText(t, now: now),
      'Passage prévu aujourd’hui entre 9 h 45 et 10 h 15.',
    );
  });

  test('without a slot, the round’s hours; without those, nothing', () {
    final round = DeliveryTracking.fromJson(
      trackingJson(
        recipientScheduledAt: null,
        roundScheduledAt: '2099-11-15T08:00:00+00:00',
        roundScheduledEndAt: '2099-11-15T11:00:00+00:00',
      ),
    )!;
    expect(
      deliveryWindowText(round, now: now),
      'Passage prévu demain entre 9 h et 12 h.',
    );
    final startOnly = DeliveryTracking.fromJson(
      trackingJson(
        recipientScheduledAt: null,
        roundScheduledAt: '2099-11-21T08:00:00+00:00',
      ),
    )!;
    expect(
      deliveryWindowText(startOnly, now: now),
      'Passage prévu le samedi 21 novembre vers 9 h.',
    );
    final nothing = DeliveryTracking.fromJson(
      trackingJson(recipientScheduledAt: null),
    )!;
    expect(deliveryWindowText(nothing, now: now), isNull);
  });

  test('expired rounds are over even when the server still answers', () {
    final t = DeliveryTracking.fromJson(
      trackingJson(expiresAt: '2099-11-13T23:00:00+00:00'),
    )!;
    expect(t.isExpired(now: now), isTrue);
    expect(t.isExpired(now: DateTime.utc(2099, 11, 13)), isFalse);
  });
}
