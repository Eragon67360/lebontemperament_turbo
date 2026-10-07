import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/confirm_logout_dialog.dart';
import 'package:lebontemperament/data/models/member.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/members_filter_provider.dart';
import '../../../../core/utils/text_scale.dart';
import '../../../onboarding/presentation/widgets/first_time_tip.dart';

class MembersScreen extends ConsumerStatefulWidget {
  const MembersScreen({super.key});

  @override
  ConsumerState<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends ConsumerState<MembersScreen> {
  /// Reloads the directory and keeps the indicator spinning until it is
  /// back (an error shows on the screen, not here).
  Future<void> _onRefresh() async {
    ref.invalidate(membersProvider);
    try {
      await ref.read(membersProvider.future);
    } catch (_) {}
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
    final membersAsync = ref.watch(membersProvider);
    final searchTerm = ref.watch(membersSearchProvider);
    final selectedVoice = ref.watch(membersVoiceFilterProvider);
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
            _MembersAppBar(onLogout: _logout),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: membersAsync.when(
                  data: (members) {
                    final voiceWords = _extractVoiceWords(members);
                    final filtered = filterMembers(
                      members,
                      searchTerm,
                      selectedVoice,
                    );

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 16),
                        _SearchBar(
                          onChanged: (v) =>
                              ref.read(membersSearchProvider.notifier).state =
                                  v,
                        ),
                        const SizedBox(height: 12),
                        _VoiceFilterDropdown(
                          voiceWords: voiceWords,
                          selected: selectedVoice,
                          onChanged: (v) =>
                              ref
                                      .read(membersVoiceFilterProvider.notifier)
                                      .state =
                                  v,
                        ),
                        const FirstTimeTip(
                          id: 'members_contact',
                          message:
                              'Touchez un e-mail pour écrire, un numéro pour '
                              'appeler, une adresse pour la copier.',
                          padding: EdgeInsets.only(top: 16),
                        ),
                        const SizedBox(height: 16),
                        _MemberCountLabel(count: filtered.length),
                        const SizedBox(height: 16),
                      ],
                    );
                  },
                  loading: () => const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Column(
                      children: [
                        Icon(
                          Icons.cloud_off_outlined,
                          size: 64,
                          color: theme.colorScheme.error,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Impossible de charger l’annuaire. Vérifiez votre connexion et réessayez.',
                          textAlign: TextAlign.center,
                          style: AppFonts.sans(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: _onRefresh,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            membersAsync.when(
              data: (members) {
                final filtered = filterMembers(
                  members,
                  searchTerm,
                  selectedVoice,
                );

                if (filtered.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.people_outline,
                            size: 64,
                            color: theme.colorScheme.onSurfaceVariant
                                .withValues(alpha: 0.5),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Aucun résultat trouvé',
                            style: AppFonts.sans(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Essayez de modifier votre recherche',
                            style: AppFonts.sans(
                              fontSize: 14,
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    20,
                    0,
                    20,
                    kFloatingNavBarBottomPadding,
                  ),
                  sliver: SliverList.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _MemberCard(member: filtered[index]),
                      );
                    },
                  ),
                );
              },
              loading: () => const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              ),
              error: (_, __) =>
                  const SliverFillRemaining(child: SizedBox.shrink()),
            ),
          ],
        ),
      ),
    );
  }

  List<String> _extractVoiceWords(List<Member> members) {
    final words = <String>{};
    for (final m in members) {
      if (m.voice == null || m.voice!.isEmpty) continue;
      final parts = m.voice!
          .toLowerCase()
          .split(RegExp(r'[&\s,]+'))
          .map((p) => p.trim())
          .where((p) => p.isNotEmpty);
      words.addAll(parts);
    }
    return words.toList()..sort();
  }
}

class _MembersAppBar extends StatelessWidget {
  final VoidCallback onLogout;

