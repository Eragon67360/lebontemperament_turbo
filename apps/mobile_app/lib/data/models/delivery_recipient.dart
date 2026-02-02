/// A recipient on a delivery with optional preferred time.
/// [publicToken] is used for per-recipient shareable links; [deliveredAt] when set means delivered.
/// [address], [latitude], [longitude] are used for route display (Point B).
class DeliveryRecipient {
  final String id;
  final String deliveryId;
  final String label;
  final DateTime? scheduledAt;
  final int sortOrder;
  final String? publicToken;
  final DateTime? deliveredAt;
  final String? address;
  final double? latitude;
  final double? longitude;
  final String? phoneNumber;

  const DeliveryRecipient({
    required this.id,
    required this.deliveryId,
    required this.label,
    this.scheduledAt,
    this.sortOrder = 0,
    this.publicToken,
    this.deliveredAt,
    this.address,
    this.latitude,
    this.longitude,
    this.phoneNumber,
  });

  factory DeliveryRecipient.fromJson(Map<String, dynamic> json) {
    return DeliveryRecipient(
      id: json['id'] as String,
      deliveryId: json['delivery_id'] as String,
      label: json['label'] as String,
      scheduledAt: json['scheduled_at'] != null
          ? DateTime.parse(json['scheduled_at'] as String)
          : null,
      sortOrder: json['sort_order'] as int? ?? 0,
      publicToken: json['public_token'] as String?,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.parse(json['delivered_at'] as String)
          : null,
      address: json['address'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      phoneNumber: json['phone_number'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'delivery_id': deliveryId,
      'label': label,
      if (scheduledAt != null) 'scheduled_at': scheduledAt!.toIso8601String(),
      'sort_order': sortOrder,
      if (publicToken != null) 'public_token': publicToken,
      if (deliveredAt != null) 'delivered_at': deliveredAt!.toIso8601String(),
      if (address != null) 'address': address,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (phoneNumber != null) 'phone_number': phoneNumber,
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
    String? address,
    double? latitude,
    double? longitude,
    String? phoneNumber,
  }) {
    return DeliveryRecipient(
      id: id ?? this.id,
      deliveryId: deliveryId ?? this.deliveryId,
      label: label ?? this.label,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      sortOrder: sortOrder ?? this.sortOrder,
      publicToken: publicToken ?? this.publicToken,
      deliveredAt: deliveredAt ?? this.deliveredAt,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      phoneNumber: phoneNumber ?? this.phoneNumber,
    );
  }
}
