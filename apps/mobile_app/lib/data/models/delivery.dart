/// Delivery tracking record. Only superadmins can manage.
/// Clients read via public_token on the website.
class Delivery {
  final String id;
  final String driverId;
  final String publicToken;
  final double? latitude;
  final double? longitude;
  final bool isTrackingActive;
  final DateTime expiresAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Delivery({
    required this.id,
    required this.driverId,
    required this.publicToken,
    this.latitude,
    this.longitude,
    required this.isTrackingActive,
    required this.expiresAt,
    this.createdAt,
    this.updatedAt,
  });

  factory Delivery.fromJson(Map<String, dynamic> json) {
    return Delivery(
      id: json['id'] as String,
      driverId: json['driver_id'] as String,
      publicToken: json['public_token'] as String,
      latitude: json['latitude'] != null
          ? (json['latitude'] is num
              ? (json['latitude'] as num).toDouble()
              : double.tryParse(json['latitude'].toString()))
          : null,
      longitude: json['longitude'] != null
          ? (json['longitude'] is num
              ? (json['longitude'] as num).toDouble()
              : double.tryParse(json['longitude'].toString()))
          : null,
      isTrackingActive: json['is_tracking_active'] as bool? ?? false,
      expiresAt: DateTime.parse(json['expires_at'] as String),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
    );
  }

  Delivery copyWith({
    String? id,
    String? driverId,
    String? publicToken,
    double? latitude,
    double? longitude,
    bool? isTrackingActive,
    DateTime? expiresAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Delivery(
      id: id ?? this.id,
      driverId: driverId ?? this.driverId,
      publicToken: publicToken ?? this.publicToken,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isTrackingActive: isTrackingActive ?? this.isTrackingActive,
      expiresAt: expiresAt ?? this.expiresAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
