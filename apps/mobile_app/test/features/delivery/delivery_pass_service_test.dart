import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/delivery/data/delivery_pass_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/fake_delivery.dart';

/// Redeeming, forgetting and following a delivery pass (#593), against a
/// scripted server.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test(
    'a good code asks the permission, sends the token, keeps the pass',
    () async {
      final fake = FakeDelivery();
      final result = await fake.service.redeem('k7mp-4xq9');
      expect(result, isA<RedeemOk>());
      expect(fake.permissionAsks, 1);
      expect(fake.bodies.single, {
        'code': 'K7MP4XQ9',
        'fcm_token': 'fcm-test-token',
        'platform': 'android',
      });
      final passes = await fake.service.passes();
      expect(passes, hasLength(1));
      expect(passes.single.recipientId, kTestRecipientId);
      expect(passes.single.trackingToken, kTestTrackingToken);
      expect(passes.single.label, 'Famille Test');
    },
  );

  test(
    'without a token (iOS, permission refused) the code still works',
    () async {
      final fake = FakeDelivery(token: null);
      expect(await fake.service.redeem('K7MP4XQ9'), isA<RedeemOk>());
      expect(fake.bodies.single.containsKey('fcm_token'), isFalse);
    },
  );

  test('the server’s statuses become typed results, nothing is kept', () async {
    for (final (status, matcher) in [
      ('not_found', isA<RedeemNotFound>()),
      ('rate_limited', isA<RedeemRateLimited>()),
      ('invalid', isA<RedeemInvalid>()),
      ('error', isA<RedeemFailed>()),
    ]) {
      final fake = FakeDelivery(answer: {'status': status});
      expect(await fake.service.redeem('K7MP4XQ9'), matcher, reason: status);
      expect(await fake.service.passes(), isEmpty);
    }
  });

  test('a short or wrong-alphabet code never reaches the server', () async {
    final fake = FakeDelivery();
    expect(await fake.service.redeem('K7MP'), isA<RedeemInvalid>());
    expect(await fake.service.redeem('K7MP4XQ0'), isA<RedeemInvalid>());
    expect(fake.bodies, isEmpty);
    expect(fake.permissionAsks, 0);
  });

  test('offline: unreachable, and the phone keeps nothing', () async {
    final fake = FakeDelivery(unreachable: true);
    expect(await fake.service.redeem('K7MP4XQ9'), isA<RedeemUnreachable>());
    expect(await fake.service.passes(), isEmpty);
  });

  test('every error has a French sentence', () {
    for (final result in const <RedeemResult>[
      RedeemNotFound(),
      RedeemRateLimited(),
      RedeemInvalid(),
      RedeemUnreachable(),
      RedeemFailed(),
    ]) {
      expect(redeemErrorMessage(result), isNotEmpty);
      expect(redeemErrorMessage(result), isNot(contains("'")));
    }
    expect(
      redeemErrorMessage(const RedeemNotFound()),
      'Ce code ne correspond à aucune livraison en cours. Vérifiez-le dans '
      'le SMS.',
    );
    expect(
      redeemErrorMessage(const RedeemRateLimited()),
      'Trop d’essais : réessayez dans une heure.',
    );
  });

  test('forget tells the server, then drops the pass, even offline', () async {
    final fake = FakeDelivery();
    await fake.service.store.save(kTestPass);
    fake.unreachable = true;
    await fake.service.forget(kTestPass);
    expect(fake.bodies.single, {
      'action': 'forget',
      'tracking_token': kTestTrackingToken,
      'fcm_token': 'fcm-test-token',
    });
    expect(await fake.service.passes(), isEmpty);
  });

  test('tracking: the state, or over (null) which drops the pass', () async {
    final fake = FakeDelivery();
    await fake.service.store.save(kTestPass);
    final ok = await fake.service.tracking(kTestPass);
    expect(ok, isA<TrackingOk>());
    expect(fake.trackingCalls.single, kTestTrackingToken);

    fake.trackingThrows = true;
    expect(await fake.service.tracking(kTestPass), isA<TrackingUnavailable>());
    expect(await fake.service.passes(), hasLength(1), reason: 'kept offline');

    fake.trackingThrows = false;
    fake.trackingAnswer = () => null;
    expect(await fake.service.tracking(kTestPass), isA<TrackingOver>());
    expect(await fake.service.passes(), isEmpty);
  });

  test('an FCM token refresh re-attaches every pass', () async {
    final fake = FakeDelivery();
    await fake.service.store.save(kTestPass);
    fake.service.bindTokenRefreshes();
    fake.refreshes.add('fcm-new-token');
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
    expect(fake.bodies.single, {
      'code': kTestCode,
      'fcm_token': 'fcm-new-token',
      'platform': 'android',
    });
    expect(fake.permissionAsks, 0, reason: 'never prompts on a refresh');
    await fake.service.dispose();
  });

  test('enabling notifications attaches the token once allowed', () async {
    final fake = FakeDelivery(permissionGranted: false);
    expect(await fake.service.enableNotifications(kTestPass), isFalse);
    expect(fake.permissionAsks, 1);
    expect(fake.bodies, isEmpty);

    fake.permissionGranted = true;
    expect(await fake.service.enableNotifications(kTestPass), isTrue);
    expect(fake.bodies.single['fcm_token'], 'fcm-test-token');
  });
}
