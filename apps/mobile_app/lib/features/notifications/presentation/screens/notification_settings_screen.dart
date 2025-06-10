import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/notification_settings.dart';
import '../../../../data/providers/realtime_notifications_provider.dart';
import '../providers/notification_settings_provider.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(notificationSettingsProvider);
    final isRealtimeEnabled = ref.watch(realtimeNotificationsProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: Text(
          'Notifications',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
        ),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Main toggle
          Card(
            child: SwitchListTile(
              title: Text(
                'Activer les notifications',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(
                'Recevoir des rappels pour vos événements',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              value: settings.enabled,
              onChanged: (value) {
                ref.read(notificationSettingsProvider.notifier).toggleEnabled();
              },
              activeColor: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(height: 16),

          // Real-time notifications toggle
          if (settings.enabled) ...[
            Card(
              child: SwitchListTile(
                title: Row(
                  children: [
                    Icon(
                      Icons.sync,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Notifications en temps réel',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                subtitle: Text(
                  'Recevoir des notifications immédiates quand de nouvelles répétitions sont ajoutées',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
                value: isRealtimeEnabled,
                onChanged: (value) async {
                  if (value) {
                    // Show loading indicator
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) =>
                          const Center(child: CircularProgressIndicator()),
                    );

                    // Try to start listening
                    final success = await ref
                        .read(realtimeNotificationsProvider.notifier)
                        .startListening();

                    // Hide loading indicator
                    if (context.mounted) {
                      Navigator.of(context).pop();
                    }

                    if (!success && context.mounted) {
                      // Show error message with guidance
                      showDialog(
                        context: context,
                        builder: (context) => AlertDialog(
                          title: const Text('Permissions requises'),
                          content: const Text(
                            'Pour activer les notifications en temps réel, vous devez autoriser les notifications dans les paramètres de votre appareil.',
                          ),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.of(context).pop(),
                              child: const Text('Annuler'),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                // You could add navigation to app settings here
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text(
                                      'Allez dans Paramètres > Notifications > Le Bon Tempérament pour autoriser les notifications',
                                    ),
                                    backgroundColor: Theme.of(
                                      context,
                                    ).colorScheme.primary,
                                  ),
                                );
                              },
                              child: const Text('Paramètres'),
                            ),
                          ],
                        ),
                      );
                    }
                  } else {
                    ref
                        .read(realtimeNotificationsProvider.notifier)
                        .stopListening();
                  }
                },
                activeColor: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Event type toggles
          if (settings.enabled) ...[
            Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Types d\'événements',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  SwitchListTile(
                    title: Row(
                      children: [
                        Icon(
                          Icons.music_note,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Concerts',
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                        ),
                      ],
                    ),
                    value: settings.concertsEnabled,
                    onChanged: (value) {
                      ref
                          .read(notificationSettingsProvider.notifier)
                          .toggleConcertsEnabled();
                    },
                    activeColor: Theme.of(context).colorScheme.primary,
                  ),
                  SwitchListTile(
                    title: Row(
                      children: [
                        Icon(
                          Icons.repeat,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Répétitions',
                          style: Theme.of(context).textTheme.bodyLarge
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                              ),
                        ),
                      ],
                    ),
                    value: settings.rehearsalsEnabled,
                    onChanged: (value) {
                      ref
                          .read(notificationSettingsProvider.notifier)
                          .toggleRehearsalsEnabled();
                    },
                    activeColor: Theme.of(context).colorScheme.primary,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notification times
            Card(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Rappels',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'Choisissez quand vous voulez être notifié',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...NotificationTime.values.map(
                    (time) => CheckboxListTile(
                      title: Text(
                        time.displayName,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                        ),
                      ),
                      value: ref
                          .watch(notificationSettingsProvider.notifier)
                          .isTimeSelected(time),
                      onChanged: (value) {
                        ref
                            .read(notificationSettingsProvider.notifier)
                            .toggleNotificationTime(time);
                      },
                      activeColor: Theme.of(context).colorScheme.primary,
                      checkColor: Theme.of(context).colorScheme.onPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Info card
            Card(
              color: AppTheme.getSubtleBackgroundColor(context),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Theme.of(context).colorScheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Les notifications seront programmées automatiquement pour vos événements à venir.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
