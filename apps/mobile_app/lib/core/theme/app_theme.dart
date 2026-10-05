import 'package:flutter/material.dart';

import 'app_fonts.dart';

/// Direction « Coulisses » (chosen 2026-10-05): a dark backstage ground with
/// the brand's teal, large type and generous targets, because many members
/// read the app at arm's length. Dark is the default; the light variant keeps
/// the same layout and type for those who prefer it.
///
/// Every text/background pair below is at least 4.5:1 (measured), and borders
/// at least 3:1 against their ground.
class AppTheme {
  AppTheme._();

  // Brand teal, kept for places that need the historical colour (icons,
  // splash). Screens should read `Theme.of(context).colorScheme` instead.
  static const Color primaryColor = Color(0xFF1A878D);

  // --- Coulisses, dark ---
  static const Color stage = Color(0xFF0D1517); // page ground
  static const Color stageSurface = Color(0xFF152124); // cards
  static const Color stageRaised = Color(0xFF1B2A2D);
  static const Color stageHighest = Color(0xFF223437);
  static const Color stageBorder = Color(0xFF2A3B3E);
  static const Color stageText = Color(0xFFE9F1F0); // 16.1:1 on stage
  static const Color stageMuted = Color(
    0xFFA9BABB,
  ); // 9.2:1 on stage, 8.2:1 on cards
  static const Color stageTeal = Color(
    0xFF3FB8BE,
  ); // 7.8:1 on stage, 6.9:1 on cards
  static const Color stageTealDeep = Color(0xFF1A3033); // selected cards

  // --- Coulisses, light ---
  static const Color paper = Color(0xFFF3F7F7);
  static const Color paperText = Color(0xFF0D1517);
  static const Color paperMuted = Color(0xFF3F5153); // 7.7:1 on paper
  static const Color paperTeal = Color(
    0xFF0F6E73,
  ); // 5.6:1 on paper, 6.0:1 on white
  static const Color paperBorder = Color(0xFFCBD7D8);

  // Feedback text on the pastel feedback backgrounds below (toasts, badges).
  //  - successText on successBackground: 4.56:1 (on white 5.13:1)
  //  - errorText on errorBackground: 4.92:1 (on white 5.62:1)
  //  - warningText on warningBackground: 5.11:1 (on white 5.60:1)
  static const Color successBackground = Color(0xFFE8F5E9); // green 50
  static const Color successText = Color(0xFF2E7D32); // green 800
  static const Color errorBackground = Color(0xFFFFEBEE); // red 50
  static const Color errorText = Color(0xFFC62828); // red 800
  static const Color warningBackground = Color(0xFFFFF3E0); // orange 50
  static const Color warningText = Color(0xFFBF360C); // deep orange 900

  static const ColorScheme darkScheme = ColorScheme(
    brightness: Brightness.dark,
    primary: stageTeal,
    onPrimary: stage,
    primaryContainer: stageTealDeep,
    onPrimaryContainer: Color(0xFFBDEBEC),
    secondary: Color(0xFF9FC9CB),
    onSecondary: stage,
    secondaryContainer: Color(0xFF22383B),
    onSecondaryContainer: Color(0xFFD5ECEC),
    tertiary: Color(0xFFE2B85C),
    onTertiary: stage,
    tertiaryContainer: Color(0xFF3A3020),
    onTertiaryContainer: Color(0xFFF3DDA8),
    error: Color(0xFFFF8A80),
    onError: stage,
    errorContainer: Color(0xFF4A1F1C),
    onErrorContainer: Color(0xFFFFDAD5),
    surface: stage,
    onSurface: stageText,
    onSurfaceVariant: stageMuted,
    surfaceDim: stage,
    surfaceBright: Color(0xFF26393C),
    surfaceContainerLowest: Color(0xFF0A1113),
    surfaceContainerLow: Color(0xFF111B1E),
    surfaceContainer: stageSurface,
    surfaceContainerHigh: stageRaised,
    surfaceContainerHighest: stageHighest,
    outline: Color(0xFF6B8183),
    outlineVariant: stageBorder,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: stageText,
    onInverseSurface: stage,
    inversePrimary: Color(0xFF156C71),
  );