  const _MembersAppBar({required this.onLogout});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SliverAppBar(
      backgroundColor: theme.colorScheme.surface,
      surfaceTintColor: theme.colorScheme.surface,
      pinned: true,
      expandedHeight: headerHeight(context, 100, text: 40),
      flexibleSpace: FlexibleSpaceBar(
        expandedTitleScale: expandedTitleScale(context),
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        centerTitle: false,
        title: Text(
          'Membres',
          style: AppFonts.sans(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.logout_outlined),
          color: theme.colorScheme.onSurfaceVariant,
          tooltip: 'Déconnexion',
          onPressed: () {
            HapticFeedback.lightImpact();
            onLogout();
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}

class _SearchBar extends StatefulWidget {
  final ValueChanged<String> onChanged;

  const _SearchBar({required this.onChanged});

  @override
  State<_SearchBar> createState() => _SearchBarState();
}

class _SearchBarState extends State<_SearchBar> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return TextField(
      controller: _controller,
      onChanged: widget.onChanged,
      decoration: InputDecoration(
        hintText: 'Rechercher un membre...',
        prefixIcon: const Icon(Icons.search),
        filled: true,
        fillColor: theme.colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.5,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      style: AppFonts.sans(fontSize: 15),
    );
  }
}

class _VoiceFilterDropdown extends StatelessWidget {
  final List<String> voiceWords;
  final String selected;
  final ValueChanged<String> onChanged;

  const _VoiceFilterDropdown({
    required this.voiceWords,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return DropdownButtonFormField<String>(
      isExpanded: true,
      initialValue: selected.isEmpty || !voiceWords.contains(selected)
          ? ''
          : selected,
      decoration: InputDecoration(
        hintText: 'Toutes les voix',
        prefixIcon: const Icon(Icons.music_note_outlined),
        filled: true,
        fillColor: theme.colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.5,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      items: [
        const DropdownMenuItem(value: '', child: Text('Toutes les voix')),
        ...voiceWords.map(
          (v) => DropdownMenuItem(
            value: v,
            child: Text(v.isEmpty ? v : v[0].toUpperCase() + v.substring(1)),
          ),
        ),
      ],
      onChanged: (v) => onChanged(v ?? ''),
    );
  }
}

class _MemberCountLabel extends StatelessWidget {
  final int count;

  const _MemberCountLabel({required this.count});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '$count membre${count != 1 ? 's' : ''}',
        style: AppFonts.sans(
          color: theme.colorScheme.onPrimary,
          fontWeight: FontWeight.w600,
          fontSize: 14,
        ),
      ),
    );
  }
}

class _MemberCard extends StatelessWidget {
  final Member member;

  const _MemberCard({required this.member});

  String _getInitials(String name) {
    if (name.trim().isEmpty) return '?';
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty);
    if (parts.length >= 2) {
      final first = parts.first[0];
      final last = parts.last[0];
      return '$first$last'.toUpperCase();
    }
    return parts.first.substring(0, 2).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainer.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: member.photoUrl != null && member.photoUrl!.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: member.photoUrl!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => _buildInitialsAvatar(theme),
                        errorWidget: (_, __, ___) =>
                            _buildInitialsAvatar(theme),
                      )
                    : _buildInitialsAvatar(theme),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      member.displayName,
                      style: AppFonts.sans(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    if (member.voice != null && member.voice!.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer.withValues(
                            alpha: 0.5,
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          member.voice!,
                          style: AppFonts.sans(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (member.email.isNotEmpty)
            _ContactRow(
              icon: Icons.email_outlined,
              text: member.email,
              semanticsLabel: 'Envoyer un e-mail à ${member.email}',
              style: AppFonts.sans(
                fontSize: 14,
                color: theme.colorScheme.primary,
                decoration: TextDecoration.underline,
              ),
              onTap: () => launchUrl(
                Uri.parse('mailto:${member.email}'),
                mode: LaunchMode.externalApplication,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInitialsAvatar(ThemeData theme) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.primary.withValues(alpha: 0.8),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      alignment: Alignment.center,
      child: Text(
        _getInitials(member.displayName),
        style: AppFonts.sans(
          color: theme.colorScheme.onPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// A tappable contact line (the e-mail): a link for screen
/// readers, at least 48 dp high for fingers.
class _ContactRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final TextStyle style;
  final String semanticsLabel;
  final VoidCallback onTap;

  const _ContactRow({
    required this.icon,
    required this.text,
    required this.style,
    required this.semanticsLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    // Its own node with its own tap action: the InkWell's is excluded below,
    // and without one a screen reader merges the line into the card.
    return Semantics(
      container: true,
      link: true,
      label: semanticsLabel,
      onTap: onTap,
      excludeSemantics: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: theme.colorScheme.primary),
                  const SizedBox(width: 10),
                  Expanded(child: Text(text, style: style)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
