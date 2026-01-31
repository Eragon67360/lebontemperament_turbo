import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/config/app_config.dart';
import '../../../../data/models/delivery.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../providers/driver_tracking_provider.dart';

class DriverTrackingScreen extends ConsumerStatefulWidget {
  const DriverTrackingScreen({super.key});

  @override
  ConsumerState<DriverTrackingScreen> createState() =>
      _DriverTrackingScreenState();
}

class _DriverTrackingScreenState extends ConsumerState<DriverTrackingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(driverTrackingProvider.notifier).loadDelivery();
    });
  }

  @override
  void dispose() {
    final notifier = ref.read(driverTrackingProvider.notifier);
    if (ref.read(driverTrackingProvider).isTracking) {
      notifier.stopTracking();
    }
    super.dispose();
  }

  String _trackingUrl(Delivery? delivery) {
    if (delivery == null) return '';
    final base = AppConfig.siteUrl.replaceAll(RegExp(r'/$'), '');
    return '$base/track/${delivery.id}?token=${delivery.publicToken}';
  }

  Future<void> _openMaps(double lat, double lng) async {
    final uri = Uri.parse(
      'https://www.google.com/maps?q=$lat,$lng',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _confirmResetToken() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Réinitialiser le token'),
        content: const Text(
          'L\'ancien lien ne fonctionnera plus. Les clients devront utiliser la nouvelle URL. Continuer ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
    if (ok == true && mounted) {
      await ref.read(driverTrackingProvider.notifier).resetToken();
    }
  }

  @override
  Widget build(BuildContext context) {
    final trackingState = ref.watch(driverTrackingProvider);
    final isSuperadminAsync = ref.watch(isSuperadminProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: Text(
          'Suivi livraison',
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface),
        ),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          onPressed: () => context.pop(),
        ),
      ),
      body: isSuperadminAsync.when(
        data: (isSuperadmin) {
          if (!isSuperadmin) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Vous n\'êtes pas autorisé à utiliser cette fonction.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
              ),
            );
          }
          return _buildContent(context, trackingState);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: Text(
            'Erreur de chargement du profil.',
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    DriverTrackingState state,
  ) {
    if (state.isLoading && state.delivery == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final delivery = state.delivery;
    final hasError = state.error != null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasError) ...[
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(
                      Icons.error_outline,
                      color: Theme.of(context).colorScheme.onErrorContainer,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        state.error!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.onErrorContainer,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (state.error!.contains('Permission'))
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: FilledButton.icon(
                  onPressed: () => openAppSettings(),
                  icon: const Icon(Icons.settings, size: 20),
                  label: const Text('Ouvrir les paramètres'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            const SizedBox(height: 24),
          ],

          // Status hero
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: state.isTracking
                              ? Colors.green
                              : Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant
                                  .withValues(alpha: 0.5),
                          boxShadow: state.isTracking
                              ? [
                                  BoxShadow(
                                    color: Colors.green.withValues(alpha: 0.5),
                                    blurRadius: 8,
                                    spreadRadius: 2,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        state.isTracking ? 'Suivi actif' : 'Suivi arrêté',
                        style:
                            Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: Theme.of(context).colorScheme.onSurface,
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    state.isTracking
                        ? 'Votre position est partagée en temps réel'
                        : 'Démarrez pour partager votre position',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Main actions
          FilledButton.icon(
            onPressed: state.isTracking
                ? null
                : () => ref.read(driverTrackingProvider.notifier).startTracking(),
            icon: const Icon(Icons.play_arrow, size: 24),
            label: const Text('Démarrer le suivi'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 18),
              minimumSize: const Size.fromHeight(56),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: !state.isTracking
                ? null
                : () => ref.read(driverTrackingProvider.notifier).stopTracking(),
            icon: const Icon(Icons.stop, size: 24),
            label: const Text('Arrêter le suivi'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
              padding: const EdgeInsets.symmetric(vertical: 18),
              minimumSize: const Size.fromHeight(56),
            ),
          ),

          // Last position
          if (state.isTracking && state.position != null) ...[
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          color: Theme.of(context).colorScheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Dernière position',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: Theme.of(context).colorScheme.onSurface,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${state.position!.lat.toStringAsFixed(6)}, ${state.position!.lng.toStringAsFixed(6)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                            fontFamily: 'monospace',
                          ),
                    ),
                    const SizedBox(height: 12),
                    TextButton.icon(
                      onPressed: () => _openMaps(
                        state.position!.lat,
                        state.position!.lng,
                      ),
                      icon: const Icon(Icons.map, size: 18),
                      label: const Text('Ouvrir dans Maps'),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Share block
          if (delivery != null) ...[
            const SizedBox(height: 24),
            Text(
              'Partager avec le client',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SelectableText(
                      _trackingUrl(delivery),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                            fontFamily: 'monospace',
                          ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Clipboard.setData(
                                ClipboardData(text: _trackingUrl(delivery)),
                              );
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Lien copié'),
                                  duration: Duration(seconds: 2),
                                ),
                              );
                            },
                            icon: const Icon(Icons.copy, size: 18),
                            label: const Text('Copier'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: FilledButton.icon(
                            onPressed: () {
                              Share.share(
                                _trackingUrl(delivery),
                                subject: 'Suivi de livraison',
                              );
                            },
                            icon: const Icon(Icons.share, size: 18),
                            label: const Text('Partager'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Expire le ${DateFormat('dd/MM/yyyy à HH:mm', 'fr_FR').format(delivery.expiresAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: _confirmResetToken,
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Réinitialiser le token'),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}
