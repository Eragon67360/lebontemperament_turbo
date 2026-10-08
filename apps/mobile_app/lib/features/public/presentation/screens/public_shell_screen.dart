import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../main/presentation/screens/main_screen.dart';
import '../providers/public_navigation_provider.dart';
import 'join_screen.dart';
import 'public_about_screen.dart';
import 'public_concerts_screen.dart';
import 'public_home_screen.dart';

const List<Widget> _screens = [
  PublicHomeScreen(),
  PublicConcertsScreen(),
  JoinScreen(),
  PublicAboutScreen(),
];

const List<NavItemData> kPublicNavItems = [
  NavItemData(outlinedIcon: Icons.home_outlined, label: 'Accueil'),
  NavItemData(outlinedIcon: Icons.event_outlined, label: 'Concerts'),
  NavItemData(
    outlinedIcon: Icons.group_add_outlined,
    label: 'Rejoindre',
    semanticLabel: 'Nous rejoindre',
  ),
  NavItemData(outlinedIcon: Icons.info_outline_rounded, label: 'À propos'),
];

/// The app for everyone who is not signed in (#593): the next concerts, how
/// to join, who we are. « Espace membres » opens the sign-in, and a member
/// lands in the members' app as before.
class PublicShellScreen extends ConsumerWidget {
  const PublicShellScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentIndex = ref.watch(publicNavigationProvider);
    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: Stack(
        children: [
          Positioned.fill(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              switchInCurve: Curves.easeIn,
              switchOutCurve: Curves.easeOut,
              transitionBuilder: (child, animation) =>
                  FadeTransition(opacity: animation, child: child),
              child: _screens[currentIndex],
            ),
          ),
          FrostedGlassNavBar(
            items: kPublicNavItems,
            currentIndex: currentIndex,
            onTap: (index) =>
                ref.read(publicNavigationProvider.notifier).state = index,
          ),
        ],
      ),
    );
  }
}
