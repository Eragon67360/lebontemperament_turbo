import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/profile/data/password_service.dart';
import 'package:lebontemperament/features/profile/data/profile_photo_service.dart';
import 'package:lebontemperament/features/profile/presentation/screens/change_password_screen.dart';
import 'package:lebontemperament/features/profile/presentation/screens/profile_screen.dart';
import 'package:lebontemperament/features/profile/presentation/widgets/profile_photo_editor.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../helpers/screen_harness.dart';

final _jpeg = Uint8List.fromList([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

class _FakePhotoService extends ProfilePhotoService {
  _FakePhotoService({this.error});

  final ProfilePhotoException? error;
  final List<Uint8List> uploads = [];
  int removals = 0;

  @override
  Future<String> upload(Uint8List bytes) async {
    if (error != null) throw error!;
    uploads.add(bytes);
    return 'https://example.test/photo.jpg';
  }

  @override
  Future<void> remove() async => removals++;
}

class _FakePasswordService extends PasswordService {
  _FakePasswordService({this.error});

  final PasswordChangeException? error;
  final List<(String?, String)> calls = [];

  @override
  Future<void> change({String? current, required String next}) async {
    calls.add((current, next));
    if (error != null) throw error!;
  }
}

/// Opens the password screen from a button, so a successful save can pop.
class _Opener extends StatelessWidget {
  const _Opener();

  @override
  Widget build(BuildContext context) => Scaffold(
    body: Center(
      child: TextButton(
        onPressed: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const ChangePasswordScreen())),
        child: const Text('Ouvrir'),
      ),
    ),
  );
}

Future<void> _fill(WidgetTester tester, String label, String text) =>
    tester.enterText(find.widgetWithText(TextFormField, label), text);

