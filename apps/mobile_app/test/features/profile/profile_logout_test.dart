import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/auth/presentation/screens/login_screen.dart';
import 'package:lebontemperament/features/profile/presentation/screens/profile_screen.dart';

import '../../helpers/screen_harness.dart';

/// The header's logout icon used to sign the member out at once.
void main() {
  testWidgets('the logout icon asks first, and « Annuler » keeps the session', (
    tester,
  ) async {
    await pumpScreen(tester, const ProfileScreen());

    await tester.tap(find.byTooltip('Déconnexion'));
    await tester.pumpAndSettle();

    expect(find.text('Se déconnecter ?'), findsOneWidget);
    await tester.tap(find.text('Annuler'));
    await tester.pumpAndSettle();

    expect(find.text('Se déconnecter ?'), findsNothing);
    // Still on the profile: no sign-out ran (it would have thrown without
    // Supabase and shown the error bar).
    expect(
      find.text('Impossible de vous déconnecter. Réessayez.'),
      findsNothing,
    );
    expect(find.text('Zone de danger'), findsOneWidget);
  });

  testWidgets('« Mot de passe oublié ? » opens the website, or says where', (
    tester,
  ) async {
    // url_launcher's method channel answers « no browser »: the bar then names
    // the page to visit.
    final messenger =
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    const channel = MethodChannel('plugins.flutter.io/url_launcher');
    messenger.setMockMethodCallHandler(channel, (call) async => false);
    addTearDown(() => messenger.setMockMethodCallHandler(channel, null));

    await pumpScreen(tester, const LoginScreen());

    await tester.tap(find.text('Mot de passe oublié ?'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(
      find.textContaining('lebontemperament.com/auth/reset-password'),
      findsOneWidget,
    );
    expect(find.text('E-mail'), findsOneWidget);
  });
}
