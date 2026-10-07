import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/fade_in_up.dart';
import 'package:lebontemperament/core/widgets/notice_banner.dart';
import 'package:lebontemperament/core/widgets/stage.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/providers/connectivity_provider.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:lebontemperament/data/providers/feature_flags_provider.dart';
import 'package:lebontemperament/data/providers/my_groups_provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../../../main/presentation/providers/main_navigation_provider.dart';

/// Home (« Portée »), in three blocks that never mix: the member's
/// rehearsals (the next one large, the week as a bar of music, the two
/// after), the members' shortcuts, then the next concert under its own
/// heading. Only the member's ensembles show (Profil › Mes ensembles).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
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
                  _WelcomeHeader(),
                  SizedBox(height: 24),
                  _NoticesSection(),
                  _RehearsalsSection(),
                  SizedBox(height: 32),
                  StageSectionHeader(title: 'Espace membres'),
                  SizedBox(height: 12),
                  _MembresGrid(),
                  _ConcertSection(),
                  SizedBox(height: 32),
                  _InfoCard(),
                  SizedBox(height: 16),
                  _BetaNoticeCard(),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// MARK: - Header

class _WelcomeHeader extends ConsumerWidget {
  const _WelcomeHeader();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final displayName = ref.watch(displayNameProvider);
    final photoUrl = ref.watch(profilePictureUrlProvider);
    final scheme = Theme.of(context).colorScheme;
    final greeting = DateTime.now().hour < 18 ? 'Bonjour' : 'Bonsoir';
    final firstName = displayName.trim().split(RegExp(r'\s+')).first;
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : '?';

    Widget initials() => Container(
      width: 48,
      height: 48,
      color: scheme.surfaceContainer,
      alignment: Alignment.center,
      child: Text(
        initial,
        style: AppFonts.display(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
        ),
      ),
    );

