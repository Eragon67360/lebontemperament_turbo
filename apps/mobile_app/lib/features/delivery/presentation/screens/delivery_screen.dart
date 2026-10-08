import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_router.dart';
import '../../../../core/constants/ui_constants.dart';
import '../../../../core/theme/app_fonts.dart';
import '../../../../core/widgets/stage.dart';
import '../../../public/presentation/widgets/public_widgets.dart';
import '../../data/delivery_pass.dart';
import '../../data/delivery_pass_service.dart';
import '../../data/delivery_tracking.dart';
import '../providers/delivery_providers.dart';

/// The route of a delivery pass.
String deliveryPath(String recipientId) => '/delivery/$recipientId';

/// The web map of a delivery (the page the SMS links to).
String deliveryTrackingUrl(DeliveryPass pass) =>
    '$kWebsiteBaseUrl/track?token=${Uri.encodeQueryComponent(pass.trackingToken)}';

/// How often the screen asks the server again while it is open.
const Duration kDeliveryRefreshEvery = Duration(seconds: 30);

/// « Votre livraison » (#593): where the delivery stands, the web map, the
/// notifications, and a way to forget the delivery. Refreshes every 30 s
/// while visible and on pull.
class DeliveryScreen extends ConsumerStatefulWidget {
  const DeliveryScreen({super.key, required this.recipientId});

  final String recipientId;

  @override
  ConsumerState<DeliveryScreen> createState() => _DeliveryScreenState();
}

