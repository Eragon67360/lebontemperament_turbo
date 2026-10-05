import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';

/// Shared pieces of the « Coulisses » look: cards, date tiles, section
/// headers, group colours and the countdown wording.

// MARK: - Groups

String groupLabel(GroupType group) => switch (group) {
  GroupType.orchestre => 'Orchestre',
  GroupType.hommes => 'Hommes',
  GroupType.femmes => 'Femmes',
  GroupType.jeunesEnfants => 'Jeunes/Enfants',
  GroupType.choeurComplet => 'Chœur complet',
  GroupType.tous => 'Tous',
};

Color groupColor(BuildContext context, GroupType group) {
  final c = StageColors.of(context);
  return switch (group) {
    GroupType.orchestre => c.orchestre,
    GroupType.hommes => c.hommes,
    GroupType.femmes => c.femmes,
    GroupType.jeunesEnfants => c.jeunes,
    GroupType.choeurComplet || GroupType.tous => c.tutti,
  };
}

// MARK: - Dates

const _monthsShort = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];
const _monthsLong = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const _weekdaysLong = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
];
const _weekdaysShort = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

String monthShort(DateTime d) => _monthsShort[d.month - 1];
String weekdayShort(DateTime d) => _weekdaysShort[d.weekday - 1];

/// « mardi 6 octobre ».
String longDate(DateTime d) =>
    '${_weekdaysLong[d.weekday - 1]} ${d.day} ${_monthsLong[d.month - 1]}';

/// Whole days from [now] to [day], by calendar date (0 = today).
int daysUntil(DateTime day, {DateTime? now}) {
  final n = now ?? DateTime.now();
  final a = DateTime(n.year, n.month, n.day);
  final b = DateTime(day.year, day.month, day.day);
  return (b.difference(a).inHours / 24).round();
}

/// The hero's big countdown: « Ce soir » / « Aujourd’hui », « Demain »,
/// then « J-3 ».
String countdownLabel(DateTime day, {DateTime? now, bool evening = false}) {
  final days = daysUntil(day, now: now);
  if (days <= 0) return evening ? 'Ce soir' : 'Aujourd’hui';
  if (days == 1) return 'Demain';
  return 'J-$days';
}

/// « dans 20 jours », « demain », « aujourd’hui ».
String relativeDays(DateTime day, {DateTime? now}) {
  final days = daysUntil(day, now: now);
  if (days <= 0) return 'aujourd’hui';
  if (days == 1) return 'demain';
  return 'dans $days jours';
}

/// "20:00:00" → « 20 h », "19:30" → « 19 h 30 ».
String frenchTime(String? time) {
  if (time == null || time.isEmpty) return '';
  final parts = time.split(':');
  if (parts.length < 2) return time;
  final h = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (h == null || m == null) return time;
  return m == 0 ? '$h h' : '$h h ${m.toString().padLeft(2, '0')}';
}

/// « 20 h – 22 h », or just the start.
String frenchTimeRange(String? start, String? end) {
  final s = frenchTime(start);
  final e = frenchTime(end);
  if (s.isEmpty) return '';
  return e.isEmpty ? s : '$s – $e';
}

// MARK: - Building blocks

/// A card on the stage: raised surface, hairline border, rounded 20.
class StageCard extends StatelessWidget {
  const StageCard({
    super.key,
    required this.child,
    this.onTap,
    this.selected = false,
    this.padding = const EdgeInsets.all(16),
    this.color,
    this.semanticLabel,
  });

  final Widget child;
  final VoidCallback? onTap;

  /// Highlights the card with the accent border (the next rehearsal).
  final bool selected;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(20),
      side: BorderSide(
        color: selected ? s.primary : s.outlineVariant,
        width: selected ? 1.5 : 1,
      ),
    );
    Widget content = Padding(padding: padding, child: child);
    if (onTap != null) {
      content = InkWell(
        customBorder: shape,
        onTap: () {
          HapticFeedback.lightImpact();
          onTap!();
        },
        child: content,
      );
    }
    final card = Material(
      color: color ?? (selected ? s.primaryContainer : s.surfaceContainer),
      shape: shape,
      clipBehavior: Clip.antiAlias,
      child: content,
    );
    if (semanticLabel == null) return card;
    return Semantics(
      button: onTap != null,
      label: semanticLabel,
      child: ExcludeSemantics(child: card),
    );
  }
}

