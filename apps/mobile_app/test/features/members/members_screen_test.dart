import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/member.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/features/members/presentation/screens/members_screen.dart';

import '../../helpers/screen_harness.dart';

/// Fake members only.
const _members = [
  Member(
    displayName: 'Hélène Test',
    email: 'helene@example.test',
    voice: 'Soprano',
    mobilePhone: '06 00 00 00 00',
    address: '1 rue de Test, Testville',
  ),
  Member(displayName: 'Bob Test', email: 'bob@example.test', voice: 'Ténor'),
];

Future<void> _pump(WidgetTester tester, {double textScale = 1.0}) => pumpScreen(
  tester,
  const MembersScreen(),
  textScale: textScale,
  overrides: [membersProvider.overrideWith((ref) async => _members)],
);

void main() {
  testWidgets('« helene » finds « Hélène »', (tester) async {
    await _pump(tester);
    expect(find.text('2 membres'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'helene');
    await tester.pump();
    expect(find.text('1 membre'), findsOneWidget);
    expect(find.text('Hélène Test'), findsOneWidget);
    expect(find.text('Bob Test'), findsNothing);
  });

  testWidgets('contact lines and action chips are 48 dp targets and links', (
    tester,
  ) async {
    await _pump(tester);

    final email = find.bySemanticsLabel(
      'Envoyer un e-mail à helene@example.test',
    );
    expect(email, findsOneWidget);
    expect(tester.getSize(email).height, greaterThanOrEqualTo(48));

    final call = find.byTooltip('Appeler');
    expect(call, findsOneWidget);
    final chip = tester.getSize(call);
    expect(chip.height, greaterThanOrEqualTo(48));
    expect(chip.width, greaterThanOrEqualTo(48));
  });

  for (final scale in const [1.3, 2.0]) {
    testWidgets('no overflow at text scale $scale', (tester) async {
      await _pump(tester, textScale: scale);
      expect(tester.takeException(), isNull);
    });
  }
}
