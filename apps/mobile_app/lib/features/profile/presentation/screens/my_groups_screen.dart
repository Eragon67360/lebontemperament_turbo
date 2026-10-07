import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';

import '../../../../data/providers/my_groups_provider.dart';
import '../../../onboarding/presentation/widgets/my_groups_picker.dart';

/// Profil › Mes ensembles: the ensembles picked in the welcome tour, which
/// the home screen, the calendar's filters and the reminders follow. Each
/// tick is saved at once.
class MyGroupsScreen extends ConsumerWidget {
  const MyGroupsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = Theme.of(context).colorScheme;
    final selected = ref.watch(myGroupsProvider);

    return Scaffold(
      backgroundColor: s.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: s.surface,
            surfaceTintColor: s.surface,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              tooltip: 'Retour',
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text(
              'Mes ensembles',
              style: AppFonts.sans(
                color: s.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 80),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Text(
                  'L’accueil, le calendrier et les rappels montrent les '
                  'répétitions de vos ensembles, avec celles du chœur complet '
                  'et de tout le monde. Rien de coché : toute la saison.',
                  style: AppFonts.sans(
                    fontSize: 16,
                    height: 1.5,
                    color: s.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
                MyGroupsPicker(
                  selected: selected,
                  onChanged: ref.read(myGroupsProvider.notifier).set,
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