  static const ColorScheme lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: paperTeal,
    onPrimary: Colors.white,
    primaryContainer: Color(0xFFCDEDEE),
    onPrimaryContainer: Color(0xFF0A3F42),
    secondary: Color(0xFF3D6567),
    onSecondary: Colors.white,
    secondaryContainer: Color(0xFFDCEBEC),
    onSecondaryContainer: Color(0xFF1E3A3C),
    tertiary: Color(0xFF8A6514),
    onTertiary: Colors.white,
    tertiaryContainer: Color(0xFFF6E7C4),
    onTertiaryContainer: Color(0xFF4A3507),
    error: Color(0xFFB3261E),
    onError: Colors.white,
    errorContainer: Color(0xFFF9DEDC),
    onErrorContainer: Color(0xFF5C1611),
    surface: paper,
    onSurface: paperText,
    onSurfaceVariant: paperMuted,
    surfaceDim: Color(0xFFDDE5E5),
    surfaceBright: Colors.white,
    surfaceContainerLowest: Colors.white,
    surfaceContainerLow: Color(0xFFF8FBFB),
    surfaceContainer: Colors.white,
    surfaceContainerHigh: Color(0xFFE8EFEF),
    surfaceContainerHighest: Color(0xFFDEE7E7),
    outline: Color(0xFF6F8183),
    outlineVariant: paperBorder,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: Color(0xFF1B2A2D),
    onInverseSurface: stageText,
    inversePrimary: stageTeal,
  );

  static ThemeData get darkTheme => _build(darkScheme, StageColors.dark);
  static ThemeData get lightTheme => _build(lightScheme, StageColors.light);

  static TextTheme _textTheme(ColorScheme s) {
    TextStyle d(double size, [FontWeight w = FontWeight.w700]) =>
        AppFonts.display(fontSize: size, fontWeight: w, color: s.onSurface);
    TextStyle t(double size, FontWeight w, [Color? c]) => AppFonts.sans(
      color: c ?? s.onSurface,
    ).copyWith(fontSize: size, fontWeight: w);
    return TextTheme(
      displayLarge: d(40, FontWeight.w800),
      displayMedium: d(34, FontWeight.w800),
      displaySmall: d(28, FontWeight.w800),
      headlineLarge: d(26),
      headlineMedium: d(23),
      headlineSmall: d(20),
      titleLarge: d(19, FontWeight.w600),
      titleMedium: t(17, FontWeight.w600),
      titleSmall: t(15, FontWeight.w600),
      bodyLarge: t(17, FontWeight.w400),
      bodyMedium: t(15, FontWeight.w400),
      bodySmall: t(13, FontWeight.w400, s.onSurfaceVariant),
      labelLarge: t(15, FontWeight.w700),
      labelMedium: t(13, FontWeight.w600),
      labelSmall: t(13, FontWeight.w600),
    );
  }

  static ThemeData _build(ColorScheme s, StageColors stageColors) {
    final text = _textTheme(s);
    const pill = StadiumBorder();
    return ThemeData(
      useMaterial3: true,
      colorScheme: s,
      scaffoldBackgroundColor: s.surface,
      canvasColor: s.surface,
      textTheme: text,
      extensions: [stageColors],
      iconTheme: IconThemeData(color: s.onSurfaceVariant, size: 24),
      dividerTheme: DividerThemeData(color: s.outlineVariant, thickness: 1),
      cardTheme: CardThemeData(
        elevation: 0,
        color: s.surfaceContainer,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: s.outlineVariant),
        ),
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: s.surface,
        foregroundColor: s.onSurface,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
        titleTextStyle: AppFonts.display(
          fontSize: 21,
          fontWeight: FontWeight.w700,
          color: s.onSurface,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(64, 52),
          shape: pill,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: text.labelLarge,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          backgroundColor: s.primary,
          foregroundColor: s.onPrimary,
          minimumSize: const Size(64, 52),
          shape: pill,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: text.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: s.onSurface,
          minimumSize: const Size(64, 52),
          shape: pill,
          side: BorderSide(color: s.outline),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: text.labelLarge,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: s.primary,
          minimumSize: const Size(48, 48),
          textStyle: text.labelLarge,
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: s.primary,
        foregroundColor: s.onPrimary,
        elevation: 0,
        shape: pill,
      ),
      chipTheme: ChipThemeData(
        shape: pill,
        side: BorderSide(color: s.outlineVariant),
        backgroundColor: Colors.transparent,
        selectedColor: s.primary,
        secondarySelectedColor: s.primary,
        labelStyle: text.labelMedium,
        secondaryLabelStyle: text.labelMedium?.copyWith(color: s.onPrimary),
        checkmarkColor: s.onPrimary,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: s.surfaceContainer,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 16,
        ),
        labelStyle: text.bodyMedium?.copyWith(color: s.onSurfaceVariant),
        hintStyle: text.bodyMedium?.copyWith(color: s.onSurfaceVariant),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: s.outlineVariant),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: s.outlineVariant),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: s.primary, width: 2),
        ),
      ),
      listTileTheme: ListTileThemeData(
        minVerticalPadding: 12,
        iconColor: s.onSurfaceVariant,
        titleTextStyle: text.titleMedium,
        subtitleTextStyle: text.bodyMedium?.copyWith(color: s.onSurfaceVariant),
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: s.onSurface,
        unselectedLabelColor: s.onSurfaceVariant,
        labelStyle: text.labelLarge,
        unselectedLabelStyle: text.labelLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
        indicatorColor: s.primary,
        dividerColor: s.outlineVariant,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: s.inverseSurface,
        contentTextStyle: text.bodyMedium?.copyWith(color: s.onInverseSurface),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: s.surfaceContainer,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titleTextStyle: text.headlineSmall,
        contentTextStyle: text.bodyMedium,
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: s.surfaceContainer,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: s.primary),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith(
          (states) =>
              states.contains(WidgetState.selected) ? s.onPrimary : s.outline,
        ),
        trackColor: WidgetStateProperty.resolveWith(
          (states) => states.contains(WidgetState.selected)
              ? s.primary
              : s.surfaceContainerHighest,
        ),
      ),
    );
  }

  // Helpers kept for existing call sites.
  static Color betaTileBackground(Brightness brightness) {
    return brightness == Brightness.dark ? stageSurface : Colors.white;
  }

  static Color betaTileBorder(Brightness brightness) {
    return brightness == Brightness.dark ? stageBorder : paperBorder;
  }

  static Color withOpacity(Color color, double opacity) {
    return color.withValues(alpha: opacity);
  }

  static Color getSubtleBackgroundColor(BuildContext context) {
    return Theme.of(context).colorScheme.primary.withValues(alpha: 0.08);
  }

  static Color getSubtleBorderColor(BuildContext context) {
    return Theme.of(context).colorScheme.outlineVariant;
  }
}

