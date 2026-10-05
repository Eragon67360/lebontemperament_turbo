import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/features/main/presentation/screens/main_screen.dart';

/// The bottom bar's labels used to end in « Calend… » from about 1.15× text.
/// On a 360 dp phone at 1.5× and 2× every label must stay whole and the bar
/// must not grow out of proportion.
void main() {
  Future<void> pumpBar(WidgetTester tester, double scale) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    tester.view.physicalSize = const Size(360, 780);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: TextScaler.linear(scale)),
          child: child!,
        ),
        home: Scaffold(
          body: Stack(
            children: [
              FrostedGlassNavBar(
                items: kMainNavItems,
                currentIndex: 2,
                onTap: (_) {},
              ),
            ],
          ),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  }

  for (final scale in const [1.0, 1.5, 2.0]) {
    testWidgets('labels stay whole at ${scale}x on a 360 dp phone', (
      tester,
    ) async {
      await pumpBar(tester, scale);
      expect(tester.takeException(), isNull);

      for (final item in kMainNavItems) {
        final text = find.text(item.label);
        expect(text, findsOneWidget);
        final paragraph = tester.renderObject<RenderParagraph>(text);
        // Laid out at its natural width, then scaled down to fit: no
        // ellipsis, no mid-word break.
        expect(
          paragraph.didExceedMaxLines,
          isFalse,
          reason: '${item.label} at ${scale}x',
        );
        final tab = find.ancestor(of: text, matching: find.byType(InkWell));
        final tabBox = tester.getRect(tab.first);
        final textBox = tester.getRect(text);
        expect(textBox.left, greaterThanOrEqualTo(tabBox.left - 0.01));
        expect(textBox.right, lessThanOrEqualTo(tabBox.right + 0.01));
      }

      // The bar keeps a sane height: the icons and one label line.
      final bar = tester.getSize(find.byType(FrostedGlassNavBar));
      expect(bar.height, lessThan(110));
    });
  }
}
