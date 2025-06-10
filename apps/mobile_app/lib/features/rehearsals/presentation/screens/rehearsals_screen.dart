import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/rehearsal_filter_provider.dart';

class RehearsalsScreen extends ConsumerWidget {
  const RehearsalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rehearsalsAsync = ref.watch(rehearsalsProvider);
    final selectedFilter = ref.watch(rehearsalFilterProvider);
    final filteredRehearsals = ref.watch(filteredRehearsalsProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: Text(
          'Répétitions',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
        ),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              Icons.filter_list,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            onPressed: () => _showFilterDialog(context, ref, selectedFilter),
          ),
          IconButton(
            icon: Icon(
              Icons.logout,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            onPressed: () async {
              try {
                await ref.read(authServiceProvider).signOut();
                if (context.mounted) {
                  context.go('/login');
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erreur lors de la déconnexion: $e'),
                      backgroundColor: Theme.of(context).colorScheme.error,
                    ),
                  );
                }
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          if (selectedFilter != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Chip(
                      label: Text(
                        'Filtré par: ${_getGroupTypeText(selectedFilter)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      backgroundColor: AppTheme.getSubtleBackgroundColor(
                        context,
                      ),
                      deleteIcon: Icon(
                        Icons.close,
                        size: 16,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                      onDeleted: () => ref
                          .read(rehearsalFilterProvider.notifier)
                          .clearFilter(),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Rehearsals list
          Expanded(
            child: rehearsalsAsync.when(
              data: (rehearsals) {
                if (filteredRehearsals.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          selectedFilter != null
                              ? Icons.filter_list_off
                              : Icons.repeat_one,
                          size: 64,
                          color: Theme.of(context).colorScheme.error,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          selectedFilter != null
                              ? 'Aucune répétition trouvée'
                              : 'Aucune répétition',
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.error,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          selectedFilter != null
                              ? 'Aucune répétition ne correspond au filtre sélectionné'
                              : 'Aucune répétition n\'est prévue pour le moment',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredRehearsals.length,
                  itemBuilder: (context, index) {
                    final rehearsal = filteredRehearsals[index];
                    return _buildRehearsalCard(context, rehearsal);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error,
                      size: 64,
                      color: Theme.of(context).colorScheme.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erreur lors du chargement',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Veuillez réessayer',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterDialog(
    BuildContext context,
    WidgetRef ref,
    GroupType? selectedFilter,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Filtrer par groupe',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // All option
            ListTile(
              leading: Radio<GroupType?>(
                value: null,
                groupValue: selectedFilter,
                onChanged: (value) {
                  ref.read(rehearsalFilterProvider.notifier).setFilter(value);
                  Navigator.of(context).pop();
                },
              ),
              title: Text(
                'Tous les groupes',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                ),
              ),
              onTap: () {
                ref.read(rehearsalFilterProvider.notifier).setFilter(null);
                Navigator.of(context).pop();
              },
            ),
            // Individual group options
            ...GroupType.values.map(
              (groupType) => ListTile(
                leading: Radio<GroupType?>(
                  value: groupType,
                  groupValue: selectedFilter,
                  onChanged: (value) {
                    ref.read(rehearsalFilterProvider.notifier).setFilter(value);
                    Navigator.of(context).pop();
                  },
                ),
                title: Text(
                  _getGroupTypeText(groupType),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                  ),
                ),
                onTap: () {
                  ref
                      .read(rehearsalFilterProvider.notifier)
                      .setFilter(groupType);
                  Navigator.of(context).pop();
                },
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              'Annuler',
              style: TextStyle(color: Theme.of(context).colorScheme.primary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRehearsalCard(BuildContext context, Rehearsal rehearsal) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with icon and title
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.getSubtleBackgroundColor(context),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.repeat,
                    color: Theme.of(context).colorScheme.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rehearsal.name ?? 'Répétition sans titre',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _getGroupTypeText(rehearsal.groupType),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Date and time
            if (rehearsal.date != null || rehearsal.startTime != null) ...[
              Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatRehearsalDateTime(
                      rehearsal.date,
                      rehearsal.startTime,
                      rehearsal.endTime,
                    ),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
            ],

            // Location
            if (rehearsal.place != null && rehearsal.place!.isNotEmpty) ...[
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      rehearsal.place!,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // Action button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => context.go('/rehearsals/${rehearsal.id}'),
                icon: const Icon(Icons.visibility, size: 16),
                label: const Text('Voir les détails'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatRehearsalDateTime(
    String? date,
    String? startTime,
    String? endTime,
  ) {
    if (date == null && startTime == null && endTime == null) {
      return 'Date et heure non renseignées';
    }

    String dateStr = 'Date non renseignée';
    String timeStr = 'Heure non renseignée';

    if (date != null) {
      try {
        final dateTime = DateTime.parse(date);
        dateStr = DateFormat('d MMMM yyyy', 'fr_FR').format(dateTime);
      } catch (e) {
        dateStr = date;
      }
    }

    if (startTime != null && endTime != null) {
      try {
        final startParts = startTime.split(':');
        final endParts = endTime.split(':');
        if (startParts.length >= 2 && endParts.length >= 2) {
          timeStr =
              '${startParts[0]}h${startParts[1]} à ${endParts[0]}h${endParts[1]}';
        } else {
          timeStr = '$startTime à $endTime';
        }
      } catch (e) {
        timeStr = '$startTime à $endTime';
      }
    } else if (startTime != null) {
      try {
        final timeParts = startTime.split(':');
        if (timeParts.length >= 2) {
          timeStr = '${timeParts[0]}h${timeParts[1]}';
        } else {
          timeStr = startTime;
        }
      } catch (e) {
        timeStr = startTime;
      }
    }

    return '$dateStr - $timeStr';
  }

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
}
