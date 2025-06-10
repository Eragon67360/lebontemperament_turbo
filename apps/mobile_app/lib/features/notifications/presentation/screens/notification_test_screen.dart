import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

import '../../../../data/services/notification_service.dart';
import '../../../../data/providers/data_providers.dart';
import '../../../../data/models/notification_settings.dart';
import '../providers/notification_settings_provider.dart';
import '../providers/notification_scheduler_provider.dart';

class NotificationTestScreen extends ConsumerStatefulWidget {
  const NotificationTestScreen({super.key});

  @override
  ConsumerState<NotificationTestScreen> createState() =>
      _NotificationTestScreenState();
}

class _NotificationTestScreenState
    extends ConsumerState<NotificationTestScreen> {
  final Logger _logger = Logger();
  final NotificationService _notificationService = NotificationService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Test des Notifications'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Test des Permissions',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text('Vérifiez que les notifications fonctionnent'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _testImmediateNotification,
                      child: const Text('Notification Immédiate'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Test des Notifications Programmées',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text('Programme une notification pour 10 secondes'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _testImmediateNotification,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Test Immediate Notification'),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _testScheduledNotification,
                      child: const Text('Test Scheduled Notification (10s)'),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _testScheduledNotificationTimer,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Test Timer-Based Scheduled (10s)'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Test des Notifications d\'Événements',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Programme les notifications pour tous les événements',
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _testEventNotifications,
                      child: const Text('Programmer Notifications Événements'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Informations de Débogage',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Consumer(
                      builder: (context, ref, child) {
                        final settings = ref.watch(
                          notificationSettingsProvider,
                        );
                        final concertsAsync = ref.watch(
                          realtimeConcertsProvider,
                        );
                        final rehearsalsAsync = ref.watch(
                          realtimeRehearsalsProvider,
                        );

                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Notifications activées: ${settings.enabled}'),
                            Text(
                              'Concerts activés: ${settings.concertsEnabled}',
                            ),
                            Text(
                              'Répétitions activées: ${settings.rehearsalsEnabled}',
                            ),
                            Text(
                              'Horaires sélectionnés: ${settings.selectedTimes.map((t) => t.displayName).join(', ')}',
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Concerts chargés: ${concertsAsync.when(data: (data) => data.length, loading: () => 'Chargement...', error: (error, stack) => 'Erreur: $error')}',
                            ),
                            Text(
                              'Répétitions chargées: ${rehearsalsAsync.when(data: (data) => data.length, loading: () => 'Chargement...', error: (error, stack) => 'Erreur: $error')}',
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Debug des Formats de Date',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text('Affiche les formats de date pour déboguer'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _debugDateFormats,
                      child: const Text('Debug Formats de Date'),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Vérifier les Notifications Programmées',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text('Affiche les notifications en attente'),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _checkPendingNotifications,
                      child: const Text('Vérifier Notifications Programmées'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _testImmediateNotification() async {
    try {
      _logger.i('Testing immediate notification...');
      await _notificationService.showTestNotification();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Immediate notification sent!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      _logger.e('Error testing immediate notification: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _testScheduledNotification() async {
    try {
      _logger.i('Testing scheduled notification...');
      await _notificationService.showTestScheduledNotification();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notification programmée pour 10 secondes !'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      _logger.e('Error testing scheduled notification: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _testScheduledNotificationTimer() async {
    try {
      _logger.i('Testing scheduled notification timer...');
      await _notificationService.showTestScheduledNotificationTimer();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notification programmée pour 10 secondes !'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      _logger.e('Error testing scheduled notification timer: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _testEventNotifications() async {
    try {
      _logger.i('Testing event notifications...');

      // Trigger the notification scheduler
      await ref
          .read(notificationSchedulerProvider.notifier)
          .scheduleNotifications();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notifications d\'événements programmées !'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      _logger.e('Error testing event notifications: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _debugDateFormats() async {
    try {
      final concertsAsync = ref.read(realtimeConcertsProvider);
      final rehearsalsAsync = ref.read(realtimeRehearsalsProvider);

      String debugInfo = '=== DEBUG DATE FORMATS ===\n\n';

      // Debug concerts
      concertsAsync.whenData((concerts) {
        debugInfo += 'CONCERTS (${concerts.length}):\n';
        for (final concert in concerts.take(3)) {
          // Show first 3
          debugInfo +=
              '- ${concert.name}: date="${concert.date}", time="${concert.time}"\n';
          try {
            final parsedDate = DateTime.parse(concert.date);
            debugInfo += '  Parsed date: ${parsedDate.toIso8601String()}\n';
            debugInfo +=
                '  Current time: ${DateTime.now().toIso8601String()}\n';
            debugInfo +=
                '  Is in future: ${parsedDate.isAfter(DateTime.now())}\n';
          } catch (e) {
            debugInfo += '  Parse error: $e\n';
          }
          debugInfo += '\n';
        }
      });

      // Debug rehearsals
      rehearsalsAsync.whenData((rehearsals) {
        debugInfo += 'REHEARSALS (${rehearsals.length}):\n';
        for (final rehearsal in rehearsals.take(3)) {
          // Show first 3
          debugInfo +=
              '- ${rehearsal.name}: date="${rehearsal.date}", time="${rehearsal.startTime}"\n';
          if (rehearsal.date != null) {
            try {
              final parsedDate = DateTime.parse(rehearsal.date!);
              debugInfo += '  Parsed date: ${parsedDate.toIso8601String()}\n';
              debugInfo +=
                  '  Current time: ${DateTime.now().toIso8601String()}\n';
              debugInfo +=
                  '  Is in future: ${parsedDate.isAfter(DateTime.now())}\n';
            } catch (e) {
              debugInfo += '  Parse error: $e\n';
            }
          }
          debugInfo += '\n';
        }
      });

      _logger.i(debugInfo);

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Debug Info'),
            content: SingleChildScrollView(child: Text(debugInfo)),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Fermer'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      _logger.e('Error debugging date formats: $e');
    }
  }

  Future<void> _checkPendingNotifications() async {
    try {
      final notificationService = NotificationService();
      final pendingNotifications = await notificationService
          .getPendingNotifications();

      String debugInfo = '=== PENDING NOTIFICATIONS ===\n\n';
      debugInfo += 'Count: ${pendingNotifications.length}\n\n';

      if (pendingNotifications.isEmpty) {
        debugInfo += 'No pending notifications found.\n';
        debugInfo += 'This could mean:\n';
        debugInfo += '- Notifications were not scheduled properly\n';
        debugInfo += '- Notifications were already delivered\n';
        debugInfo += '- App was killed by the system\n';
        debugInfo +=
            '- Device battery optimization is blocking notifications\n';
      } else {
        for (final notification in pendingNotifications) {
          debugInfo += 'ID: ${notification.id}\n';
          debugInfo += 'Title: ${notification.title}\n';
          debugInfo += 'Body: ${notification.body}\n';
          debugInfo += 'Channel: ${notification.payload}\n\n';
        }
      }

      _logger.i(debugInfo);

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Pending Notifications'),
            content: SingleChildScrollView(child: Text(debugInfo)),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Fermer'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      _logger.e('Error checking pending notifications: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }
}
