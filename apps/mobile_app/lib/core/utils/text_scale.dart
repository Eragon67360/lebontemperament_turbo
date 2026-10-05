import 'package:flutter/widgets.dart';

/// A header [height] designed at the default text size, grown by what its
/// [text] part (the lines of text it holds, in logical pixels) gains at the
/// member's system text size, so titles never run into the back button or
/// the avatar when the text is large.
double headerHeight(
  BuildContext context,
  double height, {
  required double text,
}) => height + MediaQuery.textScalerOf(context).scale(text) - text;

/// The [FlexibleSpaceBar] title enlargement (1.5 by default), reduced as the
/// system text size grows so a large title doesn't break mid-word.
double expandedTitleScale(BuildContext context) =>
    (1.5 / MediaQuery.textScalerOf(context).scale(1)).clamp(1.0, 1.5);
