import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/delivery/data/delivery_pass.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/fake_delivery.dart';

/// Delivery passes kept on the phone (#593).
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('a pass survives the JSON round trip', () {
    final back = DeliveryPass.fromJson(
      jsonDecode(jsonEncode(kTestPass.toJson())),
    );
    expect(back, kTestPass);
    expect(back!.addedAt, kTestPass.addedAt);
  });

  test('save, find, replace and remove', () async {
    const store = DeliveryPassStore();
    expect(await store.all(), isEmpty);

    await store.save(kTestPass);
    expect(await store.find(kTestRecipientId), kTestPass);

    // Redeeming the same code again keeps one pass per recipient.
    final renamed = DeliveryPass(
      recipientId: kTestRecipientId,
      trackingToken: kTestTrackingToken,
      code: kTestCode,
      label: 'Famille Test bis',
      addedAt: DateTime.utc(2099, 11, 2),
    );
    await store.save(renamed);
    final all = await store.all();
    expect(all, hasLength(1));
    expect(all.single.label, 'Famille Test bis');

    await store.remove(kTestRecipientId);
    expect(await store.all(), isEmpty);
    expect(
      (await SharedPreferences.getInstance()).getString(DeliveryPassStore.key),
      isNull,
    );
  });

  test('garbage in the preference is ignored, not thrown', () async {
    SharedPreferences.setMockInitialValues({
      DeliveryPassStore.key: '{"not": "a list"}',
    });
    expect(await const DeliveryPassStore().all(), isEmpty);

    SharedPreferences.setMockInitialValues({
      DeliveryPassStore.key: jsonEncode([
        {'recipient_id': ''},
        kTestPass.toJson(),
      ]),
    });
    expect(await const DeliveryPassStore().all(), [kTestPass]);
  });
}
