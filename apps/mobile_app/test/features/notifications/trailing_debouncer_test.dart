import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/notifications/presentation/providers/notification_scheduler_provider.dart';

/// The reminder scheduler is called on mount, on data changes and on every
/// resume. The old debounce dropped calls inside the window, so the last
/// settings change could go unapplied; the trailing one never drops it.
/// (testWidgets runs under a fake clock, so the timers can be stepped.)
void main() {
  const window = Duration(seconds: 5);

  testWidgets('runs the first call at once', (tester) async {
    final debouncer = TrailingDebouncer(window);
    var runs = 0;
    debouncer(() => runs++);
    expect(runs, 1);
    debouncer.dispose();
  });

  testWidgets('applies the last call of a burst when the window closes', (
    tester,
  ) async {
    final debouncer = TrailingDebouncer(window);
    final seen = <String>[];
    debouncer(() => seen.add('first'));
    await tester.pump(const Duration(seconds: 1));
    debouncer(() => seen.add('second'));
    await tester.pump(const Duration(seconds: 1));
    debouncer(() => seen.add('third'));
    expect(seen, ['first']);

    await tester.pump(const Duration(seconds: 3));
    expect(seen, ['first', 'third']);

    // Nothing else is pending.
    await tester.pump(const Duration(seconds: 10));
    expect(seen, ['first', 'third']);
    debouncer.dispose();
  });

  testWidgets('runs a call made after the window at once', (tester) async {
    final debouncer = TrailingDebouncer(window);
    var runs = 0;
    debouncer(() => runs++);
    await tester.pump(const Duration(seconds: 6));
    debouncer(() => runs++);
    expect(runs, 2);
    debouncer.dispose();
  });

  testWidgets('dispose drops the pending call', (tester) async {
    final debouncer = TrailingDebouncer(window);
    var runs = 0;
    debouncer(() => runs++);
    debouncer(() => runs++);
    debouncer.dispose();
    await tester.pump(const Duration(seconds: 10));
    expect(runs, 1);
  });
}
