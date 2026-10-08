import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/app_router.dart';
import '../../../../core/constants/ui_constants.dart';
import '../../../../core/theme/app_fonts.dart';
import '../../data/delivery_code.dart';
import '../../data/delivery_pass_service.dart';
import '../providers/delivery_providers.dart';
import 'delivery_screen.dart';

/// « J’ai un code » (#593): the 8-character code from the SMS, typed as
/// XXXX-XXXX. A good code opens « Votre livraison » in place of this screen.
class DeliveryCodeScreen extends ConsumerStatefulWidget {
  const DeliveryCodeScreen({super.key, this.initialCode, this.initialError});

  /// A code to start with (from a link that could not be redeemed).
  final String? initialCode;

  /// Why the link failed, shown under the field from the start.
  final String? initialError;

  @override
  ConsumerState<DeliveryCodeScreen> createState() => _DeliveryCodeScreenState();
}

class _DeliveryCodeScreenState extends ConsumerState<DeliveryCodeScreen> {
  late final TextEditingController _controller;
  String? _error;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: formatDeliveryCode(widget.initialCode ?? ''),
    );
    _error = widget.initialError;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    final code = normalizeDeliveryCode(_controller.text);
    if (!isValidDeliveryCode(code)) {
      setState(() => _error = redeemErrorMessage(const RedeemInvalid()));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final result = await ref.read(deliveryServiceProvider).redeem(code);
    if (!mounted) return;
    if (result is RedeemOk) {
      ref.invalidate(deliveryPassesProvider);
      context.pushReplacement(deliveryPath(result.pass.recipientId));
      return;
    }
    setState(() {
      _busy = false;
      _error = redeemErrorMessage(result);
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Text('J’ai un code'),
        leading: context.canPop()
            ? null
            : IconButton(
                icon: const Icon(Icons.home_outlined),
                tooltip: 'Accueil',
                onPressed: () => context.go(AppRouter.publicHome),
              ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            kScreenHorizontalPadding,
            16,
            kScreenHorizontalPadding,
            32,
          ),
          children: [
            Text(
              'Votre livraison',
              style: AppFonts.display(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: scheme.onSurface,
                height: 1.15,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Saisissez le code à 8 caractères reçu par SMS, par exemple '
              'K7MP-4XQ9, pour suivre votre livraison et être prévenu le '
              'jour même.',
              style: AppFonts.sans(
                fontSize: 15,
                height: 1.45,
                color: scheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _controller,
              autofocus: widget.initialCode == null,
              enabled: !_busy,
              autocorrect: false,
              enableSuggestions: false,
              textCapitalization: TextCapitalization.characters,
              keyboardType: TextInputType.visiblePassword,
              textInputAction: TextInputAction.done,
              inputFormatters: const [DeliveryCodeFormatter()],
              onChanged: (_) {
                if (_error != null) setState(() => _error = null);
              },
              onSubmitted: (_) => _submit(),
              textAlign: TextAlign.center,
              style: AppFonts.display(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: scheme.onSurface,
                letterSpacing: 3,
              ),
              decoration: InputDecoration(
                labelText: 'Code de livraison',
                hintText: 'XXXX-XXXX',
                hintStyle: AppFonts.display(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  color: scheme.onSurfaceVariant.withValues(alpha: 0.4),
                  letterSpacing: 3,
                ),
                errorText: _error,
                errorMaxLines: 4,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
              ),
              child: _busy
                  ? SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: scheme.onPrimary,
                      ),
                    )
                  : const Text('Valider'),
            ),
            const SizedBox(height: 24),
            Text(
              'Le code n’est lié à aucun compte : il permet seulement de '
              'suivre cette livraison depuis ce téléphone.',
              style: AppFonts.sans(
                fontSize: 13,
                height: 1.4,
                color: scheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
