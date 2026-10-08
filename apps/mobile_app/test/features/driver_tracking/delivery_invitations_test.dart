import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:lebontemperament/data/models/delivery_recipient.dart';
import 'package:lebontemperament/features/driver_tracking/data/delivery_invitations.dart';
import 'package:lebontemperament/features/driver_tracking/presentation/widgets/invitation_widgets.dart';

/// Invitation SMS (#593, part 3): the recipient fields, who gets invited,
/// the lines the driver reads and the edge function's answer.
/// Fixtures: obviously fake names, numbers and codes.
void main() {
  setUpAll(() => initializeDateFormatting('fr_FR'));

  const phone = '+33600000000';

  DeliveryRecipient recipient(
    String id, {
    String? phoneNumber = phone,
    DateTime? deliveredAt,
    DateTime? invitedAt,
    String? code,
  }) => DeliveryRecipient(
    id: id,
    deliveryId: 'delivery-test',
    label: 'Client $id',
    phoneNumber: phoneNumber,
    deliveredAt: deliveredAt,
    invitedAt: invitedAt,
    code: code,
  );

  group('DeliveryRecipient', () {
    test('parses code and invited_at', () {
      final r = DeliveryRecipient.fromJson({
        'id': 'recipient-test-1',
        'delivery_id': 'delivery-test',
        'label': 'Client test',
        'code': 'ABCD2345',
        'invited_at': '2099-10-08T12:05:00+00:00',
      });
      expect(r.code, 'ABCD2345');
      expect(r.invitedAt, DateTime.utc(2099, 10, 8, 12, 5));
      expect(r.invitedAt!.isUtc, isTrue);
    });

    test('leaves them null when absent (older rows, older selects)', () {
      final r = DeliveryRecipient.fromJson({
        'id': 'recipient-test-1',
        'delivery_id': 'delivery-test',
        'label': 'Client test',
        'code': null,
        'invited_at': null,
      });
      expect(r.code, isNull);
      expect(r.invitedAt, isNull);
    });

    test('round-trips through toJson and keeps them in copyWith', () {
      final r = recipient(
        'a',
        code: 'ABCD2345',
        invitedAt: DateTime.utc(2099, 10, 8, 12, 5),
      );
      final back = DeliveryRecipient.fromJson(r.toJson());
      expect(back.code, 'ABCD2345');
      expect(back.invitedAt, r.invitedAt);
      final renamed = r.copyWith(label: 'Autre');
      expect(renamed.code, 'ABCD2345');
      expect(renamed.invitedAt, r.invitedAt);
    });
  });

  group('recipientsToInvite', () {
    test('keeps those with a phone, not delivered, never invited', () {
      final list = [
        recipient('a'),
        recipient('b', phoneNumber: null),
        recipient('c', phoneNumber: '   '),
        recipient('d', deliveredAt: DateTime.utc(2099)),
        recipient('e', invitedAt: DateTime.utc(2099)),
        recipient('f'),
      ];
      expect(recipientsToInvite(list).map((r) => r.id), ['a', 'f']);
    });

    test('is empty when everyone is invited or has no phone', () {
      expect(recipientsToInvite(const []), isEmpty);
      expect(
        recipientsToInvite([
          recipient('a', invitedAt: DateTime.utc(2099)),
          recipient('b', phoneNumber: null),
        ]),
        isEmpty,
      );
    });
  });

  group('invitationStatusLabel', () {
    test('shows when the invitation went out', () {
      final r = recipient('a', invitedAt: DateTime.utc(2099, 10, 8, 12, 5));
      expect(
        invitationStatusLabel(r, toLocal: (d) => d),
        'Invitation envoyée le 08/10 à 12 h 05',
      );
    });

    test('says « Pas encore invité » only when an SMS can go out', () {
      expect(invitationStatusLabel(recipient('a')), 'Pas encore invité');
      expect(invitationStatusLabel(recipient('b', phoneNumber: null)), isNull);
      expect(
        invitationStatusLabel(recipient('c', deliveredAt: DateTime.utc(2099))),
        isNull,
      );
    });
  });

  group('texts', () {
    final saturday = DateTime(2099, 11, 14, 10);

    test('preview reads like the SMS, with the formatted code', () {
      expect(
        invitationPreviewText(
          name: 'Client test',
          deliveryDayParis: saturday,
          code: 'abcd2345',
        ),
        'Bonjour Client test, votre commande Le Bon Tempérament arrive le '
        'sam. 14/11. Suivez-la et soyez prévenu : '
        'www.lebontemperament.com/l/ABCD-2345 (code ABCD-2345)',
      );
    });

    test('preview falls back to a placeholder code', () {
      expect(
        invitationPreviewText(name: '', deliveryDayParis: saturday, code: null),
        startsWith('Bonjour, votre commande'),
      );
      expect(deliveryInvitationLink(null), endsWith('/l/XXXX-XXXX'));
    });

    test('confirmation question agrees with the count', () {
      expect(
        invitationConfirmQuestion(count: 1, deliveryDayParis: saturday),
        'Envoyer l’invitation par SMS à 1 destinataire pour la livraison '
        'du samedi 14 novembre ?',
      );
      expect(
        invitationConfirmQuestion(count: 3, deliveryDayParis: saturday),
        contains('à 3 destinataires pour'),
      );
    });
  });

  test('the delivery day is read in Paris time', () {
    // 23:30 UTC on Friday is already Saturday in Paris (UTC+1 in November).
    final day = utcToParisWallClock(DateTime.utc(2099, 11, 13, 23, 30));
    expect([day.day, day.hour, day.minute], [14, 0, 30]);
  });

  group('InvitationSendResult', () {
    test('reads the counts', () {
      final r = InvitationSendResult.fromResponse(200, {
        'sentCount': 3,
        'failedCount': 0,
        'skippedNoPhone': 1,
      });
      expect(r.error, isNull);
      expect(r.sentCount, 3);
      expect(r.skippedNoPhone, 1);
      expect(r.message, '3 invitations envoyées.');
    });

    test('reads a JSON string body', () {
      final r = InvitationSendResult.fromResponse(
        200,
        '{"sentCount":1,"failedCount":0,"skippedNoPhone":0}',
      );
      expect(r.message, '1 invitation envoyée.');
    });

    test('mentions failures', () {
      final r = InvitationSendResult.fromResponse(200, {
        'sentCount': 2,
        'failedCount': 1,
        'skippedNoPhone': 0,
      });
      expect(
        r.message,
        '2 invitations envoyées, 1 envoi a échoué : '
        'vérifiez le numéro et réessayez.',
      );
    });

    test('recognises a delivery without a date', () {
      final r = InvitationSendResult.fromResponse(400, {'error': 'no_date'});
      expect(r.needsDate, isTrue);
      expect(r.message, startsWith('Indiquez d’abord la date'));
    });

    test('turns other errors into a retry message', () {
      final r = InvitationSendResult.fromResponse(403, null);
      expect(r.error, 'http_403');
      expect(r.needsDate, isFalse);
      expect(r.message, contains('Réessayez'));
    });
  });

  group('SendInvitationsButton', () {
    Future<void> pump(
      WidgetTester tester,
      List<DeliveryRecipient> recipients, {
      bool isBusy = false,
      VoidCallback? onPressed,
    }) async {
      GoogleFonts.config.allowRuntimeFetching = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SendInvitationsButton(
              recipients: recipients,
              isBusy: isBusy,
              onPressed: onPressed ?? () {},
            ),
          ),
        ),
      );
    }

    testWidgets('shows the number of people to invite', (tester) async {
      var tapped = 0;
      await pump(tester, [
        recipient('a'),
        recipient('b'),
        recipient('c', invitedAt: DateTime.utc(2099)),
        recipient('d', phoneNumber: null),
      ], onPressed: () => tapped++);
      expect(find.text('Envoyer les invitations (2)'), findsOneWidget);
      await tester.tap(find.text('Envoyer les invitations (2)'));
      expect(tapped, 1);
    });

    testWidgets('is hidden when nobody is left to invite', (tester) async {
      await pump(tester, [
        recipient('a', invitedAt: DateTime.utc(2099)),
        recipient('b', phoneNumber: null),
      ]);
      expect(find.textContaining('Envoyer les invitations'), findsNothing);
    });

    testWidgets('is disabled while another action runs', (tester) async {
      var tapped = 0;
      await pump(
        tester,
        [recipient('a')],
        isBusy: true,
        onPressed: () => tapped++,
      );
      await tester.tap(find.text('Envoyer les invitations (1)'));
      expect(tapped, 0);
    });
  });
}
