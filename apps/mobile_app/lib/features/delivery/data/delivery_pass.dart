import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// A delivery this phone follows (#593): what the server gave back for a
/// redeemed code. No account, no name beyond the recipient's own label.
class DeliveryPass {
  const DeliveryPass({
    required this.recipientId,
    required this.trackingToken,
    required this.code,
    required this.label,
    required this.addedAt,
  });

  /// `delivery_recipients.id`, the id in the push data and the route.
  final String recipientId;

  /// The recipient's `public_token`: reads the tracking, opens the web map.
  final String trackingToken;

  /// The normalised code (8 characters, no dash).
  final String code;

  /// The recipient's name as the driver typed it.
  final String label;

  final DateTime addedAt;

  Map<String, dynamic> toJson() => {
    'recipient_id': recipientId,
    'tracking_token': trackingToken,
    'code': code,
    'label': label,
    'added_at': addedAt.toUtc().toIso8601String(),
  };

  static DeliveryPass? fromJson(Object? json) {
    if (json is! Map) return null;
    final recipientId = json['recipient_id'];
    final token = json['tracking_token'];
    if (recipientId is! String || token is! String) return null;
    if (recipientId.isEmpty || token.isEmpty) return null;
    return DeliveryPass(
      recipientId: recipientId,
      trackingToken: token,
      code: json['code'] is String ? json['code'] as String : '',
      label: json['label'] is String ? json['label'] as String : '',
      addedAt:
          DateTime.tryParse(json['added_at']?.toString() ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is DeliveryPass &&
      other.recipientId == recipientId &&
      other.trackingToken == trackingToken &&
      other.code == code &&
      other.label == label;

  @override
  int get hashCode => Object.hash(recipientId, trackingToken, code, label);
}

/// The passes kept on the phone, as one JSON list in SharedPreferences.
class DeliveryPassStore {
  const DeliveryPassStore();

  static const String key = 'delivery_passes';

  Future<List<DeliveryPass>> all() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(key);
      if (raw == null || raw.isEmpty) return const [];
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return decoded.map(DeliveryPass.fromJson).nonNulls.toList();
    } catch (_) {
      return const [];
    }
  }

  Future<DeliveryPass?> find(String recipientId) async {
    for (final pass in await all()) {
      if (pass.recipientId == recipientId) return pass;
    }
    return null;
  }

  /// Adds [pass], replacing an older pass of the same recipient.
  Future<void> save(DeliveryPass pass) async {
    final passes = [...await all()];
    passes.removeWhere((p) => p.recipientId == pass.recipientId);
    passes.add(pass);
    await _write(passes);
  }

  Future<void> remove(String recipientId) async {
    final passes = [...await all()];
    passes.removeWhere((p) => p.recipientId == recipientId);
    await _write(passes);
  }

  Future<void> _write(List<DeliveryPass> passes) async {
    final prefs = await SharedPreferences.getInstance();
    if (passes.isEmpty) {
      await prefs.remove(key);
    } else {
      await prefs.setString(
        key,
        jsonEncode(passes.map((p) => p.toJson()).toList()),
      );
    }
  }
}
