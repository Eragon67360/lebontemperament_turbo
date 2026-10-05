import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/confirm_logout_dialog.dart';
import 'package:lebontemperament/core/widgets/fade_in_up.dart';
import 'package:lebontemperament/core/widgets/notice_banner.dart';
import 'package:lebontemperament/core/widgets/stage.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/connectivity_provider.dart';
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

  /// Reloads the list and keeps the indicator spinning until it is back
  /// (an error shows in the list, not here).
  Future<void> _onRefresh() async {
    ref.invalidate(realtimeRehearsalsProvider);
    ref.invalidate(refreshTriggerProvider);
    try {
      await ref.read(realtimeRehearsalsProvider.future);
    } catch (_) {}
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

  Future<void> _logout() async {
    if (!await confirmLogout(context)) return;
    try {
      await ref.read(authServiceProvider).signOut();
      if (mounted) context.go('/login');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(kLogoutFailedMessage),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final rehearsalsAsync = ref.watch(realtimeRehearsalsProvider);
    final selectedFilter = ref.watch(rehearsalFilterProvider);
    final filteredRehearsals = ref.watch(filteredRehearsalsProvider);
    final isOnline = ref.watch(isOnlineProvider).value ?? true;
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
            // --- 1. Title, calendar and logout actions ---
            SliverToBoxAdapter(
              child: SafeArea(
                bottom: false,
                child: _RehearsalsHeader(
                  onCalendar: _openGoogleCalendar,
                  onLogout: _logout,
                ),
              ),
            ),

            // --- 2. Group filter pills ---
            SliverToBoxAdapter(
              child: _FilterPills(
                selectedFilter: selectedFilter,
                onFilterSelected: (groupType) => ref
                    .read(rehearsalFilterProvider.notifier)
                    .setFilter(groupType),
                onClearFilter: () =>
                    ref.read(rehearsalFilterProvider.notifier).clearFilter(),
              ),
            ),

            // --- 2b. Cached rows (server unreachable) ---
            if (rehearsalsAsync.value?.fromCache == true &&
                !rehearsalsAsync.value!.isUnavailable)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                  child: OfflineDataBanner(isOnline: isOnline),
                ),
              ),

            // --- 3. Main content based on state ---
            rehearsalsAsync.when(
              data: (rehearsals) {
                // Server down and nothing cached: an error, not "no rehearsal".
                if (rehearsals.isUnavailable) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _ErrorState(onRetry: _onRefresh, isOnline: isOnline),
                  );
                }
                if (filteredRehearsals.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyState(isFilterActive: selectedFilter != null),
                  );
                }
                final rows = _timelineRows(filteredRehearsals);
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    20,
                    8,
                    20,
                    kFloatingNavBarBottomPadding,
                  ),
                  sliver: SliverList.builder(
                    itemCount: rows.length,
                    itemBuilder: (context, index) {
                      final row = rows[index];
                      return FadeInUp(
                        delay: 100 + (index * 50).clamp(0, 600),
                        child: switch (row) {
                          _MonthRow() => _MonthHeader(
                            title: row.title,
                            count: row.count,
                          ),
                          _ItemRow() => _TimelineItem(
                            rehearsal: row.rehearsal,
                            isNext: row.isNext,
                            isFirstInMonth: row.isFirstInMonth,
                            isLastInMonth: row.isLastInMonth,
                          ),
                        },
                      );
                    },
                  ),
                );
              },
              loading: () => const SliverFillRemaining(child: _LoadingState()),
              error: (error, stack) => SliverFillRemaining(
                hasScrollBody: false,
                child: _ErrorState(onRetry: _onRefresh, isOnline: isOnline),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// MARK: - Timeline model

sealed class _Row {
  const _Row();
}

class _MonthRow extends _Row {
  const _MonthRow(this.title, this.count);
  final String title;
  final int count;
}

class _ItemRow extends _Row {
  const _ItemRow(
    this.rehearsal, {
    required this.isNext,
    required this.isFirstInMonth,
    required this.isLastInMonth,
  });
  final Rehearsal rehearsal;
  final bool isNext;
  final bool isFirstInMonth;
  final bool isLastInMonth;
}

DateTime? _parseDate(String? date) =>
    date == null ? null : DateTime.tryParse(date);

/// « Octobre 2026 », or « Date à confirmer » for rows without a date.
String _monthTitle(DateTime? date) {
  if (date == null) return 'Date à confirmer';
  final label = DateFormat.yMMMM('fr_FR').format(date);
  return label.isEmpty ? label : label[0].toUpperCase() + label.substring(1);
}

/// Splits the (already ordered) list into month sections, keeping its order.
/// The first rehearsal of the list is the next one.
List<_Row> _timelineRows(List<Rehearsal> rehearsals) {
  final groups = <(String, List<Rehearsal>)>[];
  for (final r in rehearsals) {
    final title = _monthTitle(_parseDate(r.date));
    if (groups.isEmpty || groups.last.$1 != title) {
      groups.add((title, [r]));
    } else {
      groups.last.$2.add(r);
    }
  }
  final rows = <_Row>[];
  var first = true;
  for (final (title, items) in groups) {
    rows.add(_MonthRow(title, items.length));
    for (var i = 0; i < items.length; i++) {
      rows.add(
        _ItemRow(
          items[i],
          isNext: first,
          isFirstInMonth: i == 0,
          isLastInMonth: i == items.length - 1,
        ),
      );
      first = false;
    }
  }
  return rows;
}

// MARK: - UI Components

class _RehearsalsHeader extends StatelessWidget {
  final VoidCallback onCalendar;
  final VoidCallback onLogout;

  const _RehearsalsHeader({required this.onCalendar, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 12, 4),
      child: Row(
        children: [
          Expanded(
            child: Semantics(
              header: true,
              // Shrinks instead of breaking the word at large text sizes.
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  'Répétitions',
                  style: AppFonts.display(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: s.onSurface,
                    height: 1.1,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.calendar_month_rounded),
            tooltip: 'Calendrier complet',
            onPressed: onCalendar,
            style: IconButton.styleFrom(
              minimumSize: const Size(48, 48),
              backgroundColor: s.surfaceContainer,
              foregroundColor: s.onSurface,
              shape: CircleBorder(side: BorderSide(color: s.outlineVariant)),
            ),
          ),
          const SizedBox(width: 4),
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Déconnexion',
            onPressed: onLogout,
            style: IconButton.styleFrom(
              minimumSize: const Size(48, 48),
              foregroundColor: s.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterPills extends StatelessWidget {
  final GroupType? selectedFilter;
  final void Function(GroupType?) onFilterSelected;
  final VoidCallback onClearFilter;

  const _FilterPills({
    required this.selectedFilter,
    required this.onFilterSelected,
    required this.onClearFilter,
  });

  /// `null` is « Tous »: no filter.
  static const _options = <GroupType?>[
    null,
    GroupType.orchestre,
    GroupType.hommes,
    GroupType.femmes,
    GroupType.jeunesEnfants,
    GroupType.choeurComplet,
  ];

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
      child: Row(
        children: _options.map((group) {
          final label = group == null ? 'Tous' : groupLabel(group);
          final isSelected = selectedFilter == group;
          final shape = StadiumBorder(
            side: BorderSide(
              color: isSelected ? s.primary : s.outlineVariant,
              width: isSelected ? 1.5 : 1,
            ),
          );
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Semantics(
              button: true,
              selected: isSelected,
              child: Material(
                color: isSelected ? s.primary : Colors.transparent,
                shape: shape,
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  customBorder: shape,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    if (group == null) {
                      onClearFilter();
                    } else {
                      onFilterSelected(group);
                    }
                  },
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 48),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 10,
                      ),
                      child: Center(
                        widthFactor: 1,
                        child: Text(
                          label,
                          style: AppFonts.sans(
                            fontSize: 14,
                            fontWeight: isSelected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isSelected ? s.onPrimary : s.onSurface,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _MonthHeader extends StatelessWidget {
  final String title;
  final int count;

  const _MonthHeader({required this.title, required this.count});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 12),
      child: Wrap(
        alignment: WrapAlignment.spaceBetween,
        crossAxisAlignment: WrapCrossAlignment.end,
        spacing: 12,
        runSpacing: 4,
        children: [
          Semantics(
            header: true,
            child: Text(
              title,
              style: AppFonts.display(
                fontSize: 19,
                fontWeight: FontWeight.w700,
                color: s.onSurface,
              ),
            ),
          ),
          Text(
            count > 1 ? '$count répétitions' : '$count répétition',
            style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

/// One rehearsal on the timeline: the rail and its dot on the left, the card
/// on the right. The rail joins the dots of one month.
class _TimelineItem extends StatelessWidget {
  final Rehearsal rehearsal;
  final bool isNext;
  final bool isFirstInMonth;
  final bool isLastInMonth;

  const _TimelineItem({
    required this.rehearsal,
    required this.isNext,
    required this.isFirstInMonth,
    required this.isLastInMonth,
  });

  static const double _rail = 26;
  static const double _dot = 12;
  static const double _dotCenter = 30;
  static const double _gap = 12;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final lineTop = isFirstInMonth ? _dotCenter : 0.0;
    return Stack(
      children: [
        if (!(isFirstInMonth && isLastInMonth))
          Positioned(
            left: (_dot - 2) / 2,
            top: lineTop,
            bottom: isLastInMonth ? null : 0,
            height: isLastInMonth ? _dotCenter - lineTop : null,
            child: ExcludeSemantics(
              child: Container(width: 2, color: s.outlineVariant),
            ),
          ),
        Positioned(
          left: 0,
          top: _dotCenter - _dot / 2,
          child: Container(
            width: _dot,
            height: _dot,
            decoration: BoxDecoration(
              color: isNext ? s.primary : s.surface,
              shape: BoxShape.circle,
              border: Border.all(
                color: isNext ? s.primary : s.outlineVariant,
                width: 2,
              ),
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.only(
            left: _rail,
            bottom: isLastInMonth ? 0 : _gap,
          ),
          child: _RehearsalCard(rehearsal: rehearsal, isNext: isNext),
        ),
      ],
    );
  }
}

class _RehearsalCard extends StatelessWidget {
  final Rehearsal rehearsal;
  final bool isNext;

  const _RehearsalCard({required this.rehearsal, required this.isNext});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final date = _parseDate(rehearsal.date);
    final group = groupLabel(rehearsal.groupType);
    final title = rehearsal.name ?? 'Répétition sans titre';
    final time = frenchTimeRange(rehearsal.startTime, rehearsal.endTime);
    final timeText = time.isEmpty ? 'Heure non spécifiée' : time;
    final place = rehearsal.place ?? 'Lieu non défini';
    final soon = (isNext && date != null) ? _soonLabel(date) : null;
    // At large text sizes the day column would leave the title too little
    // room on a small phone (« Répétitio / n »): the date goes above it.
    final stacked = MediaQuery.textScalerOf(context).scale(1) > 1.3;

    final dateBadge = date == null
        ? null
        : _DateBadge(date: date, horizontal: stacked);
    final details = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 8,
          runSpacing: 4,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            StageEyebrow(
              group,
              color: groupColor(context, rehearsal.groupType),
            ),
            if (soon != null) _SoonPill(label: soon),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          title,
          style: AppFonts.display(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: s.onSurface,
            height: 1.25,
          ),
          maxLines: 3,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 6),
        Text(
          '$timeText · $place',
          style: AppFonts.sans(
            fontSize: 14,
            color: s.onSurfaceVariant,
            height: 1.35,
          ),
        ),
      ],
    );

    return StageCard(
      selected: isNext,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      semanticLabel: [
        group,
        title,
        if (date != null) longDate(date),
        timeText,
        place,
        ?soon,
      ].join(', '),
      child: stacked
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (dateBadge != null) ...[
                  dateBadge,
                  const SizedBox(height: 8),
                ],
                details,
              ],
            )
          : Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (dateBadge != null) ...[
                  dateBadge,
                  const SizedBox(width: 14),
                ],
                Expanded(child: details),
              ],
            ),
    );
  }

  /// « Aujourd’hui », « Demain », then « Dans 3 jours ».
  static String _soonLabel(DateTime date) {
    if (daysUntil(date) <= 1) return countdownLabel(date);
    final rel = relativeDays(date);
    return rel[0].toUpperCase() + rel.substring(1);
  }
}

/// The day of the month over its weekday (« 30 / sam. »), or side by side
/// when the card stacks it above the details.
class _DateBadge extends StatelessWidget {
  final DateTime date;
  final bool horizontal;
  const _DateBadge({required this.date, required this.horizontal});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final day = Text(
      '${date.day}',
      style: AppFonts.display(
        fontSize: 26,
        fontWeight: FontWeight.w800,
        color: s.onSurface,
        height: 1.05,
      ),
    );
    final weekday = Text(
      weekdayShort(date),
      style: AppFonts.sans(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: s.onSurfaceVariant,
      ),
    );
    if (horizontal) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [day, const SizedBox(width: 8), weekday],
      );
    }
    return ConstrainedBox(
      constraints: const BoxConstraints(minWidth: 44),
      child: Column(children: [day, weekday]),
    );
  }
}

class _SoonPill extends StatelessWidget {
  final String label;
  const _SoonPill({required this.label});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: s.primary,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: AppFonts.sans(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: s.onPrimary,
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
    final s = Theme.of(context).colorScheme;
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: s.surfaceContainer,
                  shape: BoxShape.circle,
                  border: Border.all(color: s.outlineVariant),
                ),
                child: Icon(
                  isFilterActive
                      ? Icons.filter_list_off_outlined
                      : Icons.music_off_outlined,
                  size: 48,
                  color: s.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                isFilterActive ? 'Aucun résultat' : 'Aucune répétition',
                textAlign: TextAlign.center,
                style: AppFonts.display(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  color: s.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isFilterActive
                    ? 'Aucune répétition ne correspond à votre filtre. Essayez une autre sélection.'
                    : 'Les prochaines répétitions apparaîtront ici dès qu\'elles seront planifiées.',
                textAlign: TextAlign.center,
                style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
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
  final bool isOnline;
  const _ErrorState({required this.onRetry, this.isOnline = true});

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return FadeInUp(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.cloud_off_outlined, size: 64, color: s.error),
              const SizedBox(height: 24),
              Text(
                isOnline
                    ? 'Oups, une erreur est survenue'
                    : 'Vous êtes hors ligne',
                textAlign: TextAlign.center,
                style: AppFonts.display(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  color: s.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isOnline
                    ? 'Nous n\'avons pas pu charger les répétitions. Vérifiez votre connexion et réessayez.'
                    : 'Aucune répétition n\'est enregistrée sur cet appareil. Reconnectez-vous pour les charger.',
                textAlign: TextAlign.center,
                style: AppFonts.sans(fontSize: 14, color: s.onSurfaceVariant),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Réessayer'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(48, 48),
                  backgroundColor: s.primary,
                  foregroundColor: s.onPrimary,
                  shape: const StadiumBorder(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
