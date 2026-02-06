import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/core/widgets/custom_toast.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/services/notification_service.dart';
import 'package:lebontemperament/features/notifications/presentation/providers/notification_settings_provider.dart';

class DeveloperModeScreen extends ConsumerWidget {
  const DeveloperModeScreen({super.key});

  static const _fakeRehearsal = Rehearsal(
    id: 'dev_test_rehearsal',
    name: 'Répétition test',
    place: 'Salle de répétition',
    date: '2025-02-10',
    startTime: '19:00',
    groupType: GroupType.tous,
  );

  static const _fakeConcert = Concert(
    id: 'dev_test_concert',
    name: 'Concert test',
    place: 'Église',
    date: '2025-02-15',
    time: '20:00',
    context: Context.choeur,
  );

  Future<void> _runTest(
    BuildContext context,
    Future<void> Function() test,
    String successMessage,
    String errorMessage,
  ) async {
    try {
      await test();
      if (context.mounted) {
        CustomToast.showSuccess(context, successMessage);
      }
    } catch (e) {
      if (context.mounted) {
        CustomToast.showError(context, errorMessage);
      }
    }
  }

  /// Simulates a Realtime event: waits 2 seconds then shows notification.
  /// Tests whether the issue is timing/isolate vs Realtime-specific.
  Future<void> _runSimulateRealtimeTest(
    BuildContext context,
    NotificationService notificationService,
  ) async {
    if (context.mounted) {
      CustomToast.showSuccess(context, 'Simulation dans 2 secondes...');
    }
    await Future.delayed(const Duration(seconds: 2));
    if (!context.mounted) return;
    try {
      await notificationService.showRehearsalAddedNotification(_fakeRehearsal);
      if (context.mounted) {
        CustomToast.showSuccess(context, 'Notification envoyée (après délai)');
      }
    } catch (e) {
      if (context.mounted) {
        CustomToast.showError(context, 'Erreur: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final notificationService = ref.read(notificationServiceProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        backgroundColor: theme.colorScheme.surface,
        surfaceTintColor: theme.colorScheme.surface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Mode développeur',
          style: GoogleFonts.poppins(
            color: theme.colorScheme.onSurface,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 80),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                const _SectionTitle(title: 'Notifications'),
                const SizedBox(height: 12),
                _SettingsGroup(
                  children: [
                    _DevActionTile(
                      icon: Icons.repeat_rounded,
                      title: 'Rappel répétition (immédiat)',
                      subtitle: 'Répétition à venir - format rappel',
                      onTap: (context) => _runTest(
                        context,
                        notificationService
                            .showTestRehearsalReminderNotification,
                        'Notification envoyée',
                        'Erreur lors de l\'envoi',
                      ),
                    ),
                    _DevActionTile(
                      icon: Icons.music_note_outlined,
                      title: 'Rappel concert (immédiat)',
                      subtitle: 'Concert à venir - format rappel',
                      onTap: (context) => _runTest(
                        context,
                        notificationService.showTestConcertReminderNotification,
                        'Notification envoyée',
                        'Erreur lors de l\'envoi',
                      ),
                    ),
                    _DevActionTile(
                      icon: Icons.add_alert_outlined,
                      title: 'Nouvelle répétition ajoutée',
                      subtitle: 'Notification temps réel',
                      onTap: (context) => _runTest(
                        context,
                        () => notificationService
                            .showRehearsalAddedNotification(_fakeRehearsal),
                        'Notification envoyée',
                        'Erreur lors de l\'envoi',
                      ),
                    ),
                    _DevActionTile(
                      icon: Icons.schedule_send_outlined,
                      title: 'Simuler Realtime (2 sec)',
                      subtitle:
                          'Délai 2s puis notification - teste timing/isolate',
                      onTap: (context) => _runSimulateRealtimeTest(
                        context,
                        notificationService,
                      ),
                    ),
                    _DevActionTile(
                      icon: Icons.add_alert_outlined,
                      title: 'Nouveau concert ajouté',
                      subtitle: 'Notification temps réel',
                      onTap: (context) => _runTest(
                        context,
                        () => notificationService.showConcertAddedNotification(
                          _fakeConcert,
                        ),
                        'Notification envoyée',
                        'Erreur lors de l\'envoi',
                      ),
                    ),
                    _DevActionTile(
                      icon: Icons.schedule_outlined,
                      title: 'Notification programmée (10 sec)',
                      subtitle: 'Test du scheduling',
                      onTap: (context) => _runTest(
                        context,
                        notificationService.showTestScheduledNotification,
                        'Notification programmée dans 10 secondes',
                        'Erreur lors de la programmation',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: kFloatingNavBarBottomPadding),
              ]),
            ),
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
            indent: 60,
            endIndent: 20,
            color: theme.colorScheme.outline.withValues(alpha: 0.2),
          );
        }),
      ),
    );
  }
}

class _DevActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final void Function(BuildContext context) onTap;

  const _DevActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap(context);
      },
      borderRadius: BorderRadius.circular(16),
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
            Icon(
              Icons.arrow_forward_ios_rounded,
              size: 16,
              color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.7),
            ),
          ],
        ),
      ),
    );
  }
}