/// Colours the Material scheme has no slot for: one per rehearsal group, so a
/// member spots their own rehearsals at a glance, in both variants.
@immutable
class StageColors extends ThemeExtension<StageColors> {
  const StageColors({
    required this.orchestre,
    required this.hommes,
    required this.femmes,
    required this.jeunes,
    required this.tutti,
  });

  final Color orchestre;
  final Color hommes;
  final Color femmes;
  final Color jeunes;

  /// Whole choir and « Tous »: the accent itself.
  final Color tutti;

  // Dark: each at least 7.6:1 on cards (measured).
  static const dark = StageColors(
    orchestre: Color(0xFFE2B85C),
    hommes: Color(0xFF8FB8F0),
    femmes: Color(0xFFE59BBE),
    jeunes: Color(0xFF8FD18A),
    tutti: AppTheme.stageTeal,
  );

  // Light: each at least 6.1:1 on white cards (measured).
  static const light = StageColors(
    orchestre: Color(0xFF7A5810),
    hommes: Color(0xFF2E5C9E),
    femmes: Color(0xFF9E3A69),
    jeunes: Color(0xFF2F6F2B),
    tutti: AppTheme.paperTeal,
  );

  static StageColors of(BuildContext context) =>
      Theme.of(context).extension<StageColors>() ?? dark;

  @override
  StageColors copyWith({
    Color? orchestre,
    Color? hommes,
    Color? femmes,
    Color? jeunes,
    Color? tutti,
  }) => StageColors(
    orchestre: orchestre ?? this.orchestre,
    hommes: hommes ?? this.hommes,
    femmes: femmes ?? this.femmes,
    jeunes: jeunes ?? this.jeunes,
    tutti: tutti ?? this.tutti,
  );

  @override
  StageColors lerp(StageColors? other, double t) {
    if (other == null) return this;
    return StageColors(
      orchestre: Color.lerp(orchestre, other.orchestre, t)!,
      hommes: Color.lerp(hommes, other.hommes, t)!,
      femmes: Color.lerp(femmes, other.femmes, t)!,
      jeunes: Color.lerp(jeunes, other.jeunes, t)!,
      tutti: Color.lerp(tutti, other.tutti, t)!,
    );
  }
}
