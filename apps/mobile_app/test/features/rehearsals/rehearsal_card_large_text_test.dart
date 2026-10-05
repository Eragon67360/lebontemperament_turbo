import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/features/rehearsals/presentation/screens/rehearsals_screen.dart';

import '../../helpers/screen_harness.dart';

/// On a 360 dp phone at 2× text, « Répétition de test » used to break
/// mid-word (« Répétitio / n ») because the day column ate the width.
void main() {
  testWidgets('the title keeps its words whole at 2× on a 360 dp phone', (
    tester,
  ) async {
    await pumpScreen(
      tester,
      const RehearsalsScreen(),
      rehearsals: const ListResult.fresh([kTestRehearsal]),
      textScale: 2.0,
      size: const Size(360, 640),
    );
    expect(tester.takeException(), isNull);

    final titleFinder = find.text('Répétition de test');
    expect(titleFinder, findsOneWidget);
    final paragraph = tester.renderObject<RenderParagraph>(titleFinder);

    // The longest word must fit on one line of the title's box.
    final word = TextPainter(
      text: TextSpan(text: 'Répétition', style: paragraph.text.style),
      textScaler: paragraph.textScaler,
      textDirection: TextDirection.ltr,
    )..layout();
    expect(paragraph.size.width, greaterThanOrEqualTo(word.width));
    expect(paragraph.didExceedMaxLines, isFalse);
  });

  testWidgets('the logout button asks before signing out', (tester) async {
    await pumpScreen(tester, const RehearsalsScreen());

    await tester.tap(find.byTooltip('Déconnexion'));
    await tester.pumpAndSettle();
    expect(find.text('Se déconnecter ?'), findsOneWidget);

    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();
    expect(find.text('Se déconnecter ?'), findsNothing);
    expect(find.text('Répétitions'), findsOneWidget);
  });
}
