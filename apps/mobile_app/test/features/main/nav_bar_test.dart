import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cupertino_native_better/cupertino_native_better.dart';
import 'package:lebontemperament/core/platform/liquid_glass_support.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/features/main/presentation/screens/main_screen.dart';

/// The bottom bar's labels used to end in « Calend… » from about 1.15× text.
/// On a 360 dp phone at 1.5× and 2× every label must stay whole and the bar
/// must not grow out of proportion.
void main() {
  tearDown(() {
    LiquidGlassSupport.debugOverride = null;
    LiquidGlassSupport.available.value = false;
  });

  Future<void> pumpBar(
    WidgetTester tester,
    double scale, {
    bool highContrast = false,
  }) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    tester.view.physicalSize = const Size(360, 780);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(scale),
            highContrast: highContrast,
          ),
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

  // Our own bar; on iOS 26 Apple's tab bar sizes its labels itself.
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
      expect(find.byType(CNTabBar), findsNothing);
    });
  }

  testWidgets("iOS 26 gets Apple's tab bar with our four tabs", (tester) async {
    LiquidGlassSupport.debugOverride = true;
    await pumpBar(tester, 1.0);
    final bar = tester.widget<CNTabBar>(find.byType(CNTabBar));
    expect(bar.items.map((i) => i.label), kMainNavItems.map((i) => i.label));
    expect(bar.currentIndex, 2);
    // Let the package's own timers finish before the test ends.
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('Increase Contrast keeps the plain bar on iOS 26', (
    tester,
  ) async {
    LiquidGlassSupport.available.value = true;
    await pumpBar(tester, 1.0, highContrast: true);
    expect(find.byType(CNTabBar), findsNothing);
  });

  testWidgets('the glass bar shows once the device supports it', (
    tester,
  ) async {
    await pumpBar(tester, 1.0);
    expect(find.byType(CNTabBar), findsNothing);
    LiquidGlassSupport.available.value = true;
    await tester.pump();
    expect(find.byType(CNTabBar), findsOneWidget);
    // « Réduire la transparence » switched on while the app runs.
    LiquidGlassSupport.available.value = false;
    await tester.pump();
    expect(find.byType(CNTabBar), findsNothing);
  });

  group('iOS version', () {
    test('reads the major version iOS reports', () {
      expect(
        LiquidGlassSupport.iosMajorVersion('Version 26.0 (Build 23A341)'),
        26,
      );
      expect(
        LiquidGlassSupport.iosMajorVersion('Version 18.6.2 (Build 22G100)'),
        18,
      );
      expect(LiquidGlassSupport.iosMajorVersion('Version 27 (Build 24A5)'), 27);
      expect(LiquidGlassSupport.iosMajorVersion('unknown'), isNull);
    });
  });
}
