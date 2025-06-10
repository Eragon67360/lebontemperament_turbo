import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../concerts/presentation/screens/concerts_screen.dart';
import '../../../events/presentation/screens/events_screen.dart';
import '../../../home/presentation/screens/home_screen.dart';
import '../../../notifications/presentation/providers/notification_scheduler_provider.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../rehearsals/presentation/screens/rehearsals_screen.dart';
import '../providers/main_navigation_provider.dart';

class MainScreen extends ConsumerWidget {
  const MainScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch the auto-scheduler to trigger notification scheduling
    ref.watch(autoScheduleNotificationsProvider);

    final currentIndex = ref.watch(mainNavigationProvider);
    final navigationNotifier = ref.read(mainNavigationProvider.notifier);

    final List<Widget> screens = [
      const HomeScreen(),
      const EventsScreen(),
      const ConcertsScreen(),
      const RehearsalsScreen(),
      const ProfileScreen(),
    ];

    final List<BottomNavigationBarItem> bottomNavItems = [
      const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Accueil'),
      const BottomNavigationBarItem(
        icon: Icon(Icons.event),
        label: 'Événements',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.music_note),
        label: 'Concerts',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.repeat),
        label: 'Répétitions',
      ),
      const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
    ];

    return Scaffold(
      body: SafeArea(
        bottom:
            false, // Don't add bottom safe area since we have bottom navigation
        child: IndexedStack(index: currentIndex, children: screens),
      ),
      bottomNavigationBar: SafeArea(
        top: false, // Don't add top safe area for bottom navigation
        child: BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: currentIndex,
          onTap: (index) {
            navigationNotifier.setTab(index);
          },
          selectedItemColor: Theme.of(context).colorScheme.primary,
          unselectedItemColor: Theme.of(context).colorScheme.onSurfaceVariant,
          backgroundColor: Theme.of(context).colorScheme.surface,
          elevation: 8,
          items: bottomNavItems,
        ),
      ),
    );
  }
}
