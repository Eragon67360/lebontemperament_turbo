import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum ToastType { success, error, warning, info }

class CustomToast {
  static void show(
    BuildContext context, {
    required String message,
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    final overlay = Overlay.of(context);
    final overlayEntry = OverlayEntry(
      builder: (context) =>
          _ToastOverlay(message: message, type: type, duration: duration),
    );

    overlay.insert(overlayEntry);

    Future.delayed(duration, () {
      overlayEntry.remove();
    });
  }

  static void showSuccess(BuildContext context, String message) {
    show(context, message: message, type: ToastType.success);
  }

  static void showError(BuildContext context, String message) {
    show(context, message: message, type: ToastType.error);
  }

  static void showWarning(BuildContext context, String message) {
    show(context, message: message, type: ToastType.warning);
  }

  static void showInfo(BuildContext context, String message) {
    show(context, message: message, type: ToastType.info);
  }
}

class _ToastOverlay extends StatefulWidget {
  final String message;
  final ToastType type;
  final Duration duration;

  const _ToastOverlay({
    required this.message,
    required this.type,
    required this.duration,
  });

  @override
  State<_ToastOverlay> createState() => _ToastOverlayState();
}

class _ToastOverlayState extends State<_ToastOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, -1), end: Offset.zero).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Positioned(
      top: MediaQuery.of(context).padding.top + 20,
      left: 20,
      right: 20,
      child: SlideTransition(
        position: _slideAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Material(
            color: Colors.transparent,
            child: Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: _getBackgroundColor(scheme),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.withOpacity(Colors.black, 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    ExcludeSemantics(
                      child: Icon(
                        _getIcon(),
                        color: _getForegroundColor(scheme),
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.message,
                        style: TextStyle(
                          color: _getForegroundColor(scheme),
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // Pastel feedback backgrounds with the matching dark text step from
  // AppTheme (≥ 4.5:1 measured). The old toasts drew white (onPrimary /
  // onError) on these pastels: about 1.1:1, unreadable.
  Color _getBackgroundColor(ColorScheme scheme) {
    switch (widget.type) {
      case ToastType.success:
        return AppTheme.successBackground;
      case ToastType.error:
        return AppTheme.errorBackground;
      case ToastType.warning:
        return AppTheme.warningBackground;
      case ToastType.info:
        // Opaque teal tint on the theme surface (the 10 % alpha version let
        // the page show through, with white text on top).
        return Color.alphaBlend(
          scheme.primary.withValues(alpha: 0.12),
          scheme.surface,
        );
    }
  }

  Color _getForegroundColor(ColorScheme scheme) {
    switch (widget.type) {
      case ToastType.success:
        return AppTheme.successText;
      case ToastType.error:
        return AppTheme.errorText;
      case ToastType.warning:
        return AppTheme.warningText;
      case ToastType.info:
        // Light: #00696E on the tinted surface, 5.3:1; dark: #80D4DA, > 9:1.
        return scheme.primary;
    }
  }

  IconData _getIcon() {
    switch (widget.type) {
      case ToastType.success:
        return Icons.check_circle;
      case ToastType.error:
        return Icons.error;
      case ToastType.warning:
        return Icons.warning;
      case ToastType.info:
        return Icons.info;
    }
  }
}
