import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:logger/logger.dart';
import 'dart:ui'; // Required for ImageFilter.blur

import '../../../concerts/presentation/screens/concerts_events_screen.dart';
import '../../../home/presentation/screens/home_screen.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../rehearsals/presentation/screens/rehearsals_screen.dart';
import '../providers/main_navigation_provider.dart';
import '../../../../features/notifications/presentation/providers/notification_scheduler_provider.dart';

// --- Data moved outside the build method for performance ---

class _NavItemData {
  final IconData outlinedIcon;
  final IconData filledIcon;
  final String label;
  const _NavItemData(
      {required this.outlinedIcon,
      required this.filledIcon,
      required this.label});
}

const List<Widget> _screens = [
  HomeScreen(),
  ConcertsEventsScreen(),
  RehearsalsScreen(),
  ProfileScreen(),
];

const List<_NavItemData> _navItems = [
  _NavItemData(
      outlinedIcon: Icons.home_outlined,
      filledIcon: Icons.home,
      label: 'Accueil'),
  _NavItemData(
      outlinedIcon: Icons.event_outlined,
      filledIcon: Icons.event,
      label: 'Concerts & Évènements'),
  _NavItemData(
      outlinedIcon: Icons.repeat_rounded,
      filledIcon: Icons.repeat_one_rounded,
      label: 'Répétitions'),
  _NavItemData(
      outlinedIcon: Icons.person_outline,
      filledIcon: Icons.person,
      label: 'Profil'),
];

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  final Logger _logger = Logger();

  // Note: PageController removed as it is not needed for Fade transitions

  @override
  void initState() {
    super.initState();
    // Notification logic kept from original file
    _initializeNotifications();
  }

  Future<void> _initializeNotifications() async {
    try {
      _logger.i('Initializing notifications in main screen...');
      Future.delayed(const Duration(seconds: 2), () {
        _logger.i('Manually triggering notification scheduling...');
        ref
            .read(notificationSchedulerProvider.notifier)
            .scheduleNotifications();
      });
    } catch (e) {
      _logger.e('Error initializing notifications: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(autoScheduleNotificationsProvider);
    final currentIndex = ref.watch(mainNavigationProvider);
    final theme = Theme.of(context);

    // Note: ref.listen removed. AnimatedSwitcher handles changes declaratively.

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: Stack(
        children: [
          // Replaced PageView with AnimatedSwitcher for Fade Transition
          Positioned.fill(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              switchInCurve: Curves.easeIn,
              switchOutCurve: Curves.easeOut,
              transitionBuilder: (Widget child, Animation<double> animation) {
                return FadeTransition(
                  opacity: animation,
                  child: child,
                );
              },
              // We explicitly pass the widget from the list based on index
              child: _screens[currentIndex],
            ),
          ),
          _FrostedGlassNavBar(
            items: _navItems,
            currentIndex: currentIndex,
            onTap: (index) =>
                ref.read(mainNavigationProvider.notifier).setTab(index),
          ),
        ],
      ),
    );
  }
}

// MARK: - Custom Navigation Bar Components

class _FrostedGlassNavBar extends StatelessWidget {
  final List<_NavItemData> items;
  final int currentIndex;
  final ValueChanged<int> onTap;

  const _FrostedGlassNavBar({
    required this.items,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: SafeArea(
        top: false,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
            child: Container(
              height: 70, // Fixed height for the nav bar
              decoration: BoxDecoration(
                color: theme.colorScheme.surface.withOpacity(0.8),
                border: Border.all(
                    color: theme.colorScheme.outline.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: List.generate(items.length, (index) {
                  final item = items[index];
                  final isSelected = index == currentIndex;
                  return _NavBarItem(
                    outlinedIcon: item.outlinedIcon,
                    filledIcon: item.filledIcon,
                    label: item.label,
                    isSelected: isSelected,
                    onTap: () => onTap(index),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  final IconData outlinedIcon;
  final IconData filledIcon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.outlinedIcon,
    required this.filledIcon,
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = isSelected
        ? theme.colorScheme.primary
        : theme.colorScheme.onSurfaceVariant;

    return Expanded(
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          // CORRECTED: Reduced vertical padding to give contents more space.
          padding: const EdgeInsets.symmetric(vertical: 6.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            // CORRECTED: mainAxisSize.min ensures the column is only as tall as its children,
            // which helps the parent center it correctly.
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isSelected ? filledIcon : outlinedIcon,
                color: color,
                size: 24,
              ),
              // CORRECTED: Added a small, predictable spacer.
              const SizedBox(height: 2),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: ScaleTransition(scale: animation, child: child),
                ),
                child: isSelected
                    ? Text(
                        label,
                        key: ValueKey<String>(label),
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                        // Prevents the text itself from wrapping
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
