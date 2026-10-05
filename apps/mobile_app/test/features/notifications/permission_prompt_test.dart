import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/notifications/presentation/providers/notification_settings_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The explanatory notification screen is shown once per install: after an
/// answer (or a skip) a signed-out cold start goes to the login.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('is not answered on a fresh install', () async {
    SharedPreferences.setMockInitialValues({});
    expect(await NotificationPermissionPrompt.wasAnswered(), isFalse);
  });

  test('stays answered once marked', () async {
    SharedPreferences.setMockInitialValues({});
    await NotificationPermissionPrompt.markAnswered();
    expect(await NotificationPermissionPrompt.wasAnswered(), isTrue);
  });
}
