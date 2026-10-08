import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_router.dart';
import '../../../../core/constants/ui_constants.dart';
import '../../../../core/theme/app_fonts.dart';
import '../../../../core/widgets/fade_in_up.dart';
import '../../../../core/widgets/stage.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../delivery/data/delivery_pass.dart';
import '../../../delivery/presentation/providers/delivery_providers.dart';
import '../../../delivery/presentation/screens/delivery_screen.dart';
import '../../data/public_content.dart';
import '../providers/public_navigation_provider.dart';
import '../widgets/public_widgets.dart';

/// The public home: who we are in one line, the next concert, and the way
/// in for people who want to sing or play with us.
class PublicHomeScreen extends ConsumerWidget {
  const PublicHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                  delegate: SliverChildListDelegate(const [
                    FadeInUp(delay: 100, child: _Header()),
                    SizedBox(height: 28),
                    _DeliverySection(),
                    FadeInUp(delay: 200, child: _NextConcertSection()),
                    SizedBox(height: 28),
                    FadeInUp(delay: 300, child: _JoinCard()),
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

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const TuningForkMark(size: 30),
            const SizedBox(width: 12),
            Expanded(
              child: Semantics(
                header: true,
                child: Text(
                  'Le Bon Tempérament',
                  style: AppFonts.display(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: scheme.onSurface,
                    height: 1.15,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const MembersButton(),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          kPublicTagline,
          style: AppFonts.sans(
            fontSize: 15,
            height: 1.4,
            color: scheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

/// « Espace membres »: today's sign-in screen, with a way back.
class MembersButton extends StatelessWidget {
  const MembersButton({super.key});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: () => context.push(AppRouter.login),
      icon: const Icon(Icons.lock_outline_rounded, size: 18),
      label: const Text('Membres'),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(48, 44),
        padding: const EdgeInsets.symmetric(horizontal: 14),
      ),
    ).withSemantics('Espace membres');
  }
}

extension on Widget {
  Widget withSemantics(String label) => Semantics(
    button: true,
    label: label,
    excludeSemantics: true,
    child: this,
  );
}

/// « Votre livraison » (#593): only on a phone that holds a delivery pass,
/// so visitors without a code never hear of deliveries.
class _DeliverySection extends ConsumerWidget {
  const _DeliverySection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final passes = ref.watch(deliveryPassesProvider).value ?? const [];
    if (passes.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final pass in passes) ...[
          FadeInUp(delay: 150, child: _DeliveryCard(pass: pass)),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 16),
      ],
    );
  }
}

class _DeliveryCard extends StatelessWidget {
  const _DeliveryCard({required this.pass});

  final DeliveryPass pass;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final greeting = pass.label.isEmpty ? 'Bonjour' : 'Bonjour ${pass.label}';
    return StageCard(
      selected: true,
      onTap: () => context.push(deliveryPath(pass.recipientId)),
      semanticLabel: 'Votre livraison. $greeting, suivre la livraison',
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.primary,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.local_shipping_outlined, color: scheme.onPrimary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Votre livraison',
                  style: AppFonts.display(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: scheme.onSurface,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$greeting · suivre la livraison',
                  style: AppFonts.sans(
                    fontSize: 14,
                    height: 1.4,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Icon(Icons.chevron_right_rounded, color: scheme.onSurfaceVariant),
        ],
      ),
    );
  }
}

class _NextConcertSection extends ConsumerWidget {
  const _NextConcertSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final concertsAsync = ref.watch(sortedUpcomingConcertsProvider);
    final scheme = Theme.of(context).colorScheme;
    void showAll() =>
        ref.read(publicNavigationProvider.notifier).state = PublicTab.concerts;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        StageSectionHeader(
          title: 'Prochain concert',
          actionLabel: 'Tous les concerts',
          onAction: showAll,
        ),
        const SizedBox(height: 8),
        switch (concertsAsync) {
          AsyncData(value: final items) when items.isNotEmpty =>
            PublicConcertCard(
              concert: items.first,
              showPoster: true,
              onTap: () => context.push('/concerts/${items.first.id}'),
            ),
          AsyncData() => _Note(
            icon: Icons.music_note_outlined,
            text:
                'Le prochain concert n’est pas encore annoncé. Gardez les '
                'notifications : nous vous prévenons dès qu’il l’est.',
          ),
          AsyncError() => _Note(
            icon: Icons.cloud_off_outlined,
            text:
                'Impossible de charger les concerts. Vérifiez votre '
                'connexion.',
            action: TextButton(
              onPressed: () => ref.invalidate(realtimeConcertsProvider),
              child: const Text('Réessayer'),
            ),
          ),
          _ => SizedBox(
            height: 96,
            child: Center(
              child: CircularProgressIndicator(color: scheme.primary),
            ),
          ),
        },
      ],
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      child: Row(
        children: [
          Icon(icon, color: scheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: AppFonts.sans(
                fontSize: 14,
                height: 1.4,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
          ?action,
        ],
      ),
    );
  }
}

class _JoinCard extends ConsumerWidget {
  const _JoinCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      onTap: () =>
          ref.read(publicNavigationProvider.notifier).state = PublicTab.join,
      semanticLabel: 'Envie de chanter ou de jouer avec nous ? Nous rejoindre',
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: scheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.group_add_outlined, color: scheme.primary),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Envie de chanter ou de jouer avec nous ?',
                  style: AppFonts.display(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: scheme.onSurface,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Sans audition, sans savoir lire la musique : venez à une '
                  'répétition d’essai.',
                  style: AppFonts.sans(
                    fontSize: 14,
                    height: 1.4,
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Icon(Icons.chevron_right_rounded, color: scheme.onSurfaceVariant),
        ],
      ),
    );
  }
}