class _DeliveryScreenState extends ConsumerState<DeliveryScreen>
    with WidgetsBindingObserver {
  DeliveryPass? _pass;
  bool _passLoaded = false;
  TrackingResult? _result;

  /// The last refresh failed; [_result] is older than it looks.
  bool _stale = false;
  bool? _notificationsOn;
  Timer? _timer;
  bool _inForeground = true;

  DeliveryPassService get _service => ref.read(deliveryServiceProvider);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _load();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final foreground = state == AppLifecycleState.resumed;
    if (foreground && !_inForeground) unawaited(_refresh());
    _inForeground = foreground;
  }

  Future<void> _load() async {
    final pass = await _service.store.find(widget.recipientId);
    if (!mounted) return;
    setState(() {
      _pass = pass;
      _passLoaded = true;
    });
    if (pass == null) return;
    await _refresh();
    _timer?.cancel();
    _timer = Timer.periodic(kDeliveryRefreshEvery, (_) {
      if (!mounted || !_inForeground) return;
      if (ModalRoute.of(context)?.isCurrent == false) return;
      unawaited(_refresh());
    });
  }

  Future<void> _refresh() async {
    final pass = _pass;
    if (pass == null) return;
    final results = await Future.wait([
      _service.tracking(pass),
      _service.notificationsAllowed(),
    ]);
    if (!mounted) return;
    final result = results[0] as TrackingResult;
    setState(() {
      _notificationsOn = results[1] as bool;
      if (result is TrackingUnavailable && _result is TrackingOk) {
        _stale = true;
      } else {
        _stale = false;
        _result = result;
      }
    });
    if (result is TrackingOver) {
      _timer?.cancel();
      ref.invalidate(deliveryPassesProvider);
    }
  }

  Future<void> _enableNotifications() async {
    final pass = _pass;
    if (pass == null) return;
    final allowed = await _service.enableNotifications(pass);
    if (!mounted) return;
    setState(() => _notificationsOn = allowed);
    if (!allowed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Les notifications sont désactivées pour l’application. '
            'Activez-les dans les réglages du téléphone.',
          ),
        ),
      );
    }
  }

  Future<void> _forget() async {
    final pass = _pass;
    if (pass == null) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Retirer cette livraison ?'),
        content: const Text(
          'Ce téléphone ne recevra plus de notification pour cette '
          'livraison. Le code du SMS permet de la retrouver.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Retirer'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    _timer?.cancel();
    await _service.forget(pass);
    if (!mounted) return;
    ref.invalidate(deliveryPassesProvider);
    _leave();
  }

  void _leave() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(AppRouter.publicHome);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Votre livraison'),
        leading: context.canPop()
            ? null
            : IconButton(
                icon: const Icon(Icons.home_outlined),
                tooltip: 'Accueil',
                onPressed: () => context.go(AppRouter.publicHome),
              ),
      ),
      body: SafeArea(child: _body(scheme)),
    );
  }

  Widget _body(ColorScheme scheme) {
    if (!_passLoaded) return _Spinner();
    final pass = _pass;
    if (pass == null) return _Missing(onCode: _openCodeScreen);
    final result = _result;
    if (result == null) return _Spinner();
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        padding: const EdgeInsets.fromLTRB(
          kScreenHorizontalPadding,
          16,
          kScreenHorizontalPadding,
          32,
        ),
        children: switch (result) {
          TrackingOver() => [_Over(label: pass.label)],
          TrackingUnavailable() => [
            _Greeting(label: pass.label),
            const SizedBox(height: 20),
            _Note(
              icon: Icons.cloud_off_outlined,
              text:
                  'Impossible de charger votre livraison. Vérifiez votre '
                  'connexion.',
              action: TextButton(
                onPressed: _refresh,
                child: const Text('Réessayer'),
              ),
            ),
            const SizedBox(height: 28),
            _forgetButton(scheme),
          ],
          TrackingOk(tracking: final tracking) => [
            _Greeting(label: pass.label),
            const SizedBox(height: 20),
            _StatusCard(tracking: tracking),
            if (_stale) ...[
              const SizedBox(height: 12),
              const _Note(
                icon: Icons.cloud_off_outlined,
                text: 'Impossible d’actualiser. Vérifiez votre connexion.',
              ),
            ],
            if (tracking.problemMessage != null) ...[
              const SizedBox(height: 12),
              _Note(
                icon: Icons.info_outline_rounded,
                text: tracking.problemMessage!,
              ),
            ],
            const SizedBox(height: 20),
            if (tracking.stage != DeliveryStage.delivered) ...[
              FilledButton.icon(
                onPressed: () =>
                    openExternal(context, deliveryTrackingUrl(pass)),
                icon: const Icon(Icons.map_outlined),
                label: const Text('Suivre sur la carte'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(52),
                ),
              ),
              const SizedBox(height: 24),
              _Notifications(
                enabled: _notificationsOn,
                onEnable: _enableNotifications,
              ),
              const SizedBox(height: 28),
            ],
            _forgetButton(scheme),
          ],
        },
      ),
    );
  }

  Widget _forgetButton(ColorScheme scheme) => Center(
    child: TextButton.icon(
      onPressed: _forget,
      icon: const Icon(Icons.delete_outline_rounded, size: 18),
      label: const Text('Retirer cette livraison'),
      style: TextButton.styleFrom(foregroundColor: scheme.error),
    ),
  );

  void _openCodeScreen() => context.pushReplacement(AppRouter.deliveryCode);
}

class _Spinner extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Center(
    child: CircularProgressIndicator(
      color: Theme.of(context).colorScheme.primary,
    ),
  );
}

class _Greeting extends StatelessWidget {
  const _Greeting({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      header: true,
      child: Text(
        label.isEmpty ? 'Bonjour' : 'Bonjour $label',
        style: AppFonts.display(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: scheme.onSurface,
          height: 1.15,
        ),
      ),
    );
  }
}

