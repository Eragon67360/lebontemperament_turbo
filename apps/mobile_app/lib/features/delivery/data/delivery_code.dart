import 'package:flutter/services.dart';

/// Delivery codes (#593): 8 characters from an alphabet without look-alikes
/// (no 0/O, no 1/I/L), shown to people as « K7MP-4XQ9 », typed in any case,
/// with or without the dash.
const String kDeliveryCodeAlphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const int kDeliveryCodeLength = 8;

/// Uppercases [input] and drops everything that is not A–Z or 0–9 (spaces,
/// dashes, punctuation), as the server does before looking the code up.
String normalizeDeliveryCode(String input) =>
    input.toUpperCase().replaceAll(RegExp('[^A-Z0-9]'), '');

/// True when [normalized] is exactly 8 characters of the alphabet.
bool isValidDeliveryCode(String normalized) {
  if (normalized.length != kDeliveryCodeLength) return false;
  for (final rune in normalized.runes) {
    if (!kDeliveryCodeAlphabet.contains(String.fromCharCode(rune))) {
      return false;
    }
  }
  return true;
}

/// « K7MP4XQ9 » → « K7MP-4XQ9 ». A partial code gets its dash as soon as it
/// has more than four characters.
String formatDeliveryCode(String input) {
  final code = normalizeDeliveryCode(input);
  if (code.length <= 4) return code;
  return '${code.substring(0, 4)}-${code.substring(4)}';
}

/// Formats the field as XXXX-XXXX while the person types, keeping the caret
/// at the end of what they typed.
class DeliveryCodeFormatter extends TextInputFormatter {
  const DeliveryCodeFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var code = normalizeDeliveryCode(newValue.text);
    if (code.length > kDeliveryCodeLength) {
      code = code.substring(0, kDeliveryCodeLength);
    }
    final text = formatDeliveryCode(code);
    return TextEditingValue(
      text: text,
      selection: TextSelection.collapsed(offset: text.length),
    );
  }
}
