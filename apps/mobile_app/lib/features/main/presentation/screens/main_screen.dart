import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:logger/logger.dart';
import 'dart:ui'; // Required for ImageFilter.blur

import '../../../../data/providers/connectivity_provider.dart';
import '../../../../data/providers/data_providers.dart';
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
      outlinedIcon: Icons.calendar_month_outlined,
      filledIcon: Icons.calendar_month,
      label: 'Calendrier'),
  _NavItemData(
      outlinedIcon: Icons.person_outline,
      filledIcon: Icons.person,
      label: 'Profil'),
];

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key, this.initialTabIndex});

  /// When set (e.g. from /rehearsals deep link), opens this tab on first frame.
  final int? initialTabIndex;

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
    // Deep link: open specific tab (e.g. rehearsals = 2)
    if (widget.initialTabIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(mainNavigationProvider.notifier)
            .setTab(widget.initialTabIndex!.clamp(0, 3));
      });
    }
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
    // Back online after an offline spell: the lists showing cached rows
    // reload themselves instead of waiting for a pull-to-refresh (#361).
    ref.listen(isOnlineProvider, (previous, next) {
      if (previous?.value == false && next.value == true) {
        ref.invalidate(realtimeRehearsalsProvider);
        ref.invalidate(realtimeConcertsProvider);
        ref.invalidate(realtimeEventsProvider);
      }
    });
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
              // 70 at the default text size; grows with large text instead
              // of clipping the selected label.
              constraints: const BoxConstraints(minHeight: 70),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface.withValues(alpha: 0.8),
                border: Border.all(
                    color: theme.colorScheme.outline.withValues(alpha: 0.2)),
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

    // Unselected tabs show no text, so the accessible name comes from here
    // (TalkBack / VoiceOver read "Accueil, onglet, sélectionné").
    return Expanded(
      child: Semantics(
        button: true,
        selected: isSelected,
        label: label,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(20),
          child: ExcludeSemantics(
            child: Padding(
              // Reduced vertical padding to give contents more space.
              padding: const EdgeInsets.symmetric(vertical: 6.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                // mainAxisSize.min keeps the column as tall as its children,
                // so the parent centers it correctly.
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isSelected ? filledIcon : outlinedIcon,
                    color: color,
                    size: 24,
                  ),
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
                            style: AppFonts.sans(
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
        ),
      ),
    );
  }
}