/// Section title in the display face, with an optional « Tout voir » link.
class StageSectionHeader extends StatelessWidget {
  const StageSectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Semantics(
            header: true,
            child: Text(
              title,
              style: AppFonts.display(
                fontSize: 21,
                fontWeight: FontWeight.w700,
                color: s.onSurface,
              ),
            ),
          ),
        ),
        if (actionLabel != null && onAction != null)
          TextButton(onPressed: onAction, child: Text(actionLabel!)),
      ],
    );
  }
}

/// Day and month on a light tile (or accent-coloured when [accent] is set).
/// Grows with the text size instead of clipping.
class StageDateTile extends StatelessWidget {
  const StageDateTile({
    super.key,
    required this.date,
    this.size = 64,
    this.accent,
  });

  final DateTime date;
  final double size;
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final bg = accent ?? s.onSurface;
    final fg = s.surface;
    return Container(
      constraints: BoxConstraints(minWidth: size, minHeight: size),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(size / 4),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            '${date.day}',
            style: AppFonts.display(
              fontSize: size * 0.44,
              fontWeight: FontWeight.w800,
              color: fg,
              height: 1,
            ),
          ),
          Text(
            monthShort(date).toUpperCase(),
            style: AppFonts.sans(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: fg,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Small uppercase label above a title (« PROCHAINE RÉPÉTITION »).
class StageEyebrow extends StatelessWidget {
  const StageEyebrow(this.text, {super.key, this.color});
  final String text;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: AppFonts.sans(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.6,
        color: color ?? Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

/// A short coloured bar, the group's mark on rehearsal cards.
class GroupMark extends StatelessWidget {
  const GroupMark({super.key, required this.color, this.width = 28});
  final Color color;
  final double width;

  @override
  Widget build(BuildContext context) => Container(
    width: width,
    height: 4,
    decoration: BoxDecoration(
      color: color,
      borderRadius: BorderRadius.circular(2),
    ),
  );
}

/// The association's tuning fork, drawn (no asset).
class TuningForkMark extends StatelessWidget {
  const TuningForkMark({super.key, this.size = 28, this.color});
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: CustomPaint(
      size: Size(size * 0.78, size),
      painter: _ForkPainter(color ?? Theme.of(context).colorScheme.primary),
    ),
  );
}

class _ForkPainter extends CustomPainter {
  _ForkPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = w * 0.11
      ..strokeCap = StrokeCap.round;
    final prong = Path()
      ..moveTo(w * 0.22, h * 0.06)
      ..lineTo(w * 0.22, h * 0.42)
      ..arcToPoint(
        Offset(w * 0.78, h * 0.42),
        radius: Radius.circular(w * 0.28),
        clockwise: false,
      )
      ..lineTo(w * 0.78, h * 0.06);
    canvas.drawPath(prong, p);
    canvas.drawLine(Offset(w * 0.5, h * 0.66), Offset(w * 0.5, h * 0.94), p);
  }

  @override
  bool shouldRepaint(_ForkPainter old) => old.color != color;
}

/// Concentric rings behind the hero, like a tuning fork's resonance.
class ResonanceRings extends StatelessWidget {
  const ResonanceRings({super.key, required this.color, this.size = 220});
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: CustomPaint(size: Size.square(size), painter: _RingsPainter(color)),
  );
}

class _RingsPainter extends CustomPainter {
  _RingsPainter(this.color);
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final r = math.min(size.width, size.height) / 2;
    for (final (f, w) in [(0.36, 1.5), (0.64, 1.0), (0.92, 0.6)]) {
      canvas.drawCircle(
        c,
        r * f,
        Paint()
          ..color = color
          ..style = PaintingStyle.stroke
          ..strokeWidth = w,
      );
    }
  }

  @override
  bool shouldRepaint(_RingsPainter old) => old.color != color;
}
