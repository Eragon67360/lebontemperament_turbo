import 'dart:ui' show CheckedState, Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/notifications/presentation/screens/notification_settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/screen_harness.dart';

/// The notification settings: one master switch for the reminders, the
/// per-kind switches and the reminder moments. The « Temps réel » switch
/// was persisted but read by nothing, so it is gone.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('shows the reminder settings without the dead realtime switch', (
    tester,
  ) async {
    await pumpScreen(tester, const NotificationSettingsScreen());

    expect(find.text('Activer les notifications'), findsOneWidget);
    expect(find.text('Rappels programmés'), findsOneWidget);
    expect(find.text('Concerts'), findsOneWidget);
    expect(find.text('Répétitions'), findsOneWidget);
    expect(find.text('1 jour avant'), findsOneWidget);
    expect(find.textContaining('Temps'), findsNothing);
    expect(find.textContaining('Instantanées'), findsNothing);
  });

  testWidgets('every switch and checkbox is read with its label', (
    tester,
  ) async {
    final handle = tester.ensureSemantics();
    await pumpScreen(tester, const NotificationSettingsScreen());
    // The semantics tree lags the last entrance animation frame.
    await tester.pumpAndSettle();

    for (final label in [
      'Activer les notifications',
      'Concerts',
      '1 jour avant',
    ]) {
      // Same shape as SwitchListTile on this Flutter: one tappable node
      // carrying the label, whose only child is the toggled control.
      final row = tester.getSemantics(find.text(label));
      expect(row.label, contains(label));
      var controls = 0;
      row.visitChildren((child) {
        final flags = child.flagsCollection;
        if (flags.isToggled != Tristate.none ||
            flags.isChecked != CheckedState.none) {
          controls++;
        }
        return true;
      });
      expect(controls, 1, reason: '« $label » must be read with its control');
    }
    handle.dispose();
  });

  testWidgets('switching the master switch off hides the details', (
    tester,
  ) async {
    await pumpScreen(tester, const NotificationSettingsScreen());
    expect(find.text('Vous ne recevrez aucun rappel'), findsNothing);

    await tester.tap(find.byType(Switch).first);
    await tester.pumpAndSettle();

    expect(find.text('Vous ne recevrez aucun rappel'), findsOneWidget);
    final details = tester.widget<AnimatedOpacity>(
      find.byType(AnimatedOpacity),
    );
    expect(details.opacity, 0.0);
  });

  testWidgets('survives a 2x text scale', (tester) async {
    await pumpScreen(
      tester,
      const NotificationSettingsScreen(),
      textScale: 2.0,
    );
    expect(tester.takeException(), isNull);
  });
}