    return FadeInUp(
      delay: 100,
      child: Row(
        children: [
          const TuningForkMark(size: 30),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              firstName.isEmpty ? greeting : '$greeting, $firstName',
              style: AppFonts.display(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: scheme.onSurface,
                height: 1.15,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 12),
          Semantics(
            button: true,
            label: 'Mon profil',
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () {
                HapticFeedback.lightImpact();
                ref.read(mainNavigationProvider.notifier).setTab(3);
              },
              child: ExcludeSemantics(
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: scheme.outlineVariant),
                  ),
                  child: ClipOval(
                    child: photoUrl != null && photoUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: photoUrl,
                            width: 48,
                            height: 48,
                            fit: BoxFit.cover,
                            placeholder: (_, _) => initials(),
                            errorWidget: (_, _, _) => initials(),
                          )
                        : initials(),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// MARK: - Notices (maintenance, update, offline)

/// Banners from the kill switch (`feature_flags`) and the data layer (#361).
/// Each one is advisory: the app keeps working underneath.
class _NoticesSection extends ConsumerWidget {
  const _NoticesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flags = ref.watch(mobileFlagsProvider).value;
    final updateAdvised = ref.watch(updateAdvisedProvider).value ?? false;
    final dataOffline = ref.watch(homeDataOfflineProvider);
    final isOnline = ref.watch(isOnlineProvider).value ?? true;

    final notices = <Widget>[
      if (flags?.maintenance == true)
        const NoticeBanner(
          icon: Icons.build_circle_outlined,
          tone: NoticeTone.warning,
          title: 'Maintenance en cours',
          message:
              'Certaines fonctionnalités peuvent être indisponibles ou '
              'afficher des données incomplètes pendant quelques instants.',
        ),
      if (updateAdvised)
        NoticeBanner(
          icon: Icons.system_update_outlined,
          tone: NoticeTone.warning,
          title: 'Mise à jour recommandée',
          message:
              'Cette version de l\'application n\'est plus à jour '
              '(minimum : ${flags?.minVersion}). Mettez-la à jour depuis '
              'le store pour éviter les dysfonctionnements.',
        ),
      if (dataOffline) OfflineDataBanner(isOnline: isOnline),
    ];
    if (notices.isEmpty) return const SizedBox.shrink();

    return FadeInUp(
      delay: 200,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final notice in notices) ...[notice, const SizedBox(height: 12)],
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

// MARK: - Rehearsals

class _RehearsalsSection extends ConsumerWidget {
  const _RehearsalsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigation = ref.read(mainNavigationProvider.notifier);
    final isSuperadmin = ref.watch(isSuperadminProvider).value ?? false;
    final filtered = ref.watch(myGroupsProvider).isNotEmpty;
    final rehearsalsAsync = ref.watch(homeUpcomingRehearsalsProvider);
    final rehearsals = rehearsalsAsync.value ?? const <Rehearsal>[];
    final weekRehearsals =
        ref.watch(myUpcomingRehearsalsProvider).value ?? const <Rehearsal>[];
    final weekIsEmpty = WeekStaff.notesFor(
      weekRehearsals,
      DateTime.now(),
    ).isEmpty;

    return FadeInUp(
      delay: 300,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Loading and errors have their own cards: an empty list means the
          // server said so, not that the app has not asked yet.
          switch (rehearsalsAsync) {
            AsyncData(value: final items) when items.isNotEmpty =>
              _NextRehearsalHero(
                rehearsal: items.first,
                onOpenCalendar: () => navigation.setTab(2),
              ),
            AsyncData() => _EmptyStateCard(
              message: filtered
                  ? 'Aucune répétition programmée pour vos ensembles'
                  : 'Aucune répétition programmée',
              icon: Icons.event_busy_rounded,
            ),
            AsyncError() => _ErrorStateCard(
              message: 'Impossible de charger les répétitions.',
              onRetry: () => ref.invalidate(realtimeRehearsalsProvider),
            ),
            _ => const _LoadingCard(label: 'Chargement des répétitions…'),
          },
          if (rehearsalsAsync is AsyncData) ...[
            const SizedBox(height: 28),
            const StageSectionHeader(title: 'Cette semaine'),
            const SizedBox(height: 8),
            WeekStaff(rehearsals: weekRehearsals),
            if (weekIsEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Pas de répétition cette semaine.',
                style: AppFonts.sans(
                  fontSize: 14,
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
          if (rehearsals.length > 1) ...[
            const SizedBox(height: 24),
            StageSectionHeader(
              title: 'Répétitions suivantes',
              actionLabel: 'Tout voir',
              onAction: () => navigation.setTab(2),
            ),
            const SizedBox(height: 8),
            for (final r in rehearsals.skip(1)) ...[
              _RehearsalRow(rehearsal: r, onTap: () => navigation.setTab(2)),
              const SizedBox(height: 10),
            ],
          ],
          if (isSuperadmin) ...[
            const SizedBox(height: 18),
            _AdminActionCard(
              icon: Icons.local_shipping_outlined,
              title: 'Mode livraison',
              subtitle: 'Suivi de position en temps réel',
              onTap: () => context.push('/driver-tracking'),
            ),
          ],
        ],
      ),
    );
  }
}

// MARK: - Concert

/// The next concert, under its own heading and a hairline so it never reads
/// as one more date in the rehearsal list.
class _ConcertSection extends ConsumerWidget {
  const _ConcertSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final navigation = ref.read(mainNavigationProvider.notifier);
    final concertsAsync = ref.watch(homeUpcomingConcertsProvider);
    final scheme = Theme.of(context).colorScheme;

    return FadeInUp(
      delay: 380,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 28),
          Divider(height: 1, thickness: 1, color: scheme.outlineVariant),
          const SizedBox(height: 20),
          StageSectionHeader(
            title: 'Prochain concert',
            actionLabel: 'Tous les concerts',
            onAction: () => navigation.setTab(1),
          ),
          const SizedBox(height: 8),
          switch (concertsAsync) {
            AsyncData(value: final items) when items.isNotEmpty =>
              _NextConcertCard(
                concert: items.first,
                onTap: () => navigation.setTab(1),
              ),
            AsyncData() => const _EmptyStateCard(
              message: 'Aucun concert à venir',
              icon: Icons.piano_off_rounded,
            ),
            AsyncError() => _ErrorStateCard(
              message: 'Impossible de charger les concerts.',
              onRetry: () => ref.invalidate(realtimeConcertsProvider),
            ),
            _ => const _LoadingCard(label: 'Chargement des concerts…'),
          },
        ],
      ),
    );
  }
}

/// The next rehearsal, large: « Demain », the date and time, the group, the
/// place, and a way to get there.
class _NextRehearsalHero extends StatelessWidget {
  const _NextRehearsalHero({
    required this.rehearsal,
    required this.onOpenCalendar,
  });

