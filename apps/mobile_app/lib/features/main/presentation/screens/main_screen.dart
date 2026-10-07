import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/platform/liquid_glass_support.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:cupertino_native_better/cupertino_native_better.dart';
import 'package:logger/logger.dart';

import '../../../../data/providers/connectivity_provider.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../concerts/presentation/screens/concerts_events_screen.dart';
import '../../../home/presentation/screens/home_screen.dart';
import '../../../profile/presentation/screens/profile_screen.dart';
import '../../../rehearsals/presentation/screens/rehearsals_screen.dart';
import '../providers/main_navigation_provider.dart';
import '../../../../features/notifications/presentation/providers/notification_scheduler_provider.dart';
import '../../../onboarding/data/welcome_prefs.dart';
import '../../../rehearsals/presentation/providers/rehearsal_filter_provider.dart';

// --- Data moved outside the build method for performance ---

/// One tab of the floating bar. Public so the bar can be tested on its own.
class NavItemData {
  final IconData outlinedIcon;
  final String label;

  /// Spoken name when the visible label is shortened.
  final String? semanticLabel;
  const NavItemData({
    required this.outlinedIcon,
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
  NavItemData(outlinedIcon: Icons.home_outlined, label: 'Accueil'),
  NavItemData(
    outlinedIcon: Icons.event_outlined,
    label: 'Concerts',
    semanticLabel: 'Concerts & Événements',
  ),
  NavItemData(outlinedIcon: Icons.calendar_month_outlined, label: 'Calendrier'),
  NavItemData(outlinedIcon: Icons.person_outline, label: 'Profil'),
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
    _applyMyGroupAndWelcome();
    // Deep link: open specific tab (e.g. rehearsals = 2)
    if (widget.initialTabIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref
            .read(mainNavigationProvider.notifier)
            .setTab(widget.initialTabIndex!.clamp(0, 3));
      });
    }
  }

  /// Opens the calendar on the member's ensemble (picked in the welcome
  /// tour) and shows the tour once, after the first sign-in.
  Future<void> _applyMyGroupAndWelcome() async {
    final group = await WelcomePrefs.myGroup();
    if (!mounted) return;
    if (group != null && ref.read(rehearsalFilterProvider) == null) {
      ref.read(rehearsalFilterProvider.notifier).setFilter(group);
    }
    final seen = await WelcomePrefs.tourSeen();
    if (!mounted || seen != false) return;
    context.push('/welcome');
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

/// The bottom bar (« Portée »): docked on the page ground behind a hairline,
/// no pill. Every tab keeps its label, so nobody has to guess what an icon
/// means; the current tab is in the accent with a dot under its label.
///
/// On iOS 26 and later the same tabs float on Liquid Glass, like Apple's own
/// apps on that version (#549); see [LiquidGlassSupport] for who gets it.
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
    return ValueListenableBuilder<bool>(
      valueListenable: LiquidGlassSupport.available,
      builder: (context, _, _) {
        final glass = LiquidGlassSupport.enabledFor(
          highContrast: MediaQuery.highContrastOf(context),
        );
        return glass ? _buildGlass(context) : _buildDocked(context);
      },
    );
  }

  Widget _buildDocked(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: scheme.surface,
          border: Border(top: BorderSide(color: scheme.outlineVariant)),
        ),
        child: SafeArea(top: false, child: _tabs()),
      ),
    );
  }

  /// Apple's own tab bar (a native UITabBar), so iOS 26 draws its real
  /// Liquid Glass and follows the iPhone's accessibility settings itself.
  /// The page scrolls under it (every tab already leaves
  /// `kFloatingNavBarBottomPadding` free).
  Widget _buildGlass(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Positioned(
      left: 0,
      right: 0,
      bottom: 0,
      child: SafeArea(
        top: false,
        child: CNTabBar(
          items: [
            for (final item in items)
              CNTabBarItem(label: item.label, customIcon: item.outlinedIcon),
          ],
          currentIndex: currentIndex,
          onTap: (index) {
            HapticFeedback.lightImpact();
            onTap(index);
          },
          tint: scheme.primary,
        ),
      ),
    );
  }

  Widget _tabs() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      // 64 at the default text size; grows with large text instead of
      // clipping the labels.
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 64),
        child: Row(
          children: List.generate(items.length, (index) {
            final item = items[index];
            return _NavBarItem(
              icon: item.outlinedIcon,
              label: item.label,
              semanticLabel: item.semanticLabel ?? item.label,
              isSelected: index == currentIndex,
              onTap: () => onTap(index),
            );
          }),
        ),
      ),
    );
  }
}

class _NavBarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String semanticLabel;
  final bool isSelected;
  final VoidCallback onTap;

  const _NavBarItem({
    required this.icon,
    required this.label,
    required this.semanticLabel,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fg = isSelected ? scheme.primary : scheme.onSurfaceVariant;

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
          borderRadius: BorderRadius.circular(16),
          child: ExcludeSemantics(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, color: fg, size: 24),
                  const SizedBox(height: 2),
                  // The labels are single words (« Calendrier »), so a second
                  // line would not help: with large text they shrink to the
                  // tab's width instead of ending in « Calend… ».
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      label,
                      style: AppFonts.sans(
                        fontSize: 13,
                        color: fg,
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                      maxLines: 1,
                      softWrap: false,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 3),
                  AnimatedOpacity(
                    duration: const Duration(milliseconds: 200),
                    opacity: isSelected ? 1 : 0,
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: scheme.primary,
                        shape: BoxShape.circle,
                      ),
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
