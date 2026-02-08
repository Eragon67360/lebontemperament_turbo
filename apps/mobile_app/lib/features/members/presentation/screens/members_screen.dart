import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/data/models/member.dart';
import 'package:lebontemperament/data/providers/data_providers.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/members_filter_provider.dart';

class MembersScreen extends ConsumerStatefulWidget {
  const MembersScreen({super.key});

  @override
  ConsumerState<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends ConsumerState<MembersScreen> {
  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(membersProvider);
    final searchTerm = ref.watch(membersSearchProvider);
    final selectedVoice = ref.watch(membersVoiceFilterProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(membersProvider);
        },
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surfaceContainerHighest,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            _MembersAppBar(
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
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: membersAsync.when(
                  data: (members) {
                    final voiceWords = _extractVoiceWords(members);
                    final filtered = _filterMembers(
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
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'Erreur: $e',
                      style: GoogleFonts.poppins(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            membersAsync.when(
              data: (members) {
                final searchTerm = ref.watch(membersSearchProvider);
                final selectedVoice = ref.watch(membersVoiceFilterProvider);
                final filtered = _filterMembers(
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
                            style: GoogleFonts.poppins(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Essayez de modifier votre recherche',
                            style: GoogleFonts.poppins(
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

  List<Member> _filterMembers(
    List<Member> members,
    String searchTerm,
    String selectedVoice,
  ) {
    return members.where((m) {
      final matchesSearch =
          searchTerm.isEmpty ||
          m.displayName.toLowerCase().contains(searchTerm.toLowerCase()) ||
          m.email.toLowerCase().contains(searchTerm.toLowerCase()) ||
          (m.voice ?? '').toLowerCase().contains(searchTerm.toLowerCase()) ||
          (m.mobilePhone ?? '').contains(searchTerm) ||
          (m.homePhone ?? '').contains(searchTerm) ||
          (m.address ?? '').toLowerCase().contains(searchTerm.toLowerCase());

      final matchesVoice =
          selectedVoice.isEmpty ||
          (m.voice ?? '').toLowerCase().contains(selectedVoice.toLowerCase());

      return matchesSearch && matchesVoice;
    }).toList();
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
      expandedHeight: 100,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        centerTitle: false,
        title: Text(
          'Membres',
          style: GoogleFonts.poppins(
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
      style: GoogleFonts.poppins(fontSize: 15),
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
      value: selected.isEmpty || !voiceWords.contains(selected) ? '' : selected,
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
        style: GoogleFonts.poppins(
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
                      style: GoogleFonts.poppins(
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
                          style: GoogleFonts.poppins(
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
          const SizedBox(height: 16),
          if (member.email.isNotEmpty)
            _ContactRow(
              icon: Icons.email_outlined,
              child: GestureDetector(
                onTap: () => launchUrl(
                  Uri.parse('mailto:${member.email}'),
                  mode: LaunchMode.externalApplication,
                ),
                child: Text(
                  member.email,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: theme.colorScheme.primary,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
          if (member.mobilePhone != null && member.mobilePhone!.isNotEmpty)
            _ContactRow(
              icon: Icons.phone_android_outlined,
              child: GestureDetector(
                onTap: () => launchUrl(
                  Uri.parse('tel:${member.mobilePhone!.replaceAll(' ', '')}'),
                  mode: LaunchMode.externalApplication,
                ),
                child: Text(
                  member.mobilePhone!,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          if (member.homePhone != null && member.homePhone!.isNotEmpty)
            _ContactRow(
              icon: Icons.phone_outlined,
              child: GestureDetector(
                onTap: () => launchUrl(
                  Uri.parse('tel:${member.homePhone!.replaceAll(' ', '')}'),
                  mode: LaunchMode.externalApplication,
                ),
                child: Text(
                  member.homePhone!,
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          if (member.address != null && member.address!.isNotEmpty)
            _ContactRow(
              icon: Icons.home_outlined,
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  Clipboard.setData(ClipboardData(text: member.address!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'Adresse copiée',
                        style: GoogleFonts.poppins(),
                      ),
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
                child: Text(
                  member.address!,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: theme.colorScheme.primary,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ),
          const SizedBox(height: 12),
          _ContactActionRow(member: member),
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
        style: GoogleFonts.poppins(
          color: theme.colorScheme.onPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _ContactRow extends StatelessWidget {
  final IconData icon;
  final Widget child;

  const _ContactRow({required this.icon, required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(child: child),
        ],
      ),
    );
  }
}

class _ContactActionRow extends StatelessWidget {
  final Member member;

  const _ContactActionRow({required this.member});

  @override
  Widget build(BuildContext context) {
    final hasPhone =
        (member.mobilePhone != null && member.mobilePhone!.isNotEmpty) ||
        (member.homePhone != null && member.homePhone!.isNotEmpty);
    final hasEmail = member.email.isNotEmpty;
    final hasAddress = member.address != null && member.address!.isNotEmpty;

    if (!hasPhone && !hasEmail && !hasAddress) return const SizedBox.shrink();

    return Row(
      children: [
        if (hasPhone)
          _ActionChip(
            icon: Icons.phone_outlined,
            tooltip: 'Appeler',
            onTap: () {
              HapticFeedback.lightImpact();
              final tel = member.mobilePhone ?? member.homePhone ?? '';
              launchUrl(
                Uri.parse('tel:${tel.replaceAll(' ', '')}'),
                mode: LaunchMode.externalApplication,
              );
            },
          ),
        if (hasPhone && (hasEmail || hasAddress)) const SizedBox(width: 8),
        if (hasEmail)
          _ActionChip(
            icon: Icons.email_outlined,
            tooltip: 'Envoyer un email',
            onTap: () {
              HapticFeedback.lightImpact();
              launchUrl(
                Uri.parse('mailto:${member.email}'),
                mode: LaunchMode.externalApplication,
              );
            },
          ),
        if (hasEmail && hasAddress) const SizedBox(width: 8),
        if (hasAddress)
          _ActionChip(
            icon: Icons.copy_outlined,
            tooltip: 'Copier l\'adresse',
            onTap: () {
              HapticFeedback.lightImpact();
              Clipboard.setData(ClipboardData(text: member.address!));
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Adresse copiée', style: GoogleFonts.poppins()),
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 2),
                ),
              );
            },
          ),
      ],
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: theme.colorScheme.primaryContainer.withValues(alpha: 0.6),
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Icon(icon, size: 20, color: theme.colorScheme.primary),
        ),
      ),
    );
  }
}
