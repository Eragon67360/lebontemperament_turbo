import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/fade_in_up.dart';

import '../../../../data/models/notification_settings.dart';
import '../../../../data/providers/realtime_notifications_provider.dart';
import '../providers/notification_settings_provider.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends ConsumerState<NotificationSettingsScreen> {
  // --- Logic Refactoring ---
  // We move the complex async logic out of the build method for cleanliness.
  Future<void> _handleRealtimeToggle(bool enable) async {
    if (enable) {
      // Ensure subscription is active (idempotent), then enable push notifications
      final notifier = ref.read(
        realtimeNotificationsControllerProvider.notifier,
      );
      await notifier.startListening();
      await ref
          .read(notificationSettingsProvider.notifier)
          .setRealtimeEnabled(true);
    } else {
      // Disable push notifications only - keep subscription for list updates
      await ref
          .read(notificationSettingsProvider.notifier)
          .setRealtimeEnabled(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(notificationSettingsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            backgroundColor: theme.colorScheme.surface,
            surfaceTintColor: theme.colorScheme.surface,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text(
              'Notifications',
              style: GoogleFonts.poppins(
                color: theme.colorScheme.onSurface,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(
              20,
              20,
              20,
              kFloatingNavBarBottomPadding,
            ),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // --- 1. Master Switch ---
                FadeInUp(
                  delay: 100,
                  child: _MainToggleCard(
                    isEnabled: settings.enabled,
                    onChanged: (_) => ref
                        .read(notificationSettingsProvider.notifier)
                        .toggleEnabled(),
                  ),
                ),

                // --- 2. Animated Section for detailed settings ---
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 300),
                  opacity: settings.enabled ? 1.0 : 0.0,
                  child: IgnorePointer(
                    ignoring: !settings.enabled,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 32),
                        const FadeInUp(
                          delay: 200,
                          child: _SectionTitle(
                            title: 'Notifications Instantanées',
                          ),
                        ),
                        const SizedBox(height: 12),
                        FadeInUp(
                          delay: 300,
                          child: _SettingsGroup(
                            children: [
                              _SettingsSwitchTile(
                                icon: Icons.sync_rounded,
                                title: 'Temps Réel',
                                subtitle:
                                    'Être notifié dès qu\'un événement est ajouté',
                                value: settings.realtimeEnabled,
                                onChanged: _handleRealtimeToggle,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                        const FadeInUp(
                          delay: 400,
                          child: _SectionTitle(title: 'Rappels Programmés'),
                        ),
                        const SizedBox(height: 12),
                        FadeInUp(
                          delay: 500,
                          child: _SettingsGroup(
                            children: [
                              _SettingsSwitchTile(
                                icon: Icons.music_note_outlined,
                                title: 'Concerts',
                                subtitle:
                                    'Recevoir des rappels pour les concerts',
                                value: settings.concertsEnabled,
                                onChanged: (_) => ref
                                    .read(notificationSettingsProvider.notifier)
                                    .toggleConcertsEnabled(),
                              ),
                              _SettingsSwitchTile(
                                icon: Icons.repeat_rounded,
                                title: 'Répétitions',
                                subtitle:
                                    'Recevoir des rappels pour les répétitions',
                                value: settings.rehearsalsEnabled,
                                onChanged: (_) => ref
                                    .read(notificationSettingsProvider.notifier)
                                    .toggleRehearsalsEnabled(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        FadeInUp(
                          delay: 600,
                          child: _SettingsGroup(
                            children: [
                              for (final time in NotificationTime.values)
                                _SettingsCheckboxTile(
                                  title: time.displayName,
                                  value: ref
                                      .watch(
                                        notificationSettingsProvider.notifier,
                                      )
                                      .isTimeSelected(time),
                                  onChanged: (_) => ref
                                      .read(
                                        notificationSettingsProvider.notifier,
                                      )
                                      .toggleNotificationTime(time),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// MARK: - UI Components

class _MainToggleCard extends StatelessWidget {
  final bool isEnabled;
  final ValueChanged<bool> onChanged;

  const _MainToggleCard({required this.isEnabled, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Activer les notifications',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isEnabled
                      ? 'Vous recevrez des rappels'
                      : 'Vous ne recevrez aucun rappel',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Switch(
            value: isEnabled,
            onChanged: onChanged,
            activeColor: theme.colorScheme.primary,
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  final List<Widget> children;
  const _SettingsGroup({required this.children});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        children: List.generate(children.length * 2 - 1, (index) {
          if (index.isEven) {
            return children[index ~/ 2];
          }
          return Divider(
            height: 1,
            thickness: 1,
            indent: 20,
            endIndent: 20,
            color: theme.colorScheme.outline.withValues(alpha: 0.2),
          );
        }),
      ),
    );
  }
}

class _SettingsSwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SettingsSwitchTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: theme.colorScheme.primary, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: theme.colorScheme.primary,
          ),
        ],
      ),
    );
  }
}

class _SettingsCheckboxTile extends StatelessWidget {
  final String title;
  final bool value;
  final ValueChanged<bool?> onChanged;

  const _SettingsCheckboxTile({
    required this.title,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 15,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Checkbox(
              value: value,
              onChanged: onChanged,
              activeColor: theme.colorScheme.primary,
            ),
          ],
        ),
      ),
    );
  }
}
