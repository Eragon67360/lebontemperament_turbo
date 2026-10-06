import 'package:flutter/material.dart';

/// Google's multicolour « G » for the « Continuer avec Google » button,
/// the same mark as the website's login button (react-icons FcGoogle),
/// drawn from its 48×48 SVG paths so it stays sharp at any text scale.
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key, this.size = 20});

  final double size;

  @override
  Widget build(BuildContext context) {
    return ExcludeSemantics(
      child: SizedBox.square(
        dimension: size,
        child: const CustomPaint(painter: _GoogleLogoPainter()),
      ),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  const _GoogleLogoPainter();

  // The SVG's viewBox, trimmed to the circle: x and y from 4 to 44.
  static const double _origin = 4;
  static const double _extent = 40;

  static final List<(Color, Path)> _parts = [
    (
      const Color(0xFFFFC107),
      (Path()
        ..moveTo(43.611, 20.083)
        ..lineTo(42.0, 20.083)
        ..lineTo(42.0, 20.0)
        ..lineTo(24.0, 20.0)
        ..lineTo(24.0, 28.0)
        ..lineTo(35.303, 28.0)
        ..cubicTo(33.654, 32.657, 29.223, 36.0, 24.0, 36.0)
        ..cubicTo(17.373, 36.0, 12.0, 30.627, 12.0, 24.0)
        ..cubicTo(12.0, 17.373, 17.373, 12.0, 24.0, 12.0)
        ..cubicTo(27.059, 12.0, 29.842, 13.154, 31.961, 15.039)
        ..lineTo(37.618, 9.382)
        ..cubicTo(34.046, 6.053, 29.268, 4.0, 24.0, 4.0)
        ..cubicTo(12.955, 4.0, 4.0, 12.955, 4.0, 24.0)
        ..cubicTo(4.0, 35.045, 12.955, 44.0, 24.0, 44.0)
        ..cubicTo(35.045, 44.0, 44.0, 35.045, 44.0, 24.0)
        ..cubicTo(44.0, 22.659, 43.862, 21.35, 43.611, 20.083)
        ..close()),
    ),
    (
      const Color(0xFFFF3D00),
      (Path()
        ..moveTo(6.306, 14.691)
        ..lineTo(12.877, 19.51)
        ..cubicTo(14.655, 15.108, 18.961, 12.0, 24.0, 12.0)
        ..cubicTo(27.059, 12.0, 29.842, 13.154, 31.961, 15.039)
        ..lineTo(37.618, 9.382)
        ..cubicTo(34.046, 6.053, 29.268, 4.0, 24.0, 4.0)
        ..cubicTo(16.318, 4.0, 9.656, 8.337, 6.306, 14.691)
        ..close()),
    ),
    (
      const Color(0xFF4CAF50),
      (Path()
        ..moveTo(24.0, 44.0)
        ..cubicTo(29.166, 44.0, 33.86, 42.023, 37.409, 38.808)
        ..lineTo(31.219, 33.57)
        ..cubicTo(29.211, 35.091, 26.715, 36.0, 24.0, 36.0)
        ..cubicTo(18.798, 36.0, 14.381, 32.683, 12.717, 28.054)
        ..lineTo(6.195, 33.079)
        ..cubicTo(9.505, 39.556, 16.227, 44.0, 24.0, 44.0)
        ..close()),
    ),
    (
      const Color(0xFF1976D2),
      (Path()
        ..moveTo(43.611, 20.083)
        ..lineTo(42.0, 20.083)
        ..lineTo(42.0, 20.0)
        ..lineTo(24.0, 20.0)
        ..lineTo(24.0, 28.0)
        ..lineTo(35.303, 28.0)
        ..cubicTo(34.511, 30.237, 33.072, 32.166, 31.216, 33.571)
        ..cubicTo(31.217, 33.57, 31.218, 33.57, 31.219, 33.569)
        ..lineTo(37.409, 38.807)
        ..cubicTo(36.971, 39.205, 44.0, 34.0, 44.0, 24.0)
        ..cubicTo(44.0, 22.659, 43.862, 21.35, 43.611, 20.083)
        ..close()),
    ),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.shortestSide / _extent;
    canvas
      ..scale(scale)
      ..translate(-_origin, -_origin);
    final paint = Paint()..isAntiAlias = true;
    for (final (color, path) in _parts) {
      canvas.drawPath(path, paint..color = color);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
