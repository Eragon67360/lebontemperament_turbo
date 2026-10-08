import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/ui_constants.dart';
import '../../../../core/theme/app_fonts.dart';
import '../../../../data/providers/data_providers.dart';
import '../widgets/public_widgets.dart';

/// Upcoming concerts only, soonest first. A concert opens its page (date,
/// place, tickets, directions).
class PublicConcertsScreen extends ConsumerWidget {
  const PublicConcertsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final concertsAsync = ref.watch(sortedUpcomingConcertsProvider);
    final scheme = Theme.of(context).colorScheme;

    Widget message(IconData icon, String text, {Widget? action}) => Padding(
      padding: const EdgeInsets.only(top: 48),
      child: Column(
        children: [
          Icon(icon, size: 48, color: scheme.onSurfaceVariant),
          const SizedBox(height: 16),
          Text(
            text,
            textAlign: TextAlign.center,
            style: AppFonts.sans(
              fontSize: 15,
              height: 1.4,
              color: scheme.onSurfaceVariant,
            ),
          ),
          if (action != null) ...[const SizedBox(height: 12), action],
        ],
      ),
    );

    final List<Widget> body = switch (concertsAsync) {
      AsyncData(value: final items) when items.isNotEmpty => [
        for (final concert in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: PublicConcertCard(
              concert: concert,
              onTap: () => context.push('/concerts/${concert.id}'),
            ),
          ),
      ],
      AsyncData() => [
        message(
          Icons.music_note_outlined,
          'Aucun concert annoncé pour l’instant.\nGardez les notifications : '
          'nous vous prévenons dès qu’un concert l’est.',
        ),
      ],
      AsyncError() => [
        message(
          Icons.cloud_off_outlined,
          'Impossible de charger les concerts.\nVérifiez votre connexion.',
          action: FilledButton.icon(
            onPressed: () => ref.invalidate(realtimeConcertsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
          ),
        ),
      ],
      _ => [
        Padding(
          padding: const EdgeInsets.only(top: 48),
          child: Center(
            child: CircularProgressIndicator(color: scheme.primary),
          ),
        ),
      ],
    };

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(realtimeConcertsProvider),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            SliverSafeArea(
              bottom: false,
              sliver: SliverPadding(
                padding: const EdgeInsets.fromLTRB(
                  kScreenHorizontalPadding,
                  16,
                  kScreenHorizontalPadding,
                  kFloatingNavBarBottomPadding,
                ),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    const PublicPageTitle(
                      title: 'Concerts',
                      subtitle: 'Nos prochains rendez-vous. Venez nombreux !',
                    ),
                    const SizedBox(height: 20),
                    ...body,
                  ]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
