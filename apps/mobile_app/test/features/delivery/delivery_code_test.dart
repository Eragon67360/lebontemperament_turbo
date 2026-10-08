import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/delivery/data/delivery_code.dart';

/// Delivery codes (#593): what people type against what the server stores.
void main() {
  test('normalising uppercases and drops dashes, spaces and punctuation', () {
    expect(normalizeDeliveryCode('k7mp-4xq9'), 'K7MP4XQ9');
    expect(normalizeDeliveryCode(' K7MP 4XQ9 '), 'K7MP4XQ9');
    expect(normalizeDeliveryCode('K7MP–4XQ9.'), 'K7MP4XQ9');
    expect(normalizeDeliveryCode(''), '');
  });

  test('a valid code is 8 characters of the look-alike-free alphabet', () {
    expect(isValidDeliveryCode('K7MP4XQ9'), isTrue);
    expect(isValidDeliveryCode('K7MP4XQ'), isFalse, reason: 'too short');
    expect(isValidDeliveryCode('K7MP4XQ9A'), isFalse, reason: 'too long');
    expect(isValidDeliveryCode('K7MP4XQ0'), isFalse, reason: 'no zero');
    expect(isValidDeliveryCode('K7MP4XQO'), isFalse, reason: 'no O');
    expect(isValidDeliveryCode('K7MP4XQ1'), isFalse, reason: 'no one');
    expect(isValidDeliveryCode('K7MP4XQI'), isFalse, reason: 'no I');
    expect(isValidDeliveryCode('K7MP4XQL'), isFalse, reason: 'no L');
    expect(isValidDeliveryCode('k7mp4xq9'), isFalse, reason: 'normalise first');
  });

  test('formatting shows XXXX-XXXX, the dash after four characters', () {
    expect(formatDeliveryCode('K7MP4XQ9'), 'K7MP-4XQ9');
    expect(formatDeliveryCode('k7mp-4xq9'), 'K7MP-4XQ9');
    expect(formatDeliveryCode('K7M'), 'K7M');
    expect(formatDeliveryCode('K7MP'), 'K7MP');
    expect(formatDeliveryCode('K7MP4'), 'K7MP-4');
  });

  test('the field formatter keeps the caret at the end and caps at 8', () {
    const formatter = DeliveryCodeFormatter();
    final typed = formatter.formatEditUpdate(
      TextEditingValue.empty,
      const TextEditingValue(
        text: 'k7mp4',
        selection: TextSelection.collapsed(offset: 5),
      ),
    );
    expect(typed.text, 'K7MP-4');
    expect(typed.selection.baseOffset, 6);

    final pasted = formatter.formatEditUpdate(
      TextEditingValue.empty,
      const TextEditingValue(text: 'k7mp-4xq9-extra'),
    );
    expect(pasted.text, 'K7MP-4XQ9');
  });
}
