import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/features/notifications/presentation/screens/notification_settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../helpers/screen_harness.dart';

/// A switch that is on must show its knob: the thumb and the track can't
/// share a colour (2.0.131 painted both teal, so « on » looked like a pill).
void main() {
  setUp(() {
    GoogleFonts.config.allowRuntimeFetching = false;
    SharedPreferences.setMockInitialValues({});
  });

  for (final (name, buildTheme) in [
    ('light', () => AppTheme.lightTheme),
    ('dark', () => AppTheme.darkTheme),
  ]) {
    testWidgets('the $name theme draws the knob of an « on » switch', (
      tester,
    ) async {
      final theme = buildTheme();
      const on = {WidgetState.selected};
      final thumb = theme.switchTheme.thumbColor!.resolve(on);
      final track = theme.switchTheme.trackColor!.resolve(on);
      expect(thumb, isNot(track));
    });
  }

  testWidgets('the notification switches keep the theme colours', (
    tester,
  ) async {
    await pumpScreen(tester, const NotificationSettingsScreen());
    final switches = tester.widgetList<Switch>(find.byType(Switch));
    expect(switches, isNotEmpty);
    for (final s in switches) {
      expect(s.activeThumbColor, isNull);
      expect(s.activeTrackColor, isNull);
    }
  });
}
