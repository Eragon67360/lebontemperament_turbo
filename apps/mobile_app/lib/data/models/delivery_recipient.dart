/// A recipient on a delivery with a personalized scheduled time.
/// [publicToken] is used for per-recipient shareable links; [deliveredAt] when set means delivered.
class DeliveryRecipient {
  final String id;
  final String deliveryId;
  final String label;
  final DateTime scheduledAt;
  final int sortOrder;
  final String? publicToken;
  final DateTime? deliveredAt;

  const DeliveryRecipient({
    required this.id,
    required this.deliveryId,
    required this.label,
    required this.scheduledAt,
    this.sortOrder = 0,
    this.publicToken,
    this.deliveredAt,
  });

  factory DeliveryRecipient.fromJson(Map<String, dynamic> json) {
    return DeliveryRecipient(
      id: json['id'] as String,
      deliveryId: json['delivery_id'] as String,
      label: json['label'] as String,
      scheduledAt: DateTime.parse(json['scheduled_at'] as String),
      sortOrder: json['sort_order'] as int? ?? 0,
      publicToken: json['public_token'] as String?,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.parse(json['delivered_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'delivery_id': deliveryId,
      'label': label,
      'scheduled_at': scheduledAt.toIso8601String(),
      'sort_order': sortOrder,
      if (publicToken != null) 'public_token': publicToken,
      if (deliveredAt != null) 'delivered_at': deliveredAt!.toIso8601String(),
    };
  }

  DeliveryRecipient copyWith({
    String? id,
    String? deliveryId,
    String? label,
    DateTime? scheduledAt,
    int? sortOrder,
    String? publicToken,
    DateTime? deliveredAt,
  }) {
    return DeliveryRecipient(
      id: id ?? this.id,
      deliveryId: deliveryId ?? this.deliveryId,
      label: label ?? this.label,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      sortOrder: sortOrder ?? this.sortOrder,
      publicToken: publicToken ?? this.publicToken,
      deliveredAt: deliveredAt ?? this.deliveredAt,
    );
  }
}
