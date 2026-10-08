import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/config/app_router.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/services/fcm_notification_handler.dart';
import 'package:lebontemperament/features/delivery/presentation/providers/delivery_providers.dart';
import 'package:lebontemperament/features/delivery/presentation/screens/delivery_code_screen.dart';
import 'package:lebontemperament/features/delivery/presentation/screens/delivery_link_screen.dart';
import 'package:lebontemperament/features/delivery/presentation/screens/delivery_screen.dart';
import 'package:lebontemperament/features/public/presentation/screens/public_about_screen.dart';
import 'package:lebontemperament/features/public/presentation/screens/public_home_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/fake_delivery.dart';
import '../../helpers/screen_harness.dart';

/// Deliveries in the app (#593): the code, the link, « Votre livraison »,
/// the two discreet entry points, the routes and the push mapping.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  /// The delivery routes inside a real GoRouter (the screens push, replace
  /// and ask whether they can pop), everything else faked.
  Future<GoRouter> pumpRouted(
    WidgetTester tester, {
    required String initialLocation,
    required FakeDelivery fake,
    double textScale = 1.0,
    Size size = const Size(390, 844),
  }) async {
    GoogleFonts.config.allowRuntimeFetching = false;
    tester.view.physicalSize = size;
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    final router = GoRouter(
      initialLocation: initialLocation,
      routes: [
        GoRoute(
          path: AppRouter.publicHome,
          builder: (_, _) => const Scaffold(body: Text('Accueil public')),
        ),
        GoRoute(
          path: AppRouter.deliveryLink,
          builder: (_, s) =>
              DeliveryLinkScreen(code: s.pathParameters['code']!),
        ),
        GoRoute(
          path: AppRouter.deliveryCode,
          builder: (_, _) => const DeliveryCodeScreen(),
        ),
        GoRoute(
          path: AppRouter.deliveryDetail,
          builder: (_, s) =>
              DeliveryScreen(recipientId: s.pathParameters['recipientId']!),
        ),
      ],
    );
    addTearDown(router.dispose);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...offlineOverrides(),
          deliveryServiceProvider.overrideWithValue(fake.service),
        ],
        child: MaterialApp.router(
          theme: AppTheme.lightTheme,
          locale: const Locale('fr', 'FR'),
          supportedLocales: const [Locale('fr', 'FR'), Locale('en', 'US')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(
              context,
            ).copyWith(textScaler: TextScaler.linear(textScale)),
            child: child!,
          ),
          routerConfig: router,
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    return router;
  }

  group('J’ai un code', () {
    testWidgets('formats what is typed and opens the delivery on success', (
      tester,
    ) async {
      final fake = FakeDelivery();
      await pumpRouted(
        tester,
        initialLocation: AppRouter.deliveryCode,
        fake: fake,
      );
      await tester.enterText(find.byType(TextField), 'k7mp4xq9');
      expect(find.text('K7MP-4XQ9'), findsOneWidget);
      await tester.tap(find.text('Valider'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      expect(fake.bodies.single['code'], 'K7MP4XQ9');
      expect(find.text('Bonjour Famille Test'), findsOneWidget);
    });

    testWidgets('a short code is refused before any network call', (
      tester,
    ) async {
      final fake = FakeDelivery();
      await pumpRouted(
        tester,
        initialLocation: AppRouter.deliveryCode,
        fake: fake,
      );
      await tester.enterText(find.byType(TextField), 'K7MP');
      await tester.tap(find.text('Valider'));
      await tester.pump();
      expect(find.textContaining('8 lettres ou chiffres'), findsOneWidget);
      expect(fake.bodies, isEmpty);
    });

    testWidgets('unknown, too many tries, offline: each its own sentence', (
      tester,
    ) async {
      final fake = FakeDelivery(answer: {'status': 'not_found'});
      await pumpRouted(
        tester,
        initialLocation: AppRouter.deliveryCode,
        fake: fake,
      );
      Future<void> submit() async {
        await tester.enterText(find.byType(TextField), 'K7MP4XQ9');
        await tester.tap(find.text('Valider'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 50));
      }

      await submit();
      expect(
        find.text(
          'Ce code ne correspond à aucune livraison en cours. Vérifiez-le '
          'dans le SMS.',
        ),
        findsOneWidget,
      );

      fake.answer = {'status': 'rate_limited'};
      await submit();
      expect(
        find.text('Trop d’essais : réessayez dans une heure.'),
        findsOneWidget,
      );

      fake.unreachable = true;
      await submit();
      expect(find.textContaining('Vérifiez votre connexion'), findsOneWidget);
      // Still on the code screen, nothing kept.
      expect(find.text('Valider'), findsOneWidget);
      expect(await fake.service.passes(), isEmpty);
    });
  });

  group('/l/<code>', () {
    testWidgets('redeems at once and shows the delivery', (tester) async {
      final fake = FakeDelivery();
      await pumpRouted(tester, initialLocation: '/l/k7mp-4xq9', fake: fake);
      await tester.pump(const Duration(milliseconds: 100));
      expect(fake.bodies.single['code'], 'K7MP4XQ9');
      expect(find.text('Bonjour Famille Test'), findsOneWidget);
      expect(find.text('Livraison prévue'), findsOneWidget);
    });

    testWidgets('a bad link lands on the code screen, pre-filled', (
      tester,
    ) async {
      final fake = FakeDelivery(answer: {'status': 'not_found'});
      await pumpRouted(tester, initialLocation: '/l/K7MP4XQ9', fake: fake);
      await tester.pump(const Duration(milliseconds: 100));
      expect(find.text('K7MP-4XQ9'), findsOneWidget);
      expect(find.textContaining('aucune livraison en cours'), findsOneWidget);
      expect(find.text('Valider'), findsOneWidget);
    });
  });

  group('Votre livraison', () {
    Future<FakeDelivery> open(
      WidgetTester tester, {
      required Object? Function() tracking,
      bool permissionGranted = true,
      bool savePass = true,
      double textScale = 1.0,
      Size size = const Size(390, 844),
    }) async {
      final fake = FakeDelivery(
        trackingAnswer: tracking,
        permissionGranted: permissionGranted,
      );
      if (savePass) await fake.service.store.save(kTestPass);
      await pumpRouted(
        tester,
        initialLocation: deliveryPath(kTestRecipientId),
        fake: fake,
        textScale: textScale,
        size: size,
      );
      await tester.pump(const Duration(milliseconds: 100));
      return fake;
    }

    testWidgets('planned: the window, the map, the notifications line', (
      tester,
    ) async {
      await open(tester, tracking: () => trackingJson());
      expect(find.text('Bonjour Famille Test'), findsOneWidget);
      expect(find.text('Livraison prévue'), findsOneWidget);
      expect(find.textContaining('entre 9 h 15 et 9 h 45'), findsOneWidget);
      expect(find.text('Suivre sur la carte'), findsOneWidget);
      expect(
        find.text('Vous serez prévenu ici le jour de la livraison.'),
        findsOneWidget,
      );
      expect(find.text('Retirer cette livraison'), findsOneWidget);
    });

    testWidgets('no slot yet: the date will come by SMS', (tester) async {
      await open(
        tester,
        tracking: () => trackingJson(recipientScheduledAt: null),
      );
      expect(find.text('La date vous sera confirmée par SMS.'), findsOneWidget);
    });

    testWidgets('next: « Vous êtes les prochains ! », with a delay line', (
      tester,
    ) async {
      await open(
        tester,
        tracking: () => trackingJson(
          isTrackingActive: true,
          currentRecipientId: kTestRecipientId,
          isDelayed: true,
          delayMinutes: 10,
          problemMessage: 'Route barrée à Testville, nous faisons le tour.',
        ),
      );
      expect(find.text('Vous êtes les prochains !'), findsOneWidget);
      expect(find.textContaining('10 minutes de retard'), findsOneWidget);
      expect(find.textContaining('Route barrée'), findsOneWidget);
    });

    testWidgets('delivered: thanks, no map button', (tester) async {
      await open(
        tester,
        tracking: () => trackingJson(deliveredAt: '2099-11-14T09:12:00+00:00'),
      );
      expect(find.text('Livrée, merci !'), findsOneWidget);
      expect(find.textContaining('à 10 h 12'), findsOneWidget);
      expect(find.text('Suivre sur la carte'), findsNothing);
    });

    testWidgets('over: a friendly end, and the pass is gone', (tester) async {
      final fake = await open(tester, tracking: () => null);
      expect(find.text('Cette livraison est terminée'), findsOneWidget);
      expect(find.text('Retour à l’accueil'), findsOneWidget);
      expect(await fake.service.passes(), isEmpty);
    });

    testWidgets('notifications off: a button that asks the phone', (
      tester,
    ) async {
      final fake = await open(
        tester,
        tracking: () => trackingJson(),
        permissionGranted: false,
      );
      expect(find.text('Activer les notifications'), findsOneWidget);
      fake.permissionGranted = true;
      await tester.tap(find.text('Activer les notifications'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 50));
      expect(fake.permissionAsks, 1);
      expect(
        find.text('Vous serez prévenu ici le jour de la livraison.'),
        findsOneWidget,
      );
    });

    testWidgets('retirer: asks first, then forgets and leaves', (tester) async {
      final fake = await open(tester, tracking: () => trackingJson());
      await tester.tap(find.text('Retirer cette livraison'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(find.text('Retirer cette livraison ?'), findsOneWidget);
      await tester.tap(find.text('Retirer'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));
      expect(fake.bodies.single['action'], 'forget');
      expect(await fake.service.passes(), isEmpty);
      expect(find.text('Accueil public'), findsOneWidget);
    });

    testWidgets('a push for a delivery this phone forgot: the code screen', (
      tester,
    ) async {
      await open(tester, tracking: () => trackingJson(), savePass: false);
      expect(find.textContaining('pas enregistrée'), findsOneWidget);
      expect(find.text('J’ai un code'), findsOneWidget);
    });

    testWidgets('large text on a small phone has no overflow', (tester) async {
      await open(
        tester,
        tracking: () => trackingJson(isDelayed: true, delayMinutes: 25),
        textScale: 2.0,
        size: const Size(360, 780),
      );
      expect(tester.takeException(), isNull);
    });
  });

  group('entry points', () {
    testWidgets('Accueil says nothing about deliveries without a pass', (
      tester,
    ) async {
      await pumpScreen(tester, const PublicHomeScreen());
      expect(find.text('Votre livraison'), findsNothing);
      expect(find.textContaining('livraison'), findsNothing);
    });

    testWidgets('Accueil shows « Votre livraison » with a pass', (
      tester,
    ) async {
      final fake = FakeDelivery();
      await fake.service.store.save(kTestPass);
      await pumpScreen(
        tester,
        const PublicHomeScreen(),
        overrides: [deliveryServiceProvider.overrideWithValue(fake.service)],
      );
      expect(find.text('Votre livraison'), findsOneWidget);
      expect(
        find.text('Bonjour Famille Test · suivre la livraison'),
        findsOneWidget,
      );
    });

    testWidgets('À propos ends with a quiet « J’ai un code »', (tester) async {
      await pumpScreen(tester, const PublicAboutScreen());
      await tester.pump();
      final page = find.byType(Scrollable).first;
      await tester.scrollUntilVisible(
        find.text('J’ai un code'),
        300,
        scrollable: page,
      );
      expect(find.text('J’ai un code'), findsOneWidget);
      // Below the copyright line: the last thing on the page.
      final copyright = tester.getTopLeft(find.textContaining('©'));
      final code = tester.getTopLeft(find.text('J’ai un code'));
      expect(code.dy, greaterThan(copyright.dy));
    });
  });

  group('routes', () {
    String? to(String location, {bool member = false}) =>
        AppRouter.redirectFor(isAuthenticated: member, location: location);

    test('a visitor opens a link, the code screen and a delivery', () {
      expect(to('/l/K7MP4XQ9'), isNull);
      expect(to('/delivery/code'), isNull);
      expect(to('/delivery/$kTestRecipientId'), isNull);
    });

    test('a member keeps them too (never sent to the members’ home)', () {
      expect(to('/l/K7MP4XQ9', member: true), isNull);
      expect(to('/delivery/code', member: true), isNull);
      expect(to('/delivery/$kTestRecipientId', member: true), isNull);
    });
  });

  group('pushes', () {
    test('type delivery with the recipient id opens the delivery', () {
      expect(
        FcmNotificationHandler.pathFor('delivery', kTestRecipientId),
        '/delivery/$kTestRecipientId',
      );
      expect(FcmNotificationHandler.pathFor('delivery', ''), isNull);
      expect(FcmNotificationHandler.pathFor('concert', 'c-1'), '/concerts/c-1');
      expect(FcmNotificationHandler.pathFor('unknown', 'x'), isNull);
    });
  });
}
