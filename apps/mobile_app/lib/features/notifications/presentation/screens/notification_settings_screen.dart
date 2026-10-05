import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/fade_in_up.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../../data/models/notification_settings.dart';
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

  /// Turning reminders on is the one place, besides the first-launch screen,
  /// that asks the system for the notification permission. Once the system
  /// has stopped asking, the only way forward is its settings page.
  Future<void> _handleMasterToggle(bool enable) async {
    final settings = ref.read(notificationSettingsProvider.notifier);
    if (!enable) {
      await settings.setEnabled(false);
      return;
    }

    final service = ref.read(notificationServiceProvider);
    var granted = await service.hasPermissions();
    if (!granted) {
      granted = await service.requestPermissions();
    }
    if (!mounted) return;

    if (granted) {
      await settings.setEnabled(true);
      return;
    }

    final permanentlyDenied = await service.isPermissionPermanentlyDenied();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text(
          'Les notifications sont bloquées pour l\'application. '
          'Autorisez-les dans les réglages du téléphone.',
        ),
        duration: const Duration(seconds: 6),
        action: permanentlyDenied
            ? SnackBarAction(
                label: 'Réglages',
                onPressed: () => openAppSettings(),
              )
            : null,
      ),
    );
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
              tooltip: 'Retour',
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Text(
              'Notifications',
              style: AppFonts.sans(
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
                    onChanged: _handleMasterToggle,
                  ),
                ),

                // --- 2. Animated Section for detailed settings ---
                // (The server pushes for new events are not a setting: they
                // follow the system permission alone.)
                AnimatedOpacity(
                  duration: const Duration(milliseconds: 300),
                  opacity: settings.enabled ? 1.0 : 0.0,
                  child: IgnorePointer(
                    ignoring: !settings.enabled,
                    child: ExcludeSemantics(
                      excluding: !settings.enabled,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 32),
                          const FadeInUp(
                            delay: 200,
                            child: _SectionTitle(title: 'Rappels programmés'),
                          ),
                          const SizedBox(height: 12),
                          FadeInUp(
                            delay: 300,
                            child: _SettingsGroup(
                              children: [
                                _SettingsSwitchTile(
                                  icon: Icons.music_note_outlined,
                                  title: 'Concerts',
                                  subtitle:
                                      'Recevoir des rappels pour les concerts',
                                  value: settings.concertsEnabled,
                                  onChanged: (_) => ref
                                      .read(
                                        notificationSettingsProvider.notifier,
                                      )
                                      .toggleConcertsEnabled(),
                                ),
                                _SettingsSwitchTile(
                                  icon: Icons.repeat_rounded,
                                  title: 'Répétitions',
                                  subtitle:
                                      'Recevoir des rappels pour les répétitions',
                                  value: settings.rehearsalsEnabled,
                                  onChanged: (_) => ref
                                      .read(
                                        notificationSettingsProvider.notifier,
                                      )
                                      .toggleRehearsalsEnabled(),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 32),
                          const FadeInUp(
                            delay: 400,
                            child: _SectionTitle(title: 'Moments des rappels'),
                          ),
                          const SizedBox(height: 12),
                          FadeInUp(
                            delay: 500,
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
    // MergeSemantics: the switch is read with its title, and the whole card
    // toggles it (a 48 dp thumb is small for older fingers).
    return MergeSemantics(
      child: Material(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: theme.colorScheme.outline.withValues(alpha: 0.2),
          ),
        ),
        child: InkWell(
          onTap: () => onChanged(!isEnabled),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Activer les notifications',
                        style: AppFonts.sans(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: theme.colorScheme.onSurface,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isEnabled
                            ? 'Vous recevrez des rappels avant vos concerts et répétitions'
                            : 'Vous ne recevrez aucun rappel',
                        style: AppFonts.sans(
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
                  activeThumbColor: theme.colorScheme.primary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      header: true,
      child: Text(
        title,
        style: AppFonts.sans(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
        ),
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
    return Material(
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: theme.colorScheme.outline.withValues(alpha: 0.2),
        ),
      ),
      clipBehavior: Clip.antiAlias,
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
    return MergeSemantics(
      child: InkWell(
        onTap: () => onChanged(!value),
        child: Padding(
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
                      style: AppFonts.sans(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppFonts.sans(
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
                activeThumbColor: theme.colorScheme.primary,
              ),
            ],
          ),
        ),
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
    return MergeSemantics(
      child: InkWell(
        onTap: () => onChanged(!value),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppFonts.sans(
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
      ),
    );
  }
}
