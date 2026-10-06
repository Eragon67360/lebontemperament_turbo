import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/platform/liquid_glass_support.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/features/main/presentation/screens/main_screen.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';

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

  for (final glass in const [false, true]) {
    for (final scale in const [1.0, 1.5, 2.0]) {
      testWidgets('labels stay whole at ${scale}x on a 360 dp phone'
          '${glass ? ' (Liquid Glass)' : ''}', (tester) async {
        LiquidGlassSupport.debugOverride = glass;
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
        expect(
          find.byType(LiquidGlassLens),
          glass ? findsOneWidget : findsNothing,
        );
      });
    }
  }

  testWidgets('a tap on a glass tab selects it', (tester) async {
    LiquidGlassSupport.debugOverride = true;
    int? tapped;
    GoogleFonts.config.allowRuntimeFetching = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.darkTheme,
        home: Scaffold(
          body: Stack(
            children: [
              FrostedGlassNavBar(
                items: kMainNavItems,
                currentIndex: 0,
                onTap: (i) => tapped = i,
              ),
            ],
          ),
        ),
      ),
    );
    await tester.tap(find.text('Calendrier'));
    expect(tapped, 2);
  });

  testWidgets('Increase Contrast keeps the plain bar on iOS 26', (
    tester,
  ) async {
    LiquidGlassSupport.available.value = true;
    await pumpBar(tester, 1.0, highContrast: true);
    expect(find.byType(LiquidGlassLens), findsNothing);
  });

  testWidgets('the glass bar shows once the device supports it', (
    tester,
  ) async {
    await pumpBar(tester, 1.0);
    expect(find.byType(LiquidGlassLens), findsNothing);
    LiquidGlassSupport.available.value = true;
    await tester.pump();
    expect(find.byType(LiquidGlassLens), findsOneWidget);
    // « Réduire la transparence » switched on while the app runs.
    LiquidGlassSupport.available.value = false;
    await tester.pump();
    expect(find.byType(LiquidGlassLens), findsNothing);
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

  group('glass tint keeps the labels readable', () {
    double luminance(Color c) => c.computeLuminance();
    double contrast(Color a, Color b) {
      final la = luminance(a), lb = luminance(b);
      final hi = la > lb ? la : lb, lo = la > lb ? lb : la;
      return (hi + 0.05) / (lo + 0.05);
    }

    // Mid-grey content under the bar: what a blurred photo or a busy list
    // averages to.
    const grey = Color(0xFF808080);
    for (final dark in const [true, false]) {
      test(dark ? 'dark theme' : 'light theme', () {
        final scheme = dark ? AppTheme.darkScheme : AppTheme.lightScheme;
        final alpha = dark ? kNavGlassTintDark : kNavGlassTintLight;
        for (final under in [grey, scheme.surface, scheme.surfaceContainer]) {
          final glass = Color.alphaBlend(
            scheme.surface.withValues(alpha: alpha),
            under,
          );
          for (final label in [scheme.onSurfaceVariant, scheme.primary]) {
            expect(
              contrast(label, glass),
              greaterThanOrEqualTo(4.5),
              reason: '$label over $under',
            );
          }
        }
      });
    }
  });
}
