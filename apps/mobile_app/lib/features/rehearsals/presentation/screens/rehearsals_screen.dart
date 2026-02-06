import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/rehearsal_filter_provider.dart';

class RehearsalsScreen extends ConsumerStatefulWidget {
  const RehearsalsScreen({super.key});

  @override
  ConsumerState<RehearsalsScreen> createState() => _RehearsalsScreenState();
}

class _RehearsalsScreenState extends ConsumerState<RehearsalsScreen> {
  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
  }

  Future<void> _onRefresh() async {
    ref.invalidate(realtimeRehearsalsProvider);
    ref.invalidate(refreshTriggerProvider);
  }

  Future<void> _openGoogleCalendar() async {
    HapticFeedback.lightImpact();
    final uri = Uri.parse(kGoogleCalendarUrl);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d\'ouvrir le calendrier.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final rehearsalsAsync = ref.watch(realtimeRehearsalsProvider);
    final selectedFilter = ref.watch(rehearsalFilterProvider);
    final filteredRehearsals = ref.watch(filteredRehearsalsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surfaceContainerHighest,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // --- 1. Dynamic App Bar (Preserved Title Logic) ---
            _RehearsalsAppBar(
              onCalendar: _openGoogleCalendar,
              onLogout: () async {
                try {
                  await ref.read(authServiceProvider).signOut();
                  if (mounted) context.go('/login');
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Erreur lors de la déconnexion: $e'),
                        backgroundColor: theme.colorScheme.error,
                      ),
                    );
                  }
                }
              },
            ),

            // --- 2. Inline Filter Chips ---
            SliverToBoxAdapter(
              child: _InlineFilterChips(
                selectedFilter: selectedFilter,
                onFilterSelected: (groupType) => ref
                    .read(rehearsalFilterProvider.notifier)
                    .setFilter(groupType),
                onClearFilter: () =>
                    ref.read(rehearsalFilterProvider.notifier).clearFilter(),
              ),
            ),

            // --- 3. Calendrier complet Button ---
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: _CalendrierCompletButton(onTap: _openGoogleCalendar),
              ),
            ),

            // --- 4. Main Content based on State ---
            rehearsalsAsync.when(
              data: (rehearsals) {
                if (filteredRehearsals.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyState(isFilterActive: selectedFilter != null),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    20,
                    16,
                    20,
                    kFloatingNavBarBottomPadding,
                  ),
                  sliver: SliverList.builder(
                    itemCount: filteredRehearsals.length,
                    itemBuilder: (context, index) {
                      final rehearsal = filteredRehearsals[index];
                      // Add a bottom margin unless it's the last item
                      return Padding(
                        padding: EdgeInsets.only(
                          bottom: index == filteredRehearsals.length - 1
                              ? 0
                              : 16,
                        ),
                        child: FadeInUp(
                          delay: 100 + (index * 50),
                          child: _RehearsalTicketCard(rehearsal: rehearsal),
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const SliverFillRemaining(child: _LoadingState()),
              error: (error, stack) => SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorState(onRetry: _onRefresh),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - UI Components

class _RehearsalsAppBar extends StatelessWidget {
  final VoidCallback onCalendar;
  final VoidCallback onLogout;

  const _RehearsalsAppBar({required this.onCalendar, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SliverAppBar(
      backgroundColor: theme.colorScheme.surface,
      surfaceTintColor: theme.colorScheme.surface,
      pinned: true,
      floating: true,
      expandedHeight: 120.0,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        centerTitle: false,
        title: Text(
          'Répétitions',
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.calendar_month_rounded),
          color: theme.colorScheme.onSurfaceVariant,
          tooltip: 'Calendrier complet',
          onPressed: onCalendar,
        ),
        Padding(
          padding: const EdgeInsets.only(right: 8.0),
          child: IconButton(
            icon: const Icon(Icons.logout_outlined),
            color: theme.colorScheme.onSurfaceVariant,
            tooltip: 'Déconnexion',
            onPressed: onLogout,
          ),
        ),
      ],
    );
  }
}

class _InlineFilterChips extends StatelessWidget {
  final GroupType? selectedFilter;
  final void Function(GroupType?) onFilterSelected;
  final VoidCallback onClearFilter;

  const _InlineFilterChips({
    required this.selectedFilter,
    required this.onFilterSelected,
    required this.onClearFilter,
  });

  static const _chipOptions = [
    (null, 'Tous'),
    (GroupType.orchestre, 'Orchestre'),
    (GroupType.hommes, 'Hommes'),
    (GroupType.femmes, 'Femmes'),
    (GroupType.jeunesEnfants, 'Jeunes/Enfants'),
    (GroupType.choeurComplet, 'Chœur complet'),
  ];

  static Color _getGroupColor(GroupType? group) {
    switch (group) {
      case GroupType.orchestre:
        return const Color(0xFF2196F3); // blue
      case GroupType.hommes:
        return const Color(0xFF4CAF50); // green
      case GroupType.femmes:
        return const Color(0xFF9C27B0); // purple
      case GroupType.jeunesEnfants:
        return const Color(0xFFFFC107); // amber
      case GroupType.choeurComplet:
        return const Color(0xFFE53935); // red
      default:
        return const Color(0xFF757575); // grey
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        child: Row(
          children: _chipOptions.map((option) {
            final (group, label) = option;
            final isSelected = selectedFilter == group;
            final baseColor = _getGroupColor(group);

            final bgColor = isSelected
                ? baseColor
                : theme.colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.5,
                  );
            final fgColor = isSelected
                ? Colors.white
                : theme.colorScheme.onSurfaceVariant;
            final borderColor = isSelected
                ? baseColor
                : theme.colorScheme.outline.withValues(alpha: 0.2);

            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: InkWell(
                onTap: () {
                  HapticFeedback.lightImpact();
                  if (group == null) {
                    onClearFilter();
                  } else {
                    onFilterSelected(group);
                  }
                },
                borderRadius: BorderRadius.circular(20),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: borderColor),
                  ),
                  child: Text(
                    label,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: isSelected
                          ? FontWeight.w600
                          : FontWeight.w500,
                      color: fgColor,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _CalendrierCompletButton extends StatelessWidget {
  final VoidCallback onTap;

  const _CalendrierCompletButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer.withValues(alpha: 0.4),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: theme.colorScheme.primary.withValues(alpha: 0.1),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.calendar_month_rounded,
                color: theme.colorScheme.primary,
                size: 20,
              ),
              const SizedBox(width: 12),
              Text(
                'Voir le calendrier complet',
                style: GoogleFonts.poppins(
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RehearsalTicketCard extends StatelessWidget {
  final Rehearsal rehearsal;

  const _RehearsalTicketCard({required this.rehearsal});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Parsing logic
    DateTime? dateObj;
    if (rehearsal.date != null) {
      try {
        dateObj = DateTime.parse(rehearsal.date!);
      } catch (_) {}
    }

    return Card(
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      color: theme.colorScheme.surfaceContainer,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- TOP SECTION ---
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (dateObj != null)
                  _DateBadge(date: dateObj, color: theme.colorScheme.primary),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _GroupTypeBadge(groupType: rehearsal.groupType),
                      const SizedBox(height: 6),
                      Text(
                        rehearsal.name ?? 'Répétition sans titre',
                        style: GoogleFonts.poppins(
                          color: theme.colorScheme.onSurface,
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // --- BOTTOM SECTION (Footer) ---
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHigh.withValues(
                alpha: 0.3,
              ),
              border: Border(
                top: BorderSide(
                  color: theme.colorScheme.outlineVariant.withValues(
                    alpha: 0.2,
                  ),
                ),
              ),
            ),
            child: Row(
              children: [
                // Time
                Icon(
                  Icons.schedule_rounded,
                  size: 15,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(width: 6),
                Text(
                  _formatTimeRange(rehearsal.startTime, rehearsal.endTime),
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: theme.colorScheme.onSurface,
                  ),
                ),

                // Separator
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    '•',
                    style: TextStyle(color: theme.colorScheme.outline),
                  ),
                ),

                // Location
                Expanded(
                  child: Row(
                    children: [
                      Icon(
                        Icons.place_outlined,
                        size: 15,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          rehearsal.place ?? "Lieu non défini",
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DateBadge extends StatelessWidget {
  final DateTime date;
  final Color color;

  const _DateBadge({required this.date, required this.color});

  @override
  Widget build(BuildContext context) {
    // Helper to get short month name
    final months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Juin',
      'Juil',
      'Août',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            date.day.toString(),
            style: GoogleFonts.poppins(
              fontSize: 19,
              fontWeight: FontWeight.bold,
              color: color,
              height: 1.0,
            ),
          ),
          Text(
            months[date.month - 1],
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _GroupTypeBadge extends StatelessWidget {
  final GroupType groupType;
  const _GroupTypeBadge({required this.groupType});

  static Color _getGroupColor(GroupType group) {
    switch (group) {
      case GroupType.orchestre:
        return const Color(0xFF2196F3);
      case GroupType.hommes:
        return const Color(0xFF4CAF50);
      case GroupType.femmes:
        return const Color(0xFF9C27B0);
      case GroupType.jeunesEnfants:
        return const Color(0xFFFFC107);
      case GroupType.choeurComplet:
        return const Color(0xFFE53935);
      default:
        return const Color(0xFF757575);
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _getGroupColor(groupType);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        _getGroupTypeText(groupType),
        style: GoogleFonts.poppins(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 11,
        ),
      ),
    );
  }
}

// MARK: - State Handling Widgets

class _LoadingState extends StatelessWidget {
  const _LoadingState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CircularProgressIndicator(
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final bool isFilterActive;
  const _EmptyState({this.isFilterActive = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest.withValues(
                    alpha: 0.5,
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isFilterActive
                      ? Icons.filter_list_off_outlined
                      : Icons.music_off_outlined,
                  size: 48,
                  color: theme.colorScheme.onSurfaceVariant.withValues(
                    alpha: 0.5,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                isFilterActive ? 'Aucun résultat' : 'Aucune répétition',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isFilterActive
                    ? 'Aucune répétition ne correspond à votre filtre. Essayez une autre sélection.'
                    : 'Les prochaines répétitions apparaîtront ici dès qu\'elles seront planifiées.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.cloud_off_outlined,
                size: 64,
                color: theme.colorScheme.error.withValues(alpha: 0.7),
              ),
              const SizedBox(height: 24),
              Text(
                'Oups, une erreur est survenue',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Nous n\'avons pas pu charger les répétitions. Vérifiez votre connexion et réessayez.',
                textAlign: TextAlign.center,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: FilledButton.styleFrom(
                  backgroundColor: theme.colorScheme.primary,
                  foregroundColor: theme.colorScheme.onPrimary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// MARK: - Animation Widget
class FadeInUp extends StatefulWidget {
  final Widget child;
  final int delay;
  const FadeInUp({super.key, required this.child, this.delay = 0});
  @override
  State<FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<FadeInUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<double> _translateY;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _opacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(
      begin: 30.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: _opacity.value,
          child: Transform.translate(
            offset: Offset(0, _translateY.value),
            child: widget.child,
          ),
        );
      },
    );
  }
}

// MARK: - Helpers

String _getGroupTypeText(GroupType groupType) {
  switch (groupType) {
    case GroupType.orchestre:
      return 'Orchestre';
    case GroupType.hommes:
      return 'Hommes';
    case GroupType.femmes:
      return 'Femmes';
    case GroupType.jeunesEnfants:
      return 'Jeunes/Enfants';
    case GroupType.choeurComplet:
      return 'Chœur complet';
    case GroupType.tous:
      return 'Tous';
  }
}

String _formatTimeRange(String? startTime, String? endTime) {
  if (startTime == null) return 'Heure non spécifiée';

  String format(String time) {
    try {
      final parts = time.split(':');
      if (parts.length >= 2) return '${parts[0]}h${parts[1]}';
    } catch (e) {
      // Return original time if format is unexpected
    }
    return time;
  }

  final formattedStart = format(startTime);
  if (endTime == null || endTime.isEmpty) return formattedStart;

  final formattedEnd = format(endTime);
  return '$formattedStart - $formattedEnd';
}
