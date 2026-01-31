import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/config/app_config.dart';
import '../../../../data/models/delivery.dart';
import '../../../auth/presentation/providers/profile_role_provider.dart';
import '../providers/driver_tracking_provider.dart';

class DriverTrackingScreen extends ConsumerWidget {
  const DriverTrackingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isSuperadminAsync = ref.watch(isSuperadminProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      body: isSuperadminAsync.when(
        data: (isSuperadmin) {
          if (!isSuperadmin) return const _UnauthorizedState();
          return const _TrackingContent();
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Erreur: $err')),
      ),
    );
  }
}

// MARK: - Main Content Widget

class _TrackingContent extends ConsumerStatefulWidget {
  const _TrackingContent();

  @override
  ConsumerState<_TrackingContent> createState() => _TrackingContentState();
}

class _TrackingContentState extends ConsumerState<_TrackingContent> {
  @override
  void initState() {
    super.initState();
    initializeDateFormatting('fr_FR');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(driverTrackingProvider.notifier).loadDelivery();
    });
  }

  @override
  void dispose() {
    // Check if the provider is still active before reading
    if (mounted && ref.read(driverTrackingProvider).isTracking) {
      ref.read(driverTrackingProvider.notifier).stopTracking();
    }
    super.dispose();
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
    final state = ref.watch(driverTrackingProvider);
    final theme = Theme.of(context);

    if (state.isLoading && state.delivery == null) {
      return const Center(child: CircularProgressIndicator());
    }

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: theme.colorScheme.surface,
          surfaceTintColor: theme.colorScheme.surface,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: () => context.pop(),
          ),
          title: Text(
            'Suivi livraison',
            style: GoogleFonts.poppins(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        SliverList(
          delegate: SliverChildListDelegate([
            const SizedBox(height: 20),
            FadeInUp(delay: 100, child: _TrackingStatusHero(state: state)),
            const SizedBox(height: 32),
            FadeInUp(delay: 200, child: _ActionButtons(state: state)),
            if (state.delivery != null)
              FadeInUp(
                delay: 300,
                child: _SessionDetailsCard(
                  state: state,
                  onResetToken: _confirmResetToken,
                ),
              ),
            const SizedBox(height: 80),
          ]),
        ),
      ],
    );
  }
}

// MARK: - UI Components

class _TrackingStatusHero extends StatelessWidget {
  final DriverTrackingState state;
  const _TrackingStatusHero({required this.state});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: state.isTracking
                ? [Colors.green.shade400, Colors.green.shade600]
                : [
                    theme.colorScheme.surfaceVariant,
                    theme.colorScheme.surfaceVariant.withOpacity(0.5),
                  ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: state.isTracking
                  ? Colors.green.withOpacity(0.3)
                  : Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          children: [
            if (state.error != null) ...[
              _ErrorBanner(error: state.error!),
              const SizedBox(height: 16),
            ],
            _StatusIndicator(isActive: state.isTracking),
            const SizedBox(height: 12),
            Text(
              state.isTracking ? 'Suivi Actif' : 'Suivi Arrêté',
              style: GoogleFonts.poppins(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: state.isTracking
                    ? Colors.white
                    : theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              state.isTracking
                  ? 'Votre position est partagée en temps réel.'
                  : 'Démarrez le suivi pour partager votre position.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color:
                    (state.isTracking
                            ? Colors.white
                            : theme.colorScheme.onSurfaceVariant)
                        .withOpacity(0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionButtons extends ConsumerWidget {
  final DriverTrackingState state;
  const _ActionButtons({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilledButton.icon(
            onPressed: state.isTracking
                ? null
                : () =>
                      ref.read(driverTrackingProvider.notifier).startTracking(),
            icon: const Icon(Icons.play_arrow_rounded, size: 28),
            label: const Text('Démarrer le suivi'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: !state.isTracking
                ? null
                : () =>
                      ref.read(driverTrackingProvider.notifier).stopTracking(),
            icon: const Icon(Icons.stop_rounded, size: 28),
            label: const Text('Arrêter le suivi'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
              side: BorderSide(
                color: !state.isTracking
                    ? Colors.grey.withOpacity(0.4)
                    : Theme.of(context).colorScheme.error,
              ),
              padding: const EdgeInsets.symmetric(vertical: 16),
              textStyle: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionDetailsCard extends StatelessWidget {
  final DriverTrackingState state;
  final VoidCallback onResetToken;

  const _SessionDetailsCard({required this.state, required this.onResetToken});

  String _trackingUrl(Delivery delivery) {
    final base = AppConfig.siteUrl.replaceAll(RegExp(r'/$'), '');
    return '$base/track/${delivery.id}?token=${delivery.publicToken}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final delivery = state.delivery!;
    final url = _trackingUrl(delivery);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Détails du suivi en cours',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: theme.colorScheme.outline.withOpacity(0.2),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Lien de partage client',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                SelectableText(
                  url,
                  style: GoogleFonts.firaCode(
                    fontSize: 12,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: url));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Lien copié')),
                          );
                        },
                        child: const Text('Copier'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => Share.share(url),
                        child: const Text('Partager'),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 32),
                Text(
                  'Expire le ${DateFormat('dd/MM/yyyy à HH:mm', 'fr_FR').format(delivery.expiresAt)}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: TextButton(
                    onPressed: onResetToken,
                    child: const Text('Réinitialiser le token de partage'),
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

// MARK: - Helper & State Widgets

class _StatusIndicator extends StatefulWidget {
  final bool isActive;
  const _StatusIndicator({required this.isActive});
  @override
  State<_StatusIndicator> createState() => _StatusIndicatorState();
}

class _StatusIndicatorState extends State<_StatusIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final inactiveColor = theme.colorScheme.onSurfaceVariant.withOpacity(0.5);
    return SizedBox(
      width: 20,
      height: 20,
      child: widget.isActive
          ? FadeTransition(
              opacity: Tween<double>(begin: 0.5, end: 1.0).animate(_controller),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.white.withOpacity(0.8),
                      blurRadius: 8,
                      spreadRadius: 4,
                    ),
                  ],
                ),
              ),
            )
          : Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: inactiveColor,
              ),
            ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String error;
  const _ErrorBanner({required this.error});
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                error,
                style: GoogleFonts.poppins(color: Colors.white),
              ),
            ),
          ],
        ),
        if (error.toLowerCase().contains('permission')) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: () => openAppSettings(),
              icon: const Icon(Icons.settings, size: 16),
              label: const Text('Ouvrir les paramètres'),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.green.shade800,
                visualDensity: VisualDensity.compact,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _UnauthorizedState extends StatelessWidget {
  const _UnauthorizedState();
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline_rounded,
              size: 72,
              color: theme.colorScheme.onSurfaceVariant.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            Text(
              'Accès non autorisé',
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cette fonctionnalité est réservée aux administrateurs de l\'application.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Retour'),
            ),
          ],
        ),
      ),
    );
  }
}

class FadeInUp extends StatefulWidget {
  final Widget child;
  final int delay;
  const FadeInUp({super.key, required this.child, this.delay = 0});
  @override
  State<FadeInUp> createState() => _FadeInUpState();
}

class _FadeInUpState extends State<FadeInUp>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _opacity;
  late Animation<double> _translateY;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _opacity = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _translateY = Tween<double>(
      begin: 30.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Opacity(
          opacity: _opacity.value,
          child: Transform.translate(
            offset: Offset(0, _translateY.value),
            child: widget.child,
          ),
        );
      },
    );
  }
}