  final Rehearsal rehearsal;
  final VoidCallback onOpenCalendar;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final date = DateTime.tryParse(rehearsal.date ?? '');
    final days = date == null ? null : daysUntil(date);
    final startHour = int.tryParse((rehearsal.startTime ?? '').split(':')[0]);
    final evening = startHour != null && startHour >= 17;
    final big = date == null
        ? '—'
        : (days! > 30
              ? '${date.day} ${monthShort(date)}'
              : countdownLabel(date, evening: evening));
    final when = [
      if (date != null) longDate(date),
      frenchTimeRange(rehearsal.startTime, rehearsal.endTime),
    ].where((s) => s.isNotEmpty).join(' · ');
    final place = rehearsal.place;

    // No card: the next rehearsal sits on the page ground (« Portée »).
    final card = Semantics(
      container: true,
      label:
          'Prochaine répétition, $big, $when, ${groupLabel(rehearsal.groupType)}'
          '${place != null ? ', $place' : ''}',
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const StageEyebrow('Prochaine répétition'),
            const SizedBox(height: 8),
            Text(
              big,
              style: AppFonts.display(
                fontSize: 44,
                fontWeight: FontWeight.w400,
                color: scheme.onSurface,
                height: 1.05,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              when,
              style: AppFonts.sans(fontSize: 17, color: scheme.onSurface),
            ),
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  // Centres the dot on the first line at any text size.
                  padding: EdgeInsets.only(
                    top: MediaQuery.textScalerOf(context).scale(15) * 0.45,
                  ),
                  child: GroupMark(
                    color: groupColor(context, rehearsal.groupType),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    [
                      groupLabel(rehearsal.groupType),
                      if (place != null && place.isNotEmpty) place,
                    ].join(' · '),
                    style: AppFonts.sans(
                      fontSize: 15,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );

    // The two buttons sit under the card, outside its spoken summary.
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        card,
        const SizedBox(height: 16),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            if (place != null && place.isNotEmpty)
              OutlinedButton.icon(
                onPressed: () => _openMaps(context, place),
                icon: const Icon(Icons.directions_outlined),
                label: const Text('Itinéraire'),
              ),
            OutlinedButton.icon(
              onPressed: onOpenCalendar,
              icon: const Icon(Icons.calendar_month_outlined),
              label: const Text('Calendrier'),
            ),
          ],
        ),
      ],
    );
  }
}

Future<void> _openMaps(BuildContext context, String place) async {
  HapticFeedback.lightImpact();
  final uri = Uri.https('www.google.com', '/maps/search/', {
    'api': '1',
    'query': place,
  });
  try {
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir la carte.')),
      );
    }
  }
}

class _NextConcertCard extends StatelessWidget {
  const _NextConcertCard({required this.concert, required this.onTap});

  final Concert concert;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final date = DateTime.tryParse(concert.date);
    final name = concert.name ?? 'Concert';
    final meta = [
      if (date != null) longDate(date),
      frenchTime(concert.time),
      concert.place,
    ].where((s) => s.isNotEmpty).join(' · ');