/// The headline and the sentence under it for a [DeliveryStage].
({IconData icon, String title, String detail}) deliveryStatusCopy(
  DeliveryTracking t, {
  DateTime? now,
}) {
  final window = deliveryWindowText(t, now: now);
  return switch (t.stage) {
    DeliveryStage.delivered => (
      icon: Icons.check_circle_outline_rounded,
      title: 'Livrée, merci !',
      detail:
          'Livrée ${parisDay(t.deliveredAt!, now: now)} à '
          '${parisTime(t.deliveredAt!)}.',
    ),
    DeliveryStage.next => (
      icon: Icons.directions_car_outlined,
      title: 'Vous êtes les prochains !',
      detail: 'Notre livreur est en route vers chez vous.',
    ),
    DeliveryStage.started => (
      icon: Icons.local_shipping_outlined,
      title: 'Notre tournée a commencé !',
      detail: window ?? 'Nous passons chez vous dans la journée.',
    ),
    DeliveryStage.planned => (
      icon: Icons.event_outlined,
      title: 'Livraison prévue',
      detail: window ?? 'Nous vous prévenons ici dès que la tournée commence.',
    ),
  };
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.tracking});

  final DeliveryTracking tracking;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final copy = deliveryStatusCopy(tracking);
    final delay = tracking.announcedDelay;
    final live = tracking.stage == DeliveryStage.next;
    return MergeSemantics(
      child: StageCard(
        selected: live,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: live ? scheme.primary : scheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                copy.icon,
                color: live ? scheme.onPrimary : scheme.primary,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    copy.title,
                    style: AppFonts.display(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: scheme.onSurface,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    copy.detail,
                    style: AppFonts.sans(
                      fontSize: 15,
                      height: 1.4,
                      color: scheme.onSurfaceVariant,
                    ),
                  ),
                  if (delay > 0 &&
                      tracking.stage != DeliveryStage.delivered) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Nous avons environ $delay minutes de retard, '
                      'désolés.',
                      style: AppFonts.sans(
                        fontSize: 14,
                        height: 1.4,
                        fontWeight: FontWeight.w600,
                        color: scheme.onSurface,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Notifications extends StatelessWidget {
  const _Notifications({required this.enabled, required this.onEnable});

  final bool? enabled;
  final VoidCallback onEnable;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (enabled == true) {
      return MergeSemantics(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.notifications_active_outlined, color: scheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Vous serez prévenu ici le jour de la livraison.',
                style: AppFonts.sans(
                  fontSize: 15,
                  height: 1.4,
                  color: scheme.onSurface,
                ),
              ),
            ),
          ],
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Les notifications sont désactivées : vous ne serez pas prévenu '
          'le jour de la livraison.',
          style: AppFonts.sans(
            fontSize: 15,
            height: 1.4,
            color: scheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: enabled == null ? null : onEnable,
          icon: const Icon(Icons.notifications_outlined, size: 20),
          label: const Text('Activer les notifications'),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
          ),
        ),
      ],
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.icon, required this.text, this.action});

  final IconData icon;
  final String text;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return StageCard(
      child: Row(
        children: [
          Icon(icon, color: scheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: AppFonts.sans(
                fontSize: 14,
                height: 1.4,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ),
          ?action,
        ],
      ),
    );
  }
}

class _Over extends StatelessWidget {
  const _Over({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _Greeting(label: label),
        const SizedBox(height: 20),
        StageCard(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: scheme.primaryContainer,
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.inventory_2_outlined, color: scheme.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cette livraison est terminée',
                      style: AppFonts.display(
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                        color: scheme.onSurface,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Merci pour votre confiance, et à bientôt ! Ce '
                      'téléphone ne la suit plus.',
                      style: AppFonts.sans(
                        fontSize: 15,
                        height: 1.4,
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => context.go(AppRouter.publicHome),
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: const Text('Retour à l’accueil'),
        ),
      ],
    );
  }
}

class _Missing extends StatelessWidget {
  const _Missing({required this.onCode});

  final VoidCallback onCode;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        kScreenHorizontalPadding,
        16,
        kScreenHorizontalPadding,
        32,
      ),
      children: [
        _Note(
          icon: Icons.inventory_2_outlined,
          text:
              'Cette livraison n’est pas enregistrée sur ce téléphone. Le '
              'code du SMS permet de la retrouver.',
        ),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: onCode,
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
          child: const Text('J’ai un code'),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => context.go(AppRouter.publicHome),
          child: Text(
            'Retour à l’accueil',
            style: TextStyle(color: scheme.onSurfaceVariant),
          ),
        ),
      ],
    );
  }
}
