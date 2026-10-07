import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

/// Decides whether the app draws Liquid Glass (#549).
///
/// The app still installs from iOS 15. Only iPhones on iOS 26 or later get
/// the glass tab bar, the version where Apple's own system UI (keyboard,
/// share sheet, alerts) is glass too; every other device keeps « Portée »
/// as it is. The iPhone's « Réduire la transparence » setting turns the
/// glass off, like it does for Apple's apps, and so does « Augmenter le
/// contraste » (checked by the widgets through `MediaQuery.highContrast`).
class LiquidGlassSupport {
  LiquidGlassSupport._();

  /// First iOS version that ships Liquid Glass.
  static const int minIosVersion = 26;

  static const MethodChannel _channel = MethodChannel(
    'lebontemperament/accessibility',
  );

  static bool _platformSupported = false;
  static final ValueNotifier<bool> _reduceTransparency = ValueNotifier(false);

  /// Forces the answer in tests and screenshots; null follows the device.
  @visibleForTesting
  static bool? debugOverride;

  /// True when the device can draw the glass and the member hasn't asked
  /// for less transparency. Listen to it: the setting can change while the
  /// app runs.
  static final ValueNotifier<bool> available = ValueNotifier(false);

  /// Reads the iOS version and the transparency setting. Never throws: on
  /// any failure the app keeps the regular bar.
  static Future<void> init() async {
    if (kIsWeb || !Platform.isIOS) return;
    final major = iosMajorVersion(Platform.operatingSystemVersion);
    _platformSupported = major != null && major >= minIosVersion;
    if (!_platformSupported) return;

    _channel.setMethodCallHandler((call) async {
      if (call.method == 'reduceTransparencyChanged') {
        _reduceTransparency.value = call.arguments == true;
        _update();
      }
    });
    try {
      _reduceTransparency.value =
          await _channel.invokeMethod<bool>('reduceTransparency') ?? false;
    } catch (e) {
      debugPrint('Liquid Glass off: $e');
      _platformSupported = false;
    }
    _update();
  }

  static void _update() {
    available.value = _platformSupported && !_reduceTransparency.value;
  }

  /// Whether to draw the glass now, given the screen's accessibility state.
  static bool enabledFor({required bool highContrast}) {
    final override = debugOverride;
    if (override != null) return override;
    return available.value && !highContrast;
  }

  /// The major iOS version in `Platform.operatingSystemVersion`, which reads
  /// like « Version 26.0 (Build 23A341) ». Null when it can't be read.
  @visibleForTesting
  static int? iosMajorVersion(String operatingSystemVersion) {
    final match = RegExp(r"(\d+)(?:\.\d+)*").firstMatch(operatingSystemVersion);
    return match == null ? null : int.tryParse(match.group(1)!);
  }
}
