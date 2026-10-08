import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_fonts.dart';
import '../../data/delivery_pass_service.dart';
import '../providers/delivery_providers.dart';
import 'delivery_code_screen.dart';
import 'delivery_screen.dart';

/// `lebontemperament.com/l/<code>` opened in the app (#593): redeems the
/// code at once, then shows « Votre livraison », or the code screen with
/// what went wrong.
class DeliveryLinkScreen extends ConsumerStatefulWidget {
  const DeliveryLinkScreen({super.key, required this.code});

  final String code;

  @override
  ConsumerState<DeliveryLinkScreen> createState() => _DeliveryLinkScreenState();
}

class _DeliveryLinkScreenState extends ConsumerState<DeliveryLinkScreen> {
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _redeem());
  }

  Future<void> _redeem() async {
    final result = await ref.read(deliveryServiceProvider).redeem(widget.code);
    if (!mounted) return;
    if (result is RedeemOk) {
      ref.invalidate(deliveryPassesProvider);
      context.pushReplacement(deliveryPath(result.pass.recipientId));
      return;
    }
    setState(() => _error = redeemErrorMessage(result));
  }

  @override
  Widget build(BuildContext context) {
    final error = _error;
    if (error != null) {
      return DeliveryCodeScreen(initialCode: widget.code, initialError: error);
    }
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: scheme.primary),
              const SizedBox(height: 20),
              Text(
                'Ouverture de votre livraison…',
                textAlign: TextAlign.center,
                style: AppFonts.sans(
                  fontSize: 15,
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
