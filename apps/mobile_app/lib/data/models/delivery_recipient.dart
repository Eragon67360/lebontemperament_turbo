/// A recipient on a delivery with a personalized scheduled time.
class DeliveryRecipient {
  final String id;
  final String deliveryId;
  final String label;
  final DateTime scheduledAt;
  final int sortOrder;

  const DeliveryRecipient({
    required this.id,
    required this.deliveryId,
    required this.label,
    required this.scheduledAt,
    this.sortOrder = 0,
  });

  factory DeliveryRecipient.fromJson(Map<String, dynamic> json) {
    return DeliveryRecipient(
      id: json['id'] as String,
      deliveryId: json['delivery_id'] as String,
      label: json['label'] as String,
      scheduledAt: DateTime.parse(json['scheduled_at'] as String),
      sortOrder: json['sort_order'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'delivery_id': deliveryId,
      'label': label,
      'scheduled_at': scheduledAt.toIso8601String(),
      'sort_order': sortOrder,
    };
  }

  DeliveryRecipient copyWith({
    String? id,
    String? deliveryId,
    String? label,
    DateTime? scheduledAt,
    int? sortOrder,
  }) {
    return DeliveryRecipient(
      id: id ?? this.id,
      deliveryId: deliveryId ?? this.deliveryId,
      label: label ?? this.label,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }
}
