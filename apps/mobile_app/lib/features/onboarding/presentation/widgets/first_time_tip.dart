import 'package:flutter/material.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../data/welcome_prefs.dart';

/// A one-time hint the first time a member opens a screen (« Astuce »), in a
/// hairline frame with « Compris » to dismiss it for good. Hidden until the
/// preferences say it hasn't been seen, so it never flashes.
class FirstTimeTip extends StatefulWidget {
  const FirstTimeTip({
    super.key,
    required this.id,
    required this.message,
    this.padding = EdgeInsets.zero,
  });

  /// Stable key in the preferences (« partitions_listen »).
  final String id;
  final String message;
  final EdgeInsetsGeometry padding;

  @override
  State<FirstTimeTip> createState() => _FirstTimeTipState();
}

class _FirstTimeTipState extends State<FirstTimeTip> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    WelcomePrefs.tipSeen(widget.id).then((seen) {
      if (mounted && seen == false) setState(() => _visible = true);
    });
  }

  void _dismiss() {
    setState(() => _visible = false);
    WelcomePrefs.markTipSeen(widget.id);
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return const SizedBox.shrink();
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: widget.padding,
      child: Semantics(
        container: true,
        liveRegion: true,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 14, 8, 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: s.primary),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const StageEyebrow('Astuce'),
              const SizedBox(height: 6),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Text(
                  widget.message,
                  style: AppFonts.sans(
                    fontSize: 15,
                    color: s.onSurface,
                    height: 1.45,
                  ),
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _dismiss,
                  child: const Text('Compris'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
