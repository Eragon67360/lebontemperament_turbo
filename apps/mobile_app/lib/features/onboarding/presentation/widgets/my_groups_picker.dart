import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lebontemperament/core/theme/app_fonts.dart';
import 'package:lebontemperament/core/widgets/stage.dart';

import '../../../../data/models/rehearsal.dart';
import '../../../../data/providers/my_groups_provider.dart';

/// One line per ensemble with a checkbox: a member may sing and play, or
/// follow the young ones too. Used by the welcome tour and by
/// Profil › Mes ensembles.
class MyGroupsPicker extends StatelessWidget {
  const MyGroupsPicker({
    super.key,
    required this.selected,
    required this.onChanged,
  });

  final Set<GroupType> selected;
  final ValueChanged<Set<GroupType>> onChanged;

  static String hintFor(GroupType group) => switch (group) {
    GroupType.femmes => 'Sopranes et altos',
    GroupType.hommes => 'Ténors et basses',
    GroupType.orchestre => 'Musiciennes et musiciens',
    GroupType.jeunesEnfants => 'Le groupe des jeunes',
    _ => '',
  };

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final group in memberGroups)
          _GroupCheck(
            label: groupLabel(group),
            hint: hintFor(group),
            color: groupColor(context, group),
            checked: selected.contains(group),
            onTap: () => onChanged(
              selected.contains(group)
                  ? ({...selected}..remove(group))
                  : {...selected, group},
            ),
          ),
        Divider(height: 1, thickness: 1, color: s.outlineVariant),
      ],
    );
  }
}

class _GroupCheck extends StatelessWidget {
  const _GroupCheck({
    required this.label,
    required this.hint,
    required this.color,
    required this.checked,
    required this.onTap,
  });

  final String label;
  final String hint;
  final Color color;
  final bool checked;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Semantics(
      checked: checked,
      button: true,
      label: '$label, $hint',
      child: ExcludeSemantics(
        child: InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onTap();
          },
          child: Container(
            constraints: const BoxConstraints(minHeight: 64),
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: s.outlineVariant)),
            ),
            child: Row(
              children: [
                GroupMark(color: color, size: 10),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: AppFonts.sans(
                          fontSize: 17,
                          fontWeight: FontWeight.w500,
                          color: s.onSurface,
                        ),
                      ),
                      Text(
                        hint,
                        style: AppFonts.sans(
                          fontSize: 13,
                          color: s.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  width: 24,
                  height: 24,
                  decoration: BoxDecoration(
                    color: checked ? s.primary : Colors.transparent,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: checked ? s.primary : s.outline,
                      width: 1.5,
                    ),
                  ),
                  child: checked
                      ? Icon(Icons.check_rounded, size: 18, color: s.onPrimary)
                      : null,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