    return StageCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      semanticLabel:
          'Concert${date != null ? ' ${relativeDays(date)}' : ''}, $name, $meta',
      child: Row(
        children: [
          if (date != null) StageDateTile(date: date),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StageEyebrow(
                  date != null ? 'Concert · ${relativeDays(date)}' : 'Concert',
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  style: AppFonts.display(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: scheme.onSurface,
                    height: 1.15,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  meta,
                  style: AppFonts.sans(
                    fontSize: 14,
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

/// One line per later rehearsal: day, group colour, group, time and place.
class _RehearsalRow extends StatelessWidget {
  const _RehearsalRow({required this.rehearsal, required this.onTap});

  final Rehearsal rehearsal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final date = DateTime.tryParse(rehearsal.date ?? '');
    final time = frenchTimeRange(rehearsal.startTime, rehearsal.endTime);
    final place = rehearsal.place ?? 'Lieu non défini';

    return StageCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      semanticLabel: [
        if (date != null) longDate(date),
        groupLabel(rehearsal.groupType),
        time,
        place,
      ].where((s) => s.isNotEmpty).join(', '),
      child: Row(
        children: [
          SizedBox(
            width: 52,
            child: Column(
              children: [
                Text(
                  date != null ? '${date.day}' : '—',
                  style: AppFonts.display(
                    fontSize: 24,
                    fontWeight: FontWeight.w400,
                    color: scheme.onSurface,
                    height: 1,
                  ),
                ),
                if (date != null)
                  Text(
                    weekdayShort(date),
                    style: AppFonts.sans(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    GroupMark(color: groupColor(context, rehearsal.groupType)),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        groupLabel(rehearsal.groupType),
                        style: AppFonts.sans(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: scheme.onSurface,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  [time, place].where((s) => s.isNotEmpty).join(' · '),
                  style: AppFonts.sans(
                    fontSize: 14,
                    color: scheme.onSurfaceVariant,
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

class _EmptyStateCard extends StatelessWidget {
  final String message;
  final IconData icon;

  const _EmptyStateCard({required this.message, required this.icon});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      child: Column(
        children: [
          Icon(icon, size: 32, color: scheme.onSurfaceVariant),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppFonts.sans(color: scheme.onSurfaceVariant, fontSize: 15),
          ),
        ],
      ),
    );
  }
}

/// While the list is on its way (first start, or after « Réessayer »).
class _LoadingCard extends StatelessWidget {
  final String label;

  const _LoadingCard({required this.label});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      semanticLabel: label,
      child: Column(
        children: [
          SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              color: scheme.primary,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            textAlign: TextAlign.center,
            style: AppFonts.sans(color: scheme.onSurfaceVariant, fontSize: 15),
          ),
        ],
      ),
    );
  }
}

/// The server failed and nothing is cached: say so, with a way to try again.
class _ErrorStateCard extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorStateCard({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      child: Column(
        children: [
          Icon(Icons.cloud_off_outlined, size: 32, color: scheme.error),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppFonts.sans(color: scheme.onSurface, fontSize: 15),
          ),
          const SizedBox(height: 12),
          FilledButton.tonalIcon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
            style: FilledButton.styleFrom(minimumSize: const Size(48, 48)),
          ),
        ],
      ),
    );
  }
}

class _AdminActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _AdminActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      onTap: onTap,
      color: scheme.tertiaryContainer,
      semanticLabel: '$title, $subtitle',
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: scheme.onTertiaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: scheme.tertiaryContainer, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppFonts.sans(
                    color: scheme.onTertiaryContainer,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                Text(
                  subtitle,
                  style: AppFonts.sans(
                    color: scheme.onTertiaryContainer,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_rounded, color: scheme.onTertiaryContainer),
        ],
      ),
    );
  }
}

// MARK: - Espace membres

class _MembresGrid extends ConsumerWidget {
  const _MembresGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // No « Calendrier » tile: the tab bar and the next rehearsal open it.
    final tiles = <_Tile>[
      _Tile(
        Icons.library_music_outlined,
        'Partitions',
        () => context.push('/partitions'),
      ),
      _Tile(Icons.group_outlined, 'Membres', () => context.push('/members')),
      _Tile(
        Icons.description_outlined,
        'Administration',
        () => context.push('/administration'),
      ),
    ];

    return FadeInUp(
      delay: 350,
      child: LayoutBuilder(
        builder: (context, constraints) {
          // One row of three, icon above the label, so the shortcuts stay
          // near the top; a list when large text would make the labels wrap
          // badly.
          final scale = MediaQuery.textScalerOf(context).scale(1.0);
          final columns = scale >= 1.3 ? 1 : 3;
          const gap = 10.0;
          final width = (constraints.maxWidth - gap * (columns - 1)) / columns;
          return Wrap(
            spacing: gap,
            runSpacing: gap,
            children: [
              for (final t in tiles)
                SizedBox(
                  width: width,
                  child: _MembresTile(tile: t, stacked: columns > 1),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _Tile {
  const _Tile(this.icon, this.title, this.onTap);
  final IconData icon;
  final String title;
  final VoidCallback onTap;
}

class _MembresTile extends StatelessWidget {
  const _MembresTile({required this.tile, required this.stacked});
  final _Tile tile;

  /// Icon above the label (a row of three) or beside it (a list).
  final bool stacked;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final icon = Icon(tile.icon, color: scheme.primary, size: 24);
    final label = Text(
      tile.title,
      textAlign: stacked ? TextAlign.center : TextAlign.start,
      style: AppFonts.sans(
        fontSize: 15,
        fontWeight: FontWeight.w500,
        color: scheme.onSurface,
      ),
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
    );
    return StageCard(
      onTap: tile.onTap,
      semanticLabel: tile.title,
      padding: stacked
          ? const EdgeInsets.symmetric(horizontal: 6, vertical: 14)
          : const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: stacked
          ? Column(
              children: [
                SizedBox(height: 28, child: icon),
                const SizedBox(height: 6),
                FittedBox(fit: BoxFit.scaleDown, child: label),
              ],
            )
          : Row(
              children: [
                SizedBox(width: 32, height: 44, child: icon),
                const SizedBox(width: 12),
                Expanded(child: label),
              ],
            ),
    );
  }
}

// MARK: - Info & Footer

class _InfoCard extends StatelessWidget {
  const _InfoCard();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    return FadeInUp(
      delay: 400,
      child: StageCard(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Le Bon Tempérament',
                    style: AppFonts.display(
                      fontWeight: FontWeight.w700,
                      fontSize: 20,
                      color: scheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Ensemble vocal et instrumental.\nSaverne, depuis 1987.',
                    style: AppFonts.sans(
                      fontSize: 14,
                      height: 1.45,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            const TuningForkMark(size: 40),
          ],
        ),
      ),
    );
  }
}

class _BetaNoticeCard extends StatelessWidget {
  const _BetaNoticeCard();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;

    // The whole card is the target; « Contacter » stays as the visual cue.
    return FadeInUp(
      delay: 500,
      child: StageCard(
        onTap: () => _launchEmail(context),
        semanticLabel: 'Version bêta : signaler un bug, contacter par e-mail',
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(Icons.science_outlined, size: 20, color: scheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Version bêta : signaler un bug',
                style: AppFonts.sans(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'Contacter',
              style: AppFonts.sans(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: scheme.primary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _launchEmail(BuildContext context) async {
    final uri = Uri(
      scheme: 'mailto',
      path: kSupportEmail,
      query: Uri(
        queryParameters: {
          'subject': 'Retour sur l\'application – Le Bon Tempérament',
        },
      ).query,
    );
    // launchUrl answers false when no mail app is installed (and throws on
    // some devices): both end in the same hint.
    var opened = false;
    try {
      opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      opened = false;
    }
    if (!opened && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Aucune application e-mail trouvée : écrivez à $kSupportEmail',
          ),
        ),
      );
    }
  }
}
