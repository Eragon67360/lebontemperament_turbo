import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/theme/app_theme.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';

/// Shared pieces of the « Coulisses » look, lightened to « Portée »: cards,
/// date tiles, section headers, group colours, the week staff and the
/// countdown wording.

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

/// A card on the stage (« Portée »): the page ground behind a hairline,
/// rounded 16, so lists read as light outlines rather than blocks.
class StageCard extends StatelessWidget {
  const StageCard({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.selected = false,
    this.padding = const EdgeInsets.all(16),
    this.color,
    this.semanticLabel,
  });

  final Widget child;
  final VoidCallback? onTap;

  /// A secondary action (e.g. showing a name the card had to truncate).
  final VoidCallback? onLongPress;

  /// Highlights the card with the accent border (the next rehearsal).
  final bool selected;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
      side: BorderSide(
        color: selected ? s.primary : s.outlineVariant,
        width: selected ? 1.5 : 1,
      ),
    );
    Widget content = Padding(padding: padding, child: child);
    if (onTap != null || onLongPress != null) {
      content = InkWell(
        customBorder: shape,
        onTap: onTap == null
            ? null
            : () {
                HapticFeedback.lightImpact();
                onTap!();
              },
        onLongPress: onLongPress,
        child: content,
      );
    }
    final card = Material(
      color: color ?? (selected ? s.primaryContainer : s.surface),
      shape: shape,
      clipBehavior: Clip.antiAlias,
      child: content,
    );
    if (semanticLabel == null) return card;
    return Semantics(
      button: onTap != null,
      label: semanticLabel,
      onLongPress: onLongPress,
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
                fontSize: 19,
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

/// Day and month in a hairline frame, the day in the accent when [accent] is
/// set. Grows with the text size instead of clipping.
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
    final dayColor = accent ?? s.primary;
    return Container(
      constraints: BoxConstraints(minWidth: size, minHeight: size),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
      decoration: BoxDecoration(
        border: Border.all(color: s.outlineVariant),
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
              fontWeight: FontWeight.w400,
              color: dayColor,
              height: 1,
            ),
          ),
          Text(
            monthShort(date),
            style: AppFonts.sans(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: s.onSurfaceVariant,
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
        fontWeight: FontWeight.w600,
        letterSpacing: 1.2,
        color: color ?? Theme.of(context).colorScheme.primary,
      ),
    );
  }
}

/// The group's mark: a small dot in its colour, like a note head.
class GroupMark extends StatelessWidget {
  const GroupMark({super.key, required this.color, this.size = 8});
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
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

// MARK: - Week staff

/// The current week as one bar of music (« Portée »): five hairlines, a day
/// per column, and a note head in the group's colour on each day with a
/// rehearsal. Today is the dashed line. The whole thing is read out as one
/// sentence, so screen readers get the list, not the drawing.
class WeekStaff extends StatelessWidget {
  const WeekStaff({super.key, required this.rehearsals, this.now});

  final List<Rehearsal> rehearsals;

  /// Today, for tests.
  final DateTime? now;

  /// Line each group's notes sit on, from the bottom (0) to the top (4), so
  /// two groups on the same day don't hide each other.
  static int lineFor(GroupType group) => switch (group) {
    GroupType.orchestre => 0,
    GroupType.hommes => 1,
    GroupType.choeurComplet || GroupType.tous => 2,
    GroupType.femmes => 3,
    GroupType.jeunesEnfants => 4,
  };

  /// Monday of the week holding [day].
  static DateTime weekStart(DateTime day) {
    final d = DateTime(day.year, day.month, day.day);
    return d.subtract(Duration(days: d.weekday - 1));
  }

