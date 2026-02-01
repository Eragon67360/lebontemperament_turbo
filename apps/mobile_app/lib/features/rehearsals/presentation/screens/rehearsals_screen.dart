import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

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

  void _showFilterModal(BuildContext context, GroupType? currentFilter) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _FilterModal(
        currentFilter: currentFilter,
        onFilterSelected: (groupType) {
          ref.read(rehearsalFilterProvider.notifier).setFilter(groupType);
          Navigator.of(context).pop();
        },
      ),
    );
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
        backgroundColor: theme.colorScheme.surfaceVariant,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // --- 1. Dynamic App Bar ---
            _RehearsalsAppBar(
              onFilter: () => _showFilterModal(context, selectedFilter),
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

            // --- 2. Active Filter Chip ---
            if (selectedFilter != null)
              SliverToBoxAdapter(
                child: FadeInUp(
                  delay: 50,
                  child: _FilterChip(
                    label: _getGroupTypeText(selectedFilter),
                    onClear: () => ref
                        .read(rehearsalFilterProvider.notifier)
                        .clearFilter(),
                  ),
                ),
              ),

            // --- 3. Main Content based on State ---
            rehearsalsAsync.when(
              data: (rehearsals) {
                if (filteredRehearsals.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyState(isFilterActive: selectedFilter != null),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 80),
                  sliver: SliverList.builder(
                    itemCount: filteredRehearsals.length,
                    itemBuilder: (context, index) {
                      final rehearsal = filteredRehearsals[index];
                      return FadeInUp(
                        delay: 100 + (index * 50),
                        child: _RehearsalCard(
                          rehearsal: rehearsal,
                          isLast: index == filteredRehearsals.length - 1,
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
  final VoidCallback onFilter;
  final VoidCallback onLogout;

  const _RehearsalsAppBar({required this.onFilter, required this.onLogout});

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
          icon: const Icon(Icons.filter_list_rounded),
          color: theme.colorScheme.onSurfaceVariant,
          tooltip: 'Filtrer',
          onPressed: onFilter,
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

class _FilterChip extends StatelessWidget {
  final String label;
  final VoidCallback onClear;

  const _FilterChip({required this.label, required this.onClear});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
      child: Container(
        padding: const EdgeInsets.only(left: 12),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(100),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Filtre:',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.primary,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.poppins(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            IconButton(
              icon: const Icon(Icons.close, size: 18),
              color: theme.colorScheme.primary,
              onPressed: onClear,
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterModal extends StatelessWidget {
  final GroupType? currentFilter;
  final Function(GroupType?) onFilterSelected;

  const _FilterModal({this.currentFilter, required this.onFilterSelected});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filtrer par groupe',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 16),
          _buildFilterOption(context, 'Tous les groupes', null),
          ...GroupType.values.map(
            (group) =>
                _buildFilterOption(context, _getGroupTypeText(group), group),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }

  Widget _buildFilterOption(
    BuildContext context,
    String title,
    GroupType? value,
  ) {
    return RadioListTile<GroupType?>(
      title: Text(title, style: GoogleFonts.poppins()),
      value: value,
      groupValue: currentFilter,
      onChanged: (newValue) => onFilterSelected(newValue),
      contentPadding: EdgeInsets.zero,
      activeColor: Theme.of(context).colorScheme.primary,
    );
  }
}

class _RehearsalCard extends StatelessWidget {
  final Rehearsal rehearsal;
  final bool isLast;

  const _RehearsalCard({required this.rehearsal, this.isLast = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Date parsing logic
    String day = '-';
    String month = '-';
    if (rehearsal.date != null) {
      try {
        final dateTime = DateTime.parse(rehearsal.date!);
        day = DateFormat('d', 'fr_FR').format(dateTime);
        month = DateFormat('MMM', 'fr_FR').format(dateTime).toUpperCase();
      } catch (e) {
        // Handle potential parsing error if date format is unexpected
      }
    }

    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: theme.colorScheme.outline.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            // --- Date Section ---
            SizedBox(
              width: 55,
              child: Column(
                children: [
                  Text(
                    month,
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    day,
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.bold,
                      fontSize: 32,
                      height: 1.1,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Container(
              width: 1,
              height: 60,
              color: theme.colorScheme.outline.withOpacity(0.3),
            ),
            const SizedBox(width: 16),

            // --- Details Section ---
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _GroupTypeTag(groupType: rehearsal.groupType),
                  const SizedBox(height: 8),
                  Text(
                    rehearsal.name ?? 'Répétition sans titre',
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                      fontSize: 17,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.access_time_outlined,
                    text: _formatTimeRange(
                      rehearsal.startTime,
                      rehearsal.endTime,
                    ),
                  ),
                  if (rehearsal.place != null &&
                      rehearsal.place!.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    _InfoRow(
                      icon: Icons.location_on_outlined,
                      text: rehearsal.place!,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GroupTypeTag extends StatelessWidget {
  final GroupType groupType;
  const _GroupTypeTag({required this.groupType});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer.withOpacity(0.6),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        _getGroupTypeText(groupType),
        style: GoogleFonts.poppins(
          color: theme.colorScheme.onSecondaryContainer,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, color: theme.colorScheme.onSurfaceVariant, size: 14),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.poppins(
              color: theme.colorScheme.onSurfaceVariant,
              fontSize: 13,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
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
              Icon(
                isFilterActive
                    ? Icons.filter_list_off_outlined
                    : Icons.music_off_outlined,
                size: 72,
                color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
              ),
              const SizedBox(height: 24),
              Text(
                isFilterActive ? 'Aucun résultat' : 'Aucune répétition',
                style: GoogleFonts.poppins(
                  fontSize: 20,
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
                size: 72,
                color: theme.colorScheme.error.withOpacity(0.7),
              ),
              const SizedBox(height: 24),
              Text(
                'Oups, une erreur est survenue',
                style: GoogleFonts.poppins(
                  fontSize: 20,
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
