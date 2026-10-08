import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/core/config/app_router.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/list_result.dart';
import 'package:lebontemperament/features/concerts/presentation/screens/concert_detail_screen.dart';
import 'package:lebontemperament/features/public/presentation/screens/join_screen.dart';
import 'package:lebontemperament/features/public/presentation/screens/public_about_screen.dart';
import 'package:lebontemperament/features/public/presentation/screens/public_concerts_screen.dart';
import 'package:lebontemperament/features/public/presentation/screens/public_home_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/screen_harness.dart';

/// The public part of the app (#593): what a visitor sees without signing in.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  const later = Concert(
    id: 'concert-test-0002',
    place: 'Église de Testville',
    date: '2099-12-12',
    time: '17:00:00',
    context: Context.choeur,
    name: 'Concert de test de Noël',
  );

  group('Accueil', () {
    testWidgets('shows the next concert, the way in for members and joining', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const PublicHomeScreen(),
        concerts: const ListResult.fresh([later, kTestConcert]),
      );

      // Soonest first, whatever the server order.
      expect(find.text('Concert de test de fin de saison'), findsOneWidget);
      expect(find.text('Concert de test de Noël'), findsNothing);
      expect(find.text('Membres'), findsOneWidget);
      expect(
        find.text('Envie de chanter ou de jouer avec nous ?'),
        findsOneWidget,
      );
      // Nothing from the members' app.
      expect(find.textContaining('répétition programmée'), findsNothing);
    });

    testWidgets('no concert yet: says so, never an empty card', (tester) async {
      await pumpScreen(
        tester,
        const PublicHomeScreen(),
        concerts: const ListResult.fresh([]),
      );
      expect(find.textContaining('pas encore annoncé'), findsOneWidget);
    });

    testWidgets('server down and nothing cached: an error with a retry', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const PublicHomeScreen(),
        concerts: ListResult.cached(const [], error: Exception('offline')),
      );
      expect(find.textContaining('Impossible de charger'), findsOneWidget);
      expect(find.text('Réessayer'), findsOneWidget);
    });
  });

  group('Concerts', () {
    testWidgets('lists every upcoming concert, soonest first', (tester) async {
      await pumpScreen(
        tester,
        const PublicConcertsScreen(),
        concerts: const ListResult.fresh([later, kTestConcert]),
      );
      final first = tester.getTopLeft(
        find.text('Concert de test de fin de saison'),
      );
      final second = tester.getTopLeft(find.text('Concert de test de Noël'));
      expect(first.dy, lessThan(second.dy));
    });

    testWidgets('none announced: tells the visitor to keep notifications', (
      tester,
    ) async {
      await pumpScreen(
        tester,
        const PublicConcertsScreen(),
        concerts: const ListResult.fresh([]),
      );
      expect(find.textContaining('Aucun concert annoncé'), findsOneWidget);
    });
  });

  group('Nous rejoindre', () {
    testWidgets('the joining facts, the rehearsals and two ways to write', (
      tester,
    ) async {
      await pumpScreen(tester, const JoinScreen());
      expect(find.text('Sans audition'), findsOneWidget);
      expect(find.text('Environ 40 € par an'), findsOneWidget);
      await tester.scrollUntilVisible(find.text('Nous écrire'), 300);
      expect(find.text('Orchestre'), findsOneWidget);
      expect(find.text('Formulaire de contact'), findsOneWidget);
    });
  });

  group('À propos', () {
    testWidgets('donations open HelloAsso outside the app, plus the legal '
        'pages and the concert switch, on by default', (tester) async {
      await pumpScreen(tester, const PublicAboutScreen());
      await tester.pump();
      // The page, not the row of photos.
      final page = find.byType(Scrollable).first;
      await tester.scrollUntilVisible(
        find.text('Faire un don'),
        300,
        scrollable: page,
      );
      expect(find.text('Sur HelloAsso, dans votre navigateur'), findsOneWidget);
      final toggle = tester.widget<Switch>(find.byType(Switch));
      expect(toggle.value, isTrue);
      await tester.scrollUntilVisible(
        find.text('Mentions légales'),
        300,
        scrollable: page,
      );
      expect(find.text('Politique de confidentialité'), findsOneWidget);
      expect(find.text('Espace membres'), findsOneWidget);
    });
  });

  group('large text on a small phone', () {
    for (final screen in const <Widget>[
      PublicHomeScreen(),
      PublicConcertsScreen(),
      JoinScreen(),
      PublicAboutScreen(),
    ]) {
      testWidgets('${screen.runtimeType} at 2× has no overflow', (
        tester,
      ) async {
        await pumpScreen(
          tester,
          screen,
          textScale: 2.0,
          size: const Size(360, 780),
        );
        expect(tester.takeException(), isNull);
      });
    }
  });

  group('routes', () {
    String? to(String location, {bool member = false}) =>
        AppRouter.redirectFor(isAuthenticated: member, location: location);

    test('a visitor gets the public part, a concert and the sign-in', () {
      expect(to('/public'), isNull);
      expect(to('/concerts/concert-test-0001'), isNull);
      expect(to('/login'), isNull);
      expect(to('/main'), AppRouter.publicHome);
      expect(to('/partitions'), AppRouter.publicHome);
      expect(to('/driver-tracking'), AppRouter.publicHome);
    });

    test('a member never sees the public part or the sign-in', () {
      expect(to('/public', member: true), AppRouter.main);
      expect(to('/login', member: true), AppRouter.main);
      expect(to('/main', member: true), isNull);
      expect(to('/concerts/concert-test-0001', member: true), isNull);
    });
  });

  group('concert page details', () {
    const full = Concert(
      id: 'concert-test-0003',
      place: 'Testville',
      date: '2099-06-21',
      time: '20:30:00',
      context: Context.orchestre,
      venueName: 'Salle de test',
      streetAddress: '1 rue de l’Exemple',
      postalCode: '99999',
      city: 'Testville',
      price: 12.5,
    );

    test('address on separate lines, the free-text place otherwise', () {
      expect(
        concertAddress(full),
        'Salle de test\n1 rue de l’Exemple\n99999 Testville',
      );
      expect(concertAddress(kTestConcert), 'Salle des fêtes de Testville');
    });

    test('entry: free, a price, or nothing said', () {
      expect(concertEntry(full), '12,50 €');
      expect(concertEntry(full.copyWith(price: 15)), '15 €');
      expect(concertEntry(full.copyWith(isFree: true)), 'Entrée libre');
      expect(concertEntry(kTestConcert), isNull);
    });

    test('directions search the venue and its address', () {
      final uri = concertDirectionsUri(full)!;
      expect(uri.host, 'www.google.com');
      expect(
        uri.queryParameters['query'],
        'Salle de test 1 rue de l’Exemple 99999 Testville',
      );
    });
  });
}
