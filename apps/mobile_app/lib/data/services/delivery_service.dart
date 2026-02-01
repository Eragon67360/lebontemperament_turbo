import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/delivery.dart';
import '../models/delivery_recipient.dart';
import '../../core/config/supabase_config.dart';
import '../../features/auth/data/services/auth_service.dart';

class DeliveryService {
  final SupabaseClient _client = SupabaseConfig.client;
  final AuthService _auth = AuthService();
  final Logger _logger = Logger();

  String? get _userId => _auth.currentUser?.id;

  /// Fetches the latest delivery for the current user, or creates one if none or expired.
  /// RLS: only superadmins can insert/update. Call only when authenticated.
  Future<Delivery?> getOrCreateDelivery() async {
    final userId = _userId;
    if (userId == null) return null;

    try {
      final response = await _client
          .from('deliveries')
          .select()
          .eq('driver_id', userId)
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();

      if (response != null) {
        final delivery = Delivery.fromJson(response);
        final isExpired = delivery.expiresAt.isBefore(DateTime.now());
        if (!isExpired) {
          _logger.i('DeliveryService: using existing delivery ${delivery.id}');
          return delivery;
        }
      }

      // Create new delivery
      final publicToken = const Uuid().v4();
      final expiresAt = DateTime.now().add(const Duration(hours: 24));

      final insertResponse = await _client
          .from('deliveries')
          .insert({
            'driver_id': userId,
            'public_token': publicToken,
            'expires_at': expiresAt.toIso8601String(),
            'is_tracking_active': false,
          })
          .select()
          .single();

      final newDelivery = Delivery.fromJson(insertResponse);
      _logger.i('DeliveryService: created delivery ${newDelivery.id}');
      return newDelivery;
    } catch (e) {
      _logger.e('DeliveryService: getOrCreateDelivery failed', error: e);
      rethrow;
    }
  }

  /// Sets is_tracking_active = true for the given delivery.
  Future<void> startTracking(String deliveryId) async {
    try {
      await _client
          .from('deliveries')
          .update({'is_tracking_active': true})
          .eq('id', deliveryId);
      _logger.i('DeliveryService: startTracking $deliveryId');
    } catch (e) {
      _logger.e('DeliveryService: startTracking failed', error: e);
      rethrow;
    }
  }

  /// Sets is_tracking_active = false for the given delivery.
  Future<void> stopTracking(String deliveryId) async {
    try {
      await _client
          .from('deliveries')
          .update({'is_tracking_active': false})
          .eq('id', deliveryId);
      _logger.i('DeliveryService: stopTracking $deliveryId');
    } catch (e) {
      _logger.e('DeliveryService: stopTracking failed', error: e);
      rethrow;
    }
  }

  /// Updates latitude and longitude. updated_at is set by DB trigger.
  Future<void> updatePosition(
    String deliveryId,
    double latitude,
    double longitude,
  ) async {
    try {
      await _client.from('deliveries').update({
        'latitude': latitude,
        'longitude': longitude,
      }).eq('id', deliveryId);
    } catch (e) {
      _logger.e('DeliveryService: updatePosition failed', error: e);
      rethrow;
    }
  }

  /// Generates a new public_token and extends expires_at by 24 hours.
  Future<Delivery?> resetToken(String deliveryId) async {
    try {
      final publicToken = const Uuid().v4();
      final expiresAt = DateTime.now().add(const Duration(hours: 24));

      final response = await _client
          .from('deliveries')
          .update({
            'public_token': publicToken,
            'expires_at': expiresAt.toIso8601String(),
          })
          .eq('id', deliveryId)
          .select()
          .single();

      _logger.i('DeliveryService: resetToken $deliveryId');
      return Delivery.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: resetToken failed', error: e);
      rethrow;
    }
  }

  /// Updates scheduled delivery time.
  Future<Delivery?> updateScheduledAt(String deliveryId, DateTime? scheduledAt) async {
    try {
      final response = await _client
          .from('deliveries')
          .update({
            'scheduled_at': scheduledAt?.toIso8601String(),
          })
          .eq('id', deliveryId)
          .select()
          .single();
      _logger.i('DeliveryService: updateScheduledAt $deliveryId');
      return Delivery.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: updateScheduledAt failed', error: e);
      rethrow;
    }
  }

  /// Sets delay flag and optional delay minutes.
  Future<Delivery?> setDelay(
    String deliveryId, {
    required bool isDelayed,
    int? delayMinutes,
  }) async {
    try {
      final response = await _client
          .from('deliveries')
          .update({
            'is_delayed': isDelayed,
            'delay_minutes': delayMinutes,
          })
          .eq('id', deliveryId)
          .select()
          .single();
      _logger.i('DeliveryService: setDelay $deliveryId');
      return Delivery.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: setDelay failed', error: e);
      rethrow;
    }
  }

  /// Sets or clears problem message (e.g. "Bouchons", "Accident").
  Future<Delivery?> setProblemMessage(String deliveryId, String? message) async {
    try {
      final response = await _client
          .from('deliveries')
          .update({'problem_message': message})
          .eq('id', deliveryId)
          .select()
          .single();
      _logger.i('DeliveryService: setProblemMessage $deliveryId');
      return Delivery.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: setProblemMessage failed', error: e);
      rethrow;
    }
  }

  /// Fetches recipients for a delivery, ordered by sort_order then scheduled_at.
  Future<List<DeliveryRecipient>> getRecipients(String deliveryId) async {
    try {
      final response = await _client
          .from('delivery_recipients')
          .select()
          .eq('delivery_id', deliveryId)
          .order('sort_order')
          .order('scheduled_at');
      final list = response as List<dynamic>? ?? [];
      return list.map((e) => DeliveryRecipient.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _logger.e('DeliveryService: getRecipients failed', error: e);
      rethrow;
    }
  }

  /// Adds a recipient.
  Future<DeliveryRecipient> addRecipient(
    String deliveryId, {
    required String label,
    required DateTime scheduledAt,
    int sortOrder = 0,
  }) async {
    try {
      final response = await _client
          .from('delivery_recipients')
          .insert({
            'delivery_id': deliveryId,
            'label': label,
            'scheduled_at': scheduledAt.toIso8601String(),
            'sort_order': sortOrder,
          })
          .select()
          .single();
      _logger.i('DeliveryService: addRecipient $deliveryId');
      return DeliveryRecipient.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: addRecipient failed', error: e);
      rethrow;
    }
  }

  /// Updates a recipient.
  Future<DeliveryRecipient> updateRecipient(
    String recipientId, {
    String? label,
    DateTime? scheduledAt,
    int? sortOrder,
  }) async {
    try {
      final Map<String, dynamic> updates = {};
      if (label != null) updates['label'] = label;
      if (scheduledAt != null) updates['scheduled_at'] = scheduledAt.toIso8601String();
      if (sortOrder != null) updates['sort_order'] = sortOrder;
      if (updates.isEmpty) throw ArgumentError('At least one field must be updated');
      final response = await _client
          .from('delivery_recipients')
          .update(updates)
          .eq('id', recipientId)
          .select()
          .single();
      _logger.i('DeliveryService: updateRecipient $recipientId');
      return DeliveryRecipient.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: updateRecipient failed', error: e);
      rethrow;
    }
  }

  /// Deletes a recipient.
  Future<void> deleteRecipient(String recipientId) async {
    try {
      await _client.from('delivery_recipients').delete().eq('id', recipientId);
      _logger.i('DeliveryService: deleteRecipient $recipientId');
    } catch (e) {
      _logger.e('DeliveryService: deleteRecipient failed', error: e);
      rethrow;
    }
  }
}