  /// The rehearsals falling in [day]'s week, as (weekday index 0–6, group).
  static List<(int, GroupType)> notesFor(
    List<Rehearsal> rehearsals,
    DateTime day,
  ) {
    final start = weekStart(day);
    final notes = <(int, GroupType)>[];
    for (final r in rehearsals) {
      final date = DateTime.tryParse(r.date ?? '');
      if (date == null) continue;
      final offset = DateTime(
        date.year,
        date.month,
        date.day,
      ).difference(start).inHours;
      final index = (offset / 24).round();
      if (index >= 0 && index < 7) notes.add((index, r.groupType));
    }
    return notes;
  }

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    final today = now ?? DateTime.now();
    final start = weekStart(today);
    final todayIndex = today.weekday - 1;
    final notes = notesFor(rehearsals, today);
    final days = [for (var i = 0; i < 7; i++) start.add(Duration(days: i))];
    final busy = {for (final n in notes) n.$1};

    final spoken = notes.isEmpty
        ? 'Cette semaine : aucune répétition'
        : 'Cette semaine : ${[for (final n in notes) '${longDate(days[n.$1])}, ${groupLabel(n.$2)}'].join(' ; ')}';

    return Semantics(
      label: spoken,
      container: true,
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 64,
              child: CustomPaint(
                painter: _StaffPainter(
                  line: s.outlineVariant,
                  today: s.primary,
                  todayIndex: todayIndex,
                  notes: [
                    for (final n in notes)
                      (n.$1, lineFor(n.$2), groupColor(context, n.$2)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                for (var i = 0; i < 7; i++)
                  Expanded(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        busy.contains(i) || i == todayIndex
                            ? '${weekdayShort(days[i])} ${days[i].day}'
                            : weekdayShort(days[i]),
                        maxLines: 1,
                        style: AppFonts.sans(
                          fontSize: 13,
                          fontWeight: i == todayIndex
                              ? FontWeight.w600
                              : FontWeight.w400,
                          color: i == todayIndex
                              ? s.primary
                              : (busy.contains(i)
                                    ? s.onSurface
                                    : s.onSurfaceVariant),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StaffPainter extends CustomPainter {
  _StaffPainter({
    required this.line,
    required this.today,
    required this.todayIndex,
    required this.notes,
  });

  final Color line;
  final Color today;
  final int todayIndex;

  /// (day 0–6, staff line 0–4 from the bottom, colour).
  final List<(int, int, Color)> notes;

  static const double _gap = 8;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final column = w / 7;
    // The staff sits in the lower part, leaving room for the stems.
    final bottom = size.height - 4;
    double yOf(int lineIndex) => bottom - lineIndex * _gap;

    final hair = Paint()
      ..color = line
      ..strokeWidth = 1;
    for (var i = 0; i < 5; i++) {
      canvas.drawLine(Offset(0, yOf(i)), Offset(w, yOf(i)), hair);
    }
    canvas.drawLine(Offset(0.5, yOf(4)), Offset(0.5, yOf(0)), hair);
    canvas.drawLine(Offset(w - 0.5, yOf(4)), Offset(w - 0.5, yOf(0)), hair);

    // Today: a dashed line through the staff.
    final dash = Paint()
      ..color = today
      ..strokeWidth = 1;
    final x = column * (todayIndex + 0.5);
    for (var y = yOf(4) - 6; y < yOf(0) + 6; y += 5) {
      canvas.drawLine(Offset(x, y), Offset(x, y + 2), dash);
    }

    for (final (day, lineIndex, color) in notes) {
      final cx = column * (day + 0.5);
      final cy = yOf(lineIndex);
      final fill = Paint()..color = color;
      canvas.save();
      canvas.translate(cx, cy);
      canvas.rotate(-0.35);
      canvas.drawOval(
        Rect.fromCenter(center: Offset.zero, width: 13, height: 9),
        fill,
      );
      canvas.restore();
      final stem = Paint()
        ..color = color
        ..strokeWidth = 1.5;
      canvas.drawLine(Offset(cx + 6, cy - 1.5), Offset(cx + 6, cy - 26), stem);
    }
  }

  @override
  bool shouldRepaint(_StaffPainter old) =>
      old.line != line ||
      old.today != today ||
      old.todayIndex != todayIndex ||
      old.notes.length != notes.length ||
      !_sameNotes(old.notes, notes);

  static bool _sameNotes(List<(int, int, Color)> a, List<(int, int, Color)> b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}
