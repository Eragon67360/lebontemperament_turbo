import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/delivery.dart';
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
}
