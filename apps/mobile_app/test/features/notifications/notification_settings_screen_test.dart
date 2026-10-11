import 'dart:ui' show CheckedState, Tristate;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/my_groups_provider.dart';
import 'package:lebontemperament/features/notifications/presentation/providers/notification_settings_provider.dart';
import 'package:lebontemperament/features/notifications/presentation/screens/notification_settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/screen_harness.dart';

/// The notification settings: the pushes for changes to the rehearsals,
/// then one master switch for the reminders, the per-kind switches and the
/// reminder moments, each explained in a line. The « Temps réel » switch was
/// persisted but read by nothing, so it is gone.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('shows the reminder settings without the dead realtime switch', (
    tester,
  ) async {
    await pumpScreen(tester, const NotificationSettingsScreen());

    expect(find.text('Changements de l\'agenda'), findsOneWidget);
    expect(find.text('Activer les rappels'), findsOneWidget);
    expect(find.text('Concerts'), findsOneWidget);
    // One switch for the changes, one for the reminders.
    expect(find.text('Répétitions'), findsNWidgets(2));
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

    for (final label in ['Activer les rappels', 'Concerts', '1 jour avant']) {
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

    await tester.tap(find.text('Activer les rappels'));
    await tester.pumpAndSettle();

    expect(find.text('Vous ne recevrez aucun rappel'), findsOneWidget);
    final details = tester.widget<AnimatedOpacity>(
      find.byType(AnimatedOpacity),
    );
    expect(details.opacity, 0.0);
  });

  testWidgets('the changes switch stays when the reminders are off', (
    tester,
  ) async {
    await pumpScreen(tester, const NotificationSettingsScreen());
    await tester.tap(find.text('Activer les rappels'));
    await tester.pumpAndSettle();

    final container = ProviderScope.containerOf(
      tester.element(find.byType(NotificationSettingsScreen)),
    );
    expect(container.read(rehearsalPushGroupsProvider), isNotEmpty);

    await tester.tap(find.textContaining('déplacée ou annulée'));
    await tester.pumpAndSettle();
    expect(
      container.read(notificationSettingsProvider).rehearsalChangesEnabled,
      isFalse,
    );
    expect(container.read(rehearsalPushGroupsProvider), isEmpty);
  });

  test('the rehearsal pushes follow the ensembles and the switch', () async {
    final container = ProviderContainer(
      overrides: [
        initialMyGroupsProvider.overrideWithValue({GroupType.femmes}),
      ],
    );
    addTearDown(container.dispose);
    await Future<void>.delayed(Duration.zero); // stored settings read

    expect(container.read(rehearsalPushGroupsProvider), {
      GroupType.femmes,
      GroupType.choeurComplet,
      GroupType.tous,
    });
    await container
        .read(notificationSettingsProvider.notifier)
        .toggleRehearsalChangesEnabled();
    expect(container.read(rehearsalPushGroupsProvider), isEmpty);

    // Read back from the phone before Riverpod runs (app start).
    expect(
      await readRehearsalPushGroups(() async => {GroupType.femmes}),
      isEmpty,
    );
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
