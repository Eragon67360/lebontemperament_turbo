import 'dart:async';

import 'package:lebontemperament/features/delivery/data/delivery_pass.dart';
import 'package:lebontemperament/features/delivery/data/delivery_pass_service.dart';
import 'package:logger/logger.dart';

/// Obviously fake fixtures for the delivery tests (#593).
const kTestRecipientId = '11111111-1111-4111-8111-111111111111';
const kTestTrackingToken = '22222222-2222-4222-8222-222222222222';
const kTestCode = 'K7MP4XQ9';

final kTestPass = DeliveryPass(
  recipientId: kTestRecipientId,
  trackingToken: kTestTrackingToken,
  code: kTestCode,
  label: 'Famille Test',
  addedAt: DateTime.utc(2099, 11, 1, 10),
);

/// The tracking JSON as `get_tracking_by_recipient_token` shapes it.
Map<String, dynamic> trackingJson({
  String? recipientScheduledAt = '2099-11-14T08:29:00+00:00',
  String? deliveredAt,
  bool isTrackingActive = false,
  String? currentRecipientId,
  bool isDelayed = false,
  int delayMinutes = 0,
  String? problemMessage,
  String? roundScheduledAt,
  String? roundScheduledEndAt,
  String expiresAt = '2099-11-15T23:00:00+00:00',
}) => {
  'recipient': {
    'id': kTestRecipientId,
    'delivery_id': '33333333-3333-4333-8333-333333333333',
    'label': 'Famille Test',
    'scheduled_at': recipientScheduledAt,
    'delivered_at': deliveredAt,
    'latitude': null,
    'longitude': null,
  },
  'delivery': {
    'id': '33333333-3333-4333-8333-333333333333',
    'latitude': null,
    'longitude': null,
    'is_tracking_active': isTrackingActive,
    'expires_at': expiresAt,
    'updated_at': '2099-11-14T08:00:00+00:00',
    'scheduled_at': roundScheduledAt,
    'scheduled_end_at': roundScheduledEndAt,
    'is_delayed': isDelayed,
    'delay_minutes': delayMinutes,
    'problem_message': problemMessage,
    'current_recipient_id': currentRecipientId,
  },
};

/// A service whose network is scripted: [answer] for the function,
/// [trackingAnswer] for the RPC, and a record of every call.
class FakeDelivery {
  FakeDelivery({
    this.answer = const {
      'status': 'ok',
      'recipient_id': kTestRecipientId,
      'tracking_token': kTestTrackingToken,
      'label': 'Famille Test',
    },
    Object? Function()? trackingAnswer,
    this.permissionGranted = true,
    this.token = 'fcm-test-token',
    this.unreachable = false,
  }) : trackingAnswer = trackingAnswer ?? (() => trackingJson());

  Map<String, dynamic> answer;
  Object? Function() trackingAnswer;
  bool permissionGranted;
  String? token;
  bool unreachable;
  bool trackingThrows = false;

  final bodies = <Map<String, dynamic>>[];
  final trackingCalls = <String>[];
  int permissionAsks = 0;
  final refreshes = StreamController<String>.broadcast();

  late final DeliveryPassService service = DeliveryPassService(
    invoke: (body) async {
      bodies.add(body);
      if (unreachable) throw const DeliveryUnreachable();
      return answer;
    },
    tracking: (token) async {
      trackingCalls.add(token);
      if (trackingThrows) throw Exception('offline');
      return trackingAnswer();
    },
    ensurePermission: () async => permissionAsks++,
    hasPermission: () async => permissionGranted,
    readToken: () async => token,
    platform: () => 'android',
    tokenRefreshes: refreshes.stream,
    logger: Logger(level: Level.off),
  );
}
