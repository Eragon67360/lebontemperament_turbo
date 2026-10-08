import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_router.dart';
import '../../../../core/config/dependency_injection.dart';
import '../../../../core/constants/ui_constants.dart';
import '../../../../core/theme/app_fonts.dart';
import '../../../../data/providers/app_info_provider.dart';
import '../../../../data/services/session_notifications.dart';
import '../../../notifications/presentation/providers/notification_settings_provider.dart';
import '../../data/public_concert_notifications.dart';
import '../../data/public_content.dart';
import '../widgets/public_widgets.dart';

/// « À propos » for visitors: who we are, three photos, the concert
/// notifications switch, supporting the association (HelloAsso, in the
/// browser), the legal pages, and the members' way in.
class PublicAboutScreen extends ConsumerWidget {
  const PublicAboutScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scheme = Theme.of(context).colorScheme;
    final version = ref.watch(packageInfoProvider).value?.version;

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
                delegate: SliverChildListDelegate([
                  const PublicPageTitle(title: 'À propos'),
                  const SizedBox(height: 16),
                  for (final paragraph in kPublicPresentation)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        paragraph,
                        style: AppFonts.sans(
                          fontSize: 15,
                          height: 1.5,
                          color: scheme.onSurface,
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  const _Photos(),
                  const SizedBox(height: 28),
                  const PublicSectionTitle('Notifications'),
                  const SizedBox(height: 12),
                  const PublicTileGroup(
                    children: [_ConcertNotificationsTile()],
                  ),
                  const SizedBox(height: 28),
                  const PublicSectionTitle('Soutenir l’association'),
                  const SizedBox(height: 12),
                  PublicTileGroup(
                    children: [
                      PublicTile(
                        icon: Icons.volunteer_activism_outlined,
                        title: 'Faire un don',
                        subtitle: 'Sur HelloAsso, dans votre navigateur',
                        external: true,
                        onTap: () => openExternal(context, kHelloAssoUrl),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  const PublicSectionTitle('Liens'),
                  const SizedBox(height: 12),
                  PublicTileGroup(
                    children: [
                      PublicTile(
                        icon: Icons.language_rounded,
                        title: 'Notre site',
                        subtitle: 'lebontemperament.com',
                        external: true,
                        onTap: () => openExternal(context, kWebsiteBaseUrl),
                      ),
                      PublicTile(
                        icon: Icons.mail_outline_rounded,
                        title: 'Nous écrire',
                        subtitle: kSupportEmail,
                        external: true,
                        onTap: () =>
                            openExternal(context, 'mailto:$kSupportEmail'),
                      ),
                      PublicTile(
                        icon: Icons.shield_outlined,
                        title: 'Politique de confidentialité',
                        external: true,
                        onTap: () => openExternal(context, kPrivacyPolicyUrl),
                      ),
                      PublicTile(
                        icon: Icons.gavel_rounded,
                        title: 'Mentions légales',
                        external: true,
                        onTap: () => openExternal(context, kLegalNoticeUrl),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  const PublicSectionTitle('Membres'),
                  const SizedBox(height: 12),
                  PublicTileGroup(
                    children: [
                      PublicTile(
                        icon: Icons.lock_outline_rounded,
                        title: 'Espace membres',
                        subtitle: 'Répétitions, partitions, agenda',
                        onTap: () => context.push(AppRouter.login),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),
                  Text(
                    [
                      '© ${DateTime.now().year} Le Bon Tempérament',
                      if (version != null) 'version $version',
                    ].join(' · '),
                    textAlign: TextAlign.center,
                    style: AppFonts.sans(
                      fontSize: 13,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                ]),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Photos extends StatelessWidget {
  const _Photos();

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      height: 180,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: kPublicPhotos.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final photo = kPublicPhotos[index];
          return Semantics(
            image: true,
            label: photo.caption,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: SizedBox(
                width: 260,
                child: CachedNetworkImage(
                  imageUrl: photo.url(width: 720),
                  fit: BoxFit.cover,
                  placeholder: (_, _) =>
                      ColoredBox(color: scheme.surfaceContainer),
                  errorWidget: (_, _, _) =>
                      ColoredBox(color: scheme.surfaceContainer),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// « Prochains concerts »: on by default. Switching it on asks the phone for
/// the notification permission when it was never given.
class _ConcertNotificationsTile extends ConsumerStatefulWidget {
  const _ConcertNotificationsTile();

  @override
  ConsumerState<_ConcertNotificationsTile> createState() =>
      _ConcertNotificationsTileState();
}

class _ConcertNotificationsTileState
    extends ConsumerState<_ConcertNotificationsTile> {
  bool? _enabled;

  @override
  void initState() {
    super.initState();
    PublicConcertNotifications.isEnabled().then((value) {
      if (mounted) setState(() => _enabled = value);
    });
  }

  Future<void> _set(bool value) async {
    setState(() => _enabled = value);
    if (value) {
      final service = ref.read(notificationServiceProvider);
      if (!await service.hasPermissions()) await service.requestPermissions();
    }
    await PublicConcertNotifications.setEnabled(value);
    final getIt = DependencyInjection.getIt;
    if (getIt.isRegistered<SessionNotifications>()) {
      await getIt<SessionNotifications>().publicConcertsChanged();
    }
  }

  @override
  Widget build(BuildContext context) {
    final enabled = _enabled;
    return MergeSemantics(
      child: PublicTile(
        icon: Icons.notifications_outlined,
        title: 'Prochains concerts',
        subtitle: 'L’annonce de chaque concert, et un rappel deux jours avant',
        onTap: enabled == null ? null : () => _set(!enabled),
        trailing: Switch(
          value: enabled ?? false,
          onChanged: enabled == null ? null : _set,
        ),
      ),
    );
  }
}
