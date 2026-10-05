import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/delivery_recipient.dart';
import 'package:lebontemperament/features/driver_tracking/presentation/screens/driver_tracking_screen.dart';

/// ReorderableListView reports the drop index as if the dragged row were
/// still in place: dragging downwards without the -1 correction inserted
/// past the end (RangeError on the last row).
void main() {
  final recipients = [
    for (final id in ['a', 'b', 'c', 'd'])
      DeliveryRecipient(id: id, deliveryId: 'delivery-test', label: id),
  ];

  test('moves a row down to the end', () {
    expect(reorderedRecipientIds(recipients, 0, 4), ['b', 'c', 'd', 'a']);
  });

  test('moves a row down by one', () {
    expect(reorderedRecipientIds(recipients, 1, 3), ['a', 'c', 'b', 'd']);
  });

  test('moves a row up', () {
    expect(reorderedRecipientIds(recipients, 3, 0), ['d', 'a', 'b', 'c']);
  });

  test('keeps the order when dropped in place', () {
    expect(reorderedRecipientIds(recipients, 2, 2), ['a', 'b', 'c', 'd']);
    expect(reorderedRecipientIds(recipients, 2, 3), ['a', 'b', 'c', 'd']);
  });
}
