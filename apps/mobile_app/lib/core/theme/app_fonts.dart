import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// The app's two typefaces (« Coulisses », lightened to « Portée »), bundled
/// under `assets/google_fonts` so nothing is fetched at runtime:
/// - Instrument Sans for running text,
/// - Bricolage Grotesque for titles and big numbers.
///
/// [sans] is a drop-in for the `GoogleFonts.poppins(...)` calls the screens
/// used. It keeps the sizes the screens ask for (older members who want
/// bigger text get it from the system text size, which the app follows),
/// never renders under [minSize], and switches bold text of 20 pt and more
/// to the display face.
class AppFonts {
  AppFonts._();

  /// Smallest size the app renders text at, before the system text scale.
  static const double minSize = 13;

  static TextStyle sans({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    double? height,
    double? letterSpacing,
    FontStyle? fontStyle,
    TextDecoration? decoration,
  }) {
    final size = fontSize == null ? null : readableSize(fontSize);
    final weight = fontWeight ?? FontWeight.w400;
    if (size != null && size >= 20 && weight.value >= 600) {
      return display(
        color: color,
        fontSize: size,
        fontWeight: weight,
        height: height,
        letterSpacing: letterSpacing,
      );
    }
    return GoogleFonts.instrumentSans(
      color: color,
      fontSize: size,
      fontWeight: fontWeight,
      height: height,
      letterSpacing: letterSpacing,
      fontStyle: fontStyle,
      decoration: decoration,
    );
  }

  static TextStyle display({
    Color? color,
    double? fontSize,
    FontWeight? fontWeight,
    double? height,
    double? letterSpacing,
  }) {
    return GoogleFonts.bricolageGrotesque(
      color: color,
      fontSize: fontSize,
      fontWeight: displayWeight(fontWeight ?? FontWeight.w700),
      height: height,
      letterSpacing:
          letterSpacing ?? (fontSize != null && fontSize >= 28 ? -0.5 : null),
    );
  }

  /// « Portée » (chosen 2026-10-05): titles one or two steps lighter than
  /// the weights the screens ask for, so the app reads « léger » without
  /// touching every call site. 400–600 are bundled.
  static FontWeight displayWeight(FontWeight requested) =>
      switch (requested.value) {
        >= 800 => FontWeight.w600,
        >= 500 => FontWeight.w500,
        _ => FontWeight.w400,
      };

  /// Sizes the screens ask for, mapped to what the app renders: never under
  /// [minSize].
  static double readableSize(double requested) =>
      requested < minSize ? minSize : requested;
}