void main() {
  group('Profil › Mon compte', () {
    testWidgets('offers the photo and the password, and explains the name', (
      tester,
    ) async {
      final semantics = tester.ensureSemantics();
      await pumpScreen(tester, const ProfileScreen());

      expect(find.text('Mon compte'), findsOneWidget);
      expect(find.text('Photo de profil'), findsOneWidget);
      expect(find.text('Mot de passe'), findsOneWidget);
      expect(
        find.textContaining('Votre nom vient de la liste'),
        findsOneWidget,
      );
      expect(
        find.bySemanticsLabel('Changer la photo de profil'),
        findsOneWidget,
      );
      semantics.dispose();
    });

    testWidgets('a photo picked from the gallery is uploaded', (tester) async {
      final photos = _FakePhotoService();
      final picked = <String>[];
      await pumpScreen(
        tester,
        const ProfileScreen(),
        overrides: [
          profilePhotoServiceProvider.overrideWithValue(photos),
          pickProfilePhotoProvider.overrideWithValue((source) async {
            picked.add(source.name);
            return _jpeg;
          }),
        ],
      );

      await tester.tap(find.byType(ProfilePhotoButton));
      await tester.pumpAndSettle();
      expect(find.text('Prendre une photo'), findsOneWidget);
      // No photo yet: nothing to remove.
      expect(find.text('Retirer la photo'), findsNothing);

      await tester.tap(find.text('Choisir dans la galerie'));
      await tester.pumpAndSettle();

      expect(picked, ['gallery']);
      expect(photos.uploads.single, _jpeg);
      expect(find.text('Photo de profil mise à jour.'), findsOneWidget);
    });

    testWidgets('a cancelled pick sends nothing', (tester) async {
      final photos = _FakePhotoService();
      await pumpScreen(
        tester,
        const ProfileScreen(),
        overrides: [
          profilePhotoServiceProvider.overrideWithValue(photos),
          pickProfilePhotoProvider.overrideWithValue((_) async => null),
        ],
      );

      await tester.tap(find.text('Photo de profil'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Prendre une photo'));
      await tester.pumpAndSettle();

      expect(photos.uploads, isEmpty);
      expect(find.byType(SnackBar), findsNothing);
    });

    testWidgets('a refused upload says why', (tester) async {
      await pumpScreen(
        tester,
        const ProfileScreen(),
        overrides: [
          profilePhotoServiceProvider.overrideWithValue(
            _FakePhotoService(
              error: const ProfilePhotoException(
                'Type de fichier non autorisé',
              ),
            ),
          ),
          pickProfilePhotoProvider.overrideWithValue((_) async => _jpeg),
        ],
      );

      await tester.tap(find.text('Photo de profil'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Choisir dans la galerie'));
      await tester.pumpAndSettle();

      expect(find.text('Type de fichier non autorisé'), findsOneWidget);
    });
  });

  group('Profil › Mot de passe', () {
    testWidgets('checks the form before sending anything', (tester) async {
      final passwords = _FakePasswordService();
      await pumpScreen(
        tester,
        const ChangePasswordScreen(),
        overrides: [passwordServiceProvider.overrideWithValue(passwords)],
      );

      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(find.text('Saisissez votre mot de passe actuel.'), findsOneWidget);

      await _fill(tester, 'Mot de passe actuel', 'ancien-mdp');
      await _fill(tester, 'Nouveau mot de passe', 'abc');
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(find.text('Au moins 6 caractères.'), findsWidgets);

      await _fill(tester, 'Nouveau mot de passe', 'nouveau-mdp');
      await _fill(tester, 'Confirmer le nouveau mot de passe', 'autre-mdp');
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();
      expect(
        find.text('Les deux mots de passe ne correspondent pas.'),
        findsOneWidget,
      );
      expect(passwords.calls, isEmpty);
    });

    testWidgets('a wrong current password is said plainly', (tester) async {
      final passwords = _FakePasswordService(
        error: const PasswordChangeException(
          PasswordChangeFailure.wrongCurrent,
        ),
      );
      await pumpScreen(
        tester,
        const ChangePasswordScreen(),
        overrides: [passwordServiceProvider.overrideWithValue(passwords)],
      );

      await _fill(tester, 'Mot de passe actuel', 'ancien-mdp');
      await _fill(tester, 'Nouveau mot de passe', 'nouveau-mdp');
      await _fill(tester, 'Confirmer le nouveau mot de passe', 'nouveau-mdp');
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();

      expect(passwords.calls, [('ancien-mdp', 'nouveau-mdp')]);
      expect(find.text('Mot de passe actuel incorrect.'), findsOneWidget);
    });

    testWidgets('a saved password closes the screen and says so', (
      tester,
    ) async {
      final passwords = _FakePasswordService();
      await pumpScreen(
        tester,
        const _Opener(),
        overrides: [passwordServiceProvider.overrideWithValue(passwords)],
      );
      await tester.tap(find.text('Ouvrir'));
      await tester.pumpAndSettle();

      await _fill(tester, 'Mot de passe actuel', 'ancien-mdp');
      await _fill(tester, 'Nouveau mot de passe', 'nouveau-mdp');
      await _fill(tester, 'Confirmer le nouveau mot de passe', 'nouveau-mdp');
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();

      expect(find.byType(ChangePasswordScreen), findsNothing);
      expect(find.text('Mot de passe modifié.'), findsOneWidget);
    });

    testWidgets('Google or Apple only: creates a password, no current one', (
      tester,
    ) async {
      final passwords = _FakePasswordService();
      await pumpScreen(
        tester,
        const ChangePasswordScreen(),
        overrides: [
          passwordServiceProvider.overrideWithValue(passwords),
          accountHasPasswordProvider.overrideWithValue(false),
        ],
      );

      expect(find.text('Créer un mot de passe'), findsOneWidget);
      expect(find.text('Mot de passe actuel'), findsNothing);

      await _fill(tester, 'Nouveau mot de passe', 'nouveau-mdp');
      await _fill(tester, 'Confirmer le nouveau mot de passe', 'nouveau-mdp');
      await tester.tap(find.text('Enregistrer'));
      await tester.pumpAndSettle();

      expect(passwords.calls, [(null, 'nouveau-mdp')]);
    });
  });

  group('password rules', () {
    test('an account with an e-mail identity has a password', () {
      User user(Map<String, dynamic> appMetadata) => User(
        id: 'user-test',
        appMetadata: appMetadata,
        userMetadata: const {},
        aud: 'authenticated',
        createdAt: '2026-01-01T00:00:00Z',
      );
      expect(hasPasswordSignIn(null), isTrue);
      expect(
        hasPasswordSignIn(
          user({
            'providers': ['email', 'google'],
          }),
        ),
        isTrue,
      );
      expect(
        hasPasswordSignIn(
          user({
            'providers': ['google'],
          }),
        ),
        isFalse,
      );
      expect(
        hasPasswordSignIn(
          user({
            'providers': ['apple'],
          }),
        ),
        isFalse,
      );
      expect(hasPasswordSignIn(user(const {})), isTrue);
    });

    test('Supabase errors become plain reasons', () {
      expect(
        classifyPasswordUpdateError(
          const AuthApiException('x', code: 'same_password'),
        ),
        PasswordChangeFailure.samePassword,
      );
      expect(
        classifyPasswordUpdateError(
          const AuthApiException('x', code: 'reauthentication_needed'),
        ),
        PasswordChangeFailure.reauthenticate,
      );
      expect(
        classifyPasswordUpdateError(AuthRetryableFetchException()),
        PasswordChangeFailure.network,
      );
      expect(
        classifyPasswordUpdateError(Exception('boom')),
        PasswordChangeFailure.server,
      );
    });
  });
}
