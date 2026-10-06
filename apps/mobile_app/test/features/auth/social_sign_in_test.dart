import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/auth/data/services/auth_service.dart';
import 'package:lebontemperament/features/auth/presentation/screens/login_screen.dart';
import 'package:lebontemperament/features/auth/presentation/widgets/google_logo.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../helpers/screen_harness.dart';

/// « Continuer avec Google » on both platforms, « Continuer avec Apple » on
/// iOS only, and a Google or Apple account that matches no member is told so.
void main() {
  group('parseOAuthCallback', () {
    test('reads the PKCE code Supabase sends back', () {
      final callback = parseOAuthCallback('$oauthRedirectUrl?code=abc-123');
      expect(callback.code, 'abc-123');
      expect(callback.error, isNull);
    });

    test('reads an error from the query or the fragment', () {
      expect(
        parseOAuthCallback(
          '$oauthRedirectUrl?error=access_denied&error_code=signup_disabled',
        ).error,
        'signup_disabled',
      );
      final fromFragment = parseOAuthCallback(
        '$oauthRedirectUrl#error=server_error&error_description=Oops',
      );
      expect(fromFragment.code, isNull);
      expect(fromFragment.error, 'server_error');
    });

    test('the redirect uses the app\'s own scheme', () {
      expect(Uri.parse(oauthRedirectUrl).scheme, oauthCallbackScheme);
    });
  });

  test('a closed sign-up is « not a member », not a wrong password', () {
    expect(
      classifySignInError(
        AuthApiException(
          'Signups not allowed for this instance',
          statusCode: '422',
          code: 'signup_disabled',
        ),
      ),
      SignInFailure.notMember,
    );
    expect(
      const SignInException(SignInFailure.notMember).message,
      contains('aucun membre'),
    );
  });

  testWidgets('Android shows Google and no Apple button', (tester) async {
    await pumpScreen(tester, const LoginScreen());
    await tester.pumpAndSettle();

    expect(find.text('Continuer avec Google'), findsOneWidget);
    expect(find.byType(GoogleLogo), findsOneWidget);
    expect(find.byType(SignInWithAppleButton), findsNothing);
  });

  testWidgets('iOS shows Google and Apple', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    addTearDown(() => debugDefaultTargetPlatformOverride = null);
    await pumpScreen(tester, const LoginScreen());
    await tester.pumpAndSettle();

    expect(find.text('Continuer avec Google'), findsOneWidget);
    expect(find.byType(SignInWithAppleButton), findsOneWidget);
    expect(find.text('Continuer avec Apple'), findsOneWidget);
    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('the Google mark paints', (tester) async {
    await tester.pumpWidget(
      const Directionality(
        textDirection: TextDirection.ltr,
        child: Center(child: GoogleLogo(size: 48)),
      ),
    );
    expect(tester.getSize(find.byType(GoogleLogo)), const Size(48, 48));
  });
}
