import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/delivery.dart';
import '../models/delivery_recipient.dart';
import '../../core/config/supabase_config.dart';
import '../../features/auth/data/services/auth_service.dart';

/// A delivery with its recipients, used for the history screen.
class DeliveryWithRecipients {
  final Delivery delivery;
  final List<DeliveryRecipient> recipients;

  const DeliveryWithRecipients({
    required this.delivery,
    required this.recipients,
  });
}

class DeliveryService {
  final SupabaseClient _client = SupabaseConfig.client;
  final AuthService _auth = AuthService();
  final Logger _logger = Logger();

  String? get _userId => _auth.currentUser?.id;

  /// Fetches the latest delivery for the current user, or creates one if none.
  /// Reuses the latest delivery when it has pending (undelivered) recipients.
  /// Creates new only when: no delivery exists, all recipients delivered, or no recipients.
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
        final recipients = await getRecipients(delivery.id);
        final hasPending = recipients.any((r) => r.deliveredAt == null);

        if (hasPending) {
          final isExpired = delivery.expiresAt.isBefore(DateTime.now());
          if (isExpired) {
            final expiresAt = DateTime.now().add(const Duration(hours: 24));
            await _client.from('deliveries').update({
              'expires_at': expiresAt.toIso8601String(),
            }).eq('id', delivery.id);
            final refreshed = await getDelivery(delivery.id);
            _logger.i(
                'DeliveryService: reused expired delivery ${delivery.id}, extended expiry');
            return refreshed;
          }
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

  /// Fetches a delivery by id (e.g. after updating current_recipient_id).
  Future<Delivery?> getDelivery(String deliveryId) async {
    try {
      final response = await _client
          .from('deliveries')
          .select()
          .eq('id', deliveryId)
          .maybeSingle();
      return response != null ? Delivery.fromJson(response) : null;
    } catch (e) {
      _logger.e('DeliveryService: getDelivery failed', error: e);
      rethrow;
    }
  }

  /// Sets is_tracking_active = true for the given delivery.
  Future<void> startTracking(String deliveryId) async {
    try {
      await _client
          .from('deliveries')
          .update({'is_tracking_active': true}).eq('id', deliveryId);
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
          .update({'is_tracking_active': false}).eq('id', deliveryId);
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

  /// Updates scheduled delivery time (start and optional end for time range).
  Future<Delivery?> updateScheduledRange(
    String deliveryId, {
    required DateTime? scheduledAt,
    DateTime? scheduledEndAt,
  }) async {
    try {
      final updates = <String, dynamic>{
        'scheduled_at': scheduledAt?.toIso8601String(),
        'scheduled_end_at': scheduledEndAt?.toIso8601String(),
      };
      final response = await _client
          .from('deliveries')
          .update(updates)
          .eq('id', deliveryId)
          .select()
          .single();
      _logger.i('DeliveryService: updateScheduledRange $deliveryId');
      return Delivery.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: updateScheduledRange failed', error: e);
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
  Future<Delivery?> setProblemMessage(
      String deliveryId, String? message) async {
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

  /// Fetches past deliveries for the current driver with their recipients.
  /// Ordered by created_at DESC. Used for the delivery history screen.
  Future<List<DeliveryWithRecipients>> getPastDeliveries(
      {int limit = 50}) async {
    final userId = _userId;
    if (userId == null) return [];

    try {
      final response = await _client
          .from('deliveries')
          .select(
              '*, delivery_recipients!delivery_recipients_delivery_id_fkey(*)')
          .eq('driver_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      final list = response as List<dynamic>? ?? [];
      return list.map((row) {
        final map = Map<String, dynamic>.from(row as Map<String, dynamic>);
        final recipientsData = map.remove('delivery_recipients');
        final delivery = Delivery.fromJson(map);
        final recipients = (recipientsData as List<dynamic>?)
                ?.map((r) =>
                    DeliveryRecipient.fromJson(r as Map<String, dynamic>))
                .toList() ??
            [];
        recipients.sort((a, b) {
          final order = a.sortOrder.compareTo(b.sortOrder);
          if (order != 0) return order;
          if (a.scheduledAt == null && b.scheduledAt == null) return 0;
          if (a.scheduledAt == null) return 1;
          if (b.scheduledAt == null) return -1;
          return a.scheduledAt!.compareTo(b.scheduledAt!);
        });
        return DeliveryWithRecipients(
            delivery: delivery, recipients: recipients);
      }).toList();
    } catch (e) {
      _logger.e('DeliveryService: getPastDeliveries failed', error: e);
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
      return list
          .map((e) => DeliveryRecipient.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      _logger.e('DeliveryService: getRecipients failed', error: e);
      rethrow;
    }
  }

  /// Sets the recipient the driver is currently driving to. Pass null to revert to pending.
  Future<void> setCurrentRecipient(String deliveryId,
      {String? recipientId}) async {
    try {
      await _client.from('deliveries').update({
        'current_recipient_id': recipientId,
      }).eq('id', deliveryId);
      _logger.i(
          'DeliveryService: setCurrentRecipient $deliveryId -> $recipientId');
    } catch (e) {
      _logger.e('DeliveryService: setCurrentRecipient failed', error: e);
      rethrow;
    }
  }

  /// Adds a recipient with a unique public_token for per-recipient share links.
  Future<DeliveryRecipient> addRecipient(
    String deliveryId, {
    required String label,
    DateTime? scheduledAt,
    int sortOrder = 0,
    String? address,
    double? latitude,
    double? longitude,
    String? phoneNumber,
  }) async {
    try {
      final publicToken = const Uuid().v4();
      final Map<String, dynamic> insertData = {
        'delivery_id': deliveryId,
        'label': label,
        'sort_order': sortOrder,
        'public_token': publicToken,
      };
      if (scheduledAt != null)
        insertData['scheduled_at'] = scheduledAt.toIso8601String();
      if (address != null) insertData['address'] = address;
      if (latitude != null) insertData['latitude'] = latitude;
      if (longitude != null) insertData['longitude'] = longitude;
      if (phoneNumber != null) insertData['phone_number'] = phoneNumber;
      final response = await _client
          .from('delivery_recipients')
          .insert(insertData)
          .select()
          .single();
      _logger.i('DeliveryService: addRecipient $deliveryId');
      return DeliveryRecipient.fromJson(response);
    } catch (e) {
      _logger.e('DeliveryService: addRecipient failed', error: e);
      rethrow;
    }
  }

  /// Marks a recipient as delivered (sets delivered_at to now) and clears delivery.current_recipient_id.
  Future<DeliveryRecipient?> markRecipientDelivered(String recipientId) async {
    try {
      final existing = await _client
          .from('delivery_recipients')
          .select('delivery_id')
          .eq('id', recipientId)
          .maybeSingle();
      final deliveryId = existing?['delivery_id'] as String?;
      final now = DateTime.now().toUtc().toIso8601String();
      final response = await _client
          .from('delivery_recipients')
          .update({'delivered_at': now})
          .eq('id', recipientId)
          .select()
          .maybeSingle();
      if (response != null && deliveryId != null) {
        await _client
            .from('deliveries')
            .update({'current_recipient_id': null}).eq('id', deliveryId);
        _logger.i('DeliveryService: markRecipientDelivered $recipientId');
        return DeliveryRecipient.fromJson(response);
      }
      return response != null ? DeliveryRecipient.fromJson(response) : null;
    } catch (e) {
      _logger.e('DeliveryService: markRecipientDelivered failed', error: e);
      rethrow;
    }
  }

  /// Updates a recipient.
  Future<DeliveryRecipient> updateRecipient(
    String recipientId, {
    String? label,
    DateTime? scheduledAt,
    int? sortOrder,
    String? address,
    double? latitude,
    double? longitude,
    String? phoneNumber,
  }) async {
    try {
      final Map<String, dynamic> updates = {};
      if (label != null) updates['label'] = label;
      if (scheduledAt != null) {
        updates['scheduled_at'] = scheduledAt.toIso8601String();
      }
      if (sortOrder != null) updates['sort_order'] = sortOrder;
      if (address != null) updates['address'] = address;
      if (latitude != null) updates['latitude'] = latitude;
      if (longitude != null) updates['longitude'] = longitude;
      if (phoneNumber != null) updates['phone_number'] = phoneNumber;
      if (updates.isEmpty) {
        throw ArgumentError('At least one field must be updated');
      }
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

  /// Reorders recipients by updating sort_order for each id in the given order (index = sort_order).
  Future<void> reorderRecipients(
      String deliveryId, List<String> recipientIdsInOrder) async {
    try {
      for (var i = 0; i < recipientIdsInOrder.length; i++) {
        await _client
            .from('delivery_recipients')
            .update({'sort_order': i})
            .eq('id', recipientIdsInOrder[i])
            .eq('delivery_id', deliveryId);
      }
      _logger.i('DeliveryService: reorderRecipients $deliveryId');
    } catch (e) {
      _logger.e('DeliveryService: reorderRecipients failed', error: e);
      rethrow;
    }
  }
}
