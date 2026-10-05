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

/// One tab of the floating bar. Public so the bar can be tested on its own.
class NavItemData {
  final IconData outlinedIcon;
  final IconData filledIcon;
  final String label;

  /// Spoken name when the visible label is shortened.
  final String? semanticLabel;
  const NavItemData({
    required this.outlinedIcon,
    required this.filledIcon,
    required this.label,
    this.semanticLabel,
  });
}

const List<Widget> _screens = [
  HomeScreen(),
  ConcertsEventsScreen(),
  RehearsalsScreen(),
  ProfileScreen(),
];

const List<NavItemData> kMainNavItems = [
  NavItemData(
    outlinedIcon: Icons.home_outlined,
    filledIcon: Icons.home,
    label: 'Accueil',
  ),
  NavItemData(
    outlinedIcon: Icons.event_outlined,
    filledIcon: Icons.event,
    label: 'Concerts',
    semanticLabel: 'Concerts & Événements',
  ),
  NavItemData(
    outlinedIcon: Icons.calendar_month_outlined,
    filledIcon: Icons.calendar_month,
    label: 'Calendrier',
  ),
  NavItemData(
    outlinedIcon: Icons.person_outline,
    filledIcon: Icons.person,
    label: 'Profil',
  ),
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
                return FadeTransition(opacity: animation, child: child);
              },
              // We explicitly pass the widget from the list based on index
              child: _screens[currentIndex],
            ),
          ),
          FrostedGlassNavBar(
            items: kMainNavItems,
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

/// The floating bottom bar (« Coulisses »): every tab keeps its label, so
/// nobody has to guess what an icon means; the current tab sits in an accent
/// pill.
class FrostedGlassNavBar extends StatelessWidget {
  final List<NavItemData> items;
  final int currentIndex;
  final ValueChanged<int> onTap;

  const FrostedGlassNavBar({
    super.key,
    required this.items,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Positioned(
      bottom: 14,
      left: 12,
      right: 12,
      child: SafeArea(
        top: false,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12.0, sigmaY: 12.0),
            child: Container(
              // 70 at the default text size; grows with large text instead
              // of clipping the labels.
              constraints: const BoxConstraints(minHeight: 70),
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainer.withValues(
                  alpha: 0.94,
                ),
                border: Border.all(color: theme.colorScheme.outlineVariant),
                borderRadius: BorderRadius.circular(32),
              ),
              child: Row(
                children: List.generate(items.length, (index) {
                  final item = items[index];
                  return _NavBarItem(
                    outlinedIcon: item.outlinedIcon,
                    filledIcon: item.filledIcon,
                    label: item.label,
                    semanticLabel: item.semanticLabel ?? item.label,
                    isSelected: index == currentIndex,
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
  final String semanticLabel;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.outlinedIcon,
    required this.filledIcon,
    required this.label,
    required this.semanticLabel,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fg = isSelected ? scheme.onPrimary : scheme.onSurfaceVariant;

    return Expanded(
      child: Semantics(
        button: true,
        selected: isSelected,
        label: semanticLabel,
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            onTap();
          },
          borderRadius: BorderRadius.circular(26),
          child: ExcludeSemantics(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOut,
              padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 2),
              decoration: BoxDecoration(
                color: isSelected ? scheme.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(26),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isSelected ? filledIcon : outlinedIcon,
                    color: fg,
                    size: 24,
                  ),
                  const SizedBox(height: 2),
                  // The labels are single words (« Calendrier »), so a second
                  // line would not help: with large text they shrink to the
                  // tab's width instead of ending in « Calend… ».
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      label,
                      style: AppFonts.sans(
                        fontSize: 12,
                        color: fg,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w600,
                      ),
                      maxLines: 1,
                      softWrap: false,
                      textAlign: TextAlign.center,
                    ),
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
