// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.
//
// Note: Full app test (LeBonTemperamentApp) requires SupabaseConfig.initialize(),
// DependencyInjection.init(), and NotificationService.initialize() to run first.
// This test verifies ProviderScope and Riverpod integration work correctly.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  testWidgets('ProviderScope and Consumer work correctly', (WidgetTester tester) async {
    final testProvider = Provider<int>((ref) => 42);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: Consumer(
            builder: (context, ref, _) {
              final value = ref.watch(testProvider);
              return Text('Value: $value');
            },
          ),
        ),
      ),
    );

    expect(find.text('Value: 42'), findsOneWidget);
  });
}
