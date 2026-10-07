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

  testWidgets('the e-mail line is a 48 dp link', (tester) async {
    await _pump(tester);

    final email = find.bySemanticsLabel(
      'Envoyer un e-mail à helene@example.test',
    );
    expect(email, findsOneWidget);
    expect(tester.getSize(email).height, greaterThanOrEqualTo(48));
  });

  testWidgets('no phone and no address on the cards (#350)', (tester) async {
    await _pump(tester);
    expect(find.byTooltip('Appeler'), findsNothing);
    expect(find.byIcon(Icons.phone_outlined), findsNothing);
    expect(find.byIcon(Icons.phone_android_outlined), findsNothing);
    expect(find.byIcon(Icons.home_outlined), findsNothing);
  });

  for (final scale in const [1.3, 2.0]) {
    testWidgets('no overflow at text scale $scale', (tester) async {
      await _pump(tester, textScale: scale);
      expect(tester.takeException(), isNull);
    });
  }
}
