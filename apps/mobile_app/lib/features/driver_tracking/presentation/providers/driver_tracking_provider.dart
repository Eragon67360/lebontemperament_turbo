import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:logger/logger.dart';

import '../../../../data/models/delivery.dart';
import '../../../../data/models/delivery_recipient.dart';
import '../../../../data/services/delivery_service.dart';

/// Current position (lat, lng) for display.
class TrackingPosition {
  final double lat;
  final double lng;
  final double? accuracyMeters;

  const TrackingPosition({
    required this.lat,
    required this.lng,
    this.accuracyMeters,
  });
}

/// State for the driver tracking screen.
class DriverTrackingState {
  final Delivery? delivery;
  final List<DeliveryRecipient> recipients;
  final bool isTracking;
  final TrackingPosition? position;
  final String? error;
  final bool isLoading;

  const DriverTrackingState({
    this.delivery,
    this.recipients = const [],
    this.isTracking = false,
    this.position,
    this.error,
    this.isLoading = false,
  });

  DriverTrackingState copyWith({
    Delivery? delivery,
    List<DeliveryRecipient>? recipients,
    bool? isTracking,
    TrackingPosition? position,
    String? error,
    bool? isLoading,
  }) {
    return DriverTrackingState(
      delivery: delivery ?? this.delivery,
      recipients: recipients ?? this.recipients,
      isTracking: isTracking ?? this.isTracking,
      position: position ?? this.position,
      error: error,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

final deliveryServiceProvider = Provider<DeliveryService>((ref) {
  return DeliveryService();
});

final driverTrackingProvider =
    StateNotifierProvider<DriverTrackingNotifier, DriverTrackingState>((ref) {
  final service = ref.watch(deliveryServiceProvider);
  return DriverTrackingNotifier(service);
});

class DriverTrackingNotifier extends StateNotifier<DriverTrackingState> {
  final DeliveryService _service;
  final Logger _logger = Logger();

  StreamSubscription<Position>? _positionSubscription;
  Timer? _backupTimer;

  DriverTrackingNotifier(this._service) : super(const DriverTrackingState());

  /// Load or create delivery. Call when screen opens.
  Future<void> loadDelivery() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final delivery = await _service.getOrCreateDelivery();
      List<DeliveryRecipient> recipients = const [];
      if (delivery != null) {
        try {
          recipients = await _service.getRecipients(delivery.id);
        } catch (_) {}
      }
      state = state.copyWith(
        delivery: delivery,
        recipients: recipients,
        isLoading: false,
        error: null,
        isTracking: delivery?.isTrackingActive ?? false,
        position: delivery != null &&
                delivery.latitude != null &&
                delivery.longitude != null
            ? TrackingPosition(
                lat: delivery.latitude!,
                lng: delivery.longitude!,
              )
            : null,
      );
    } catch (e) {
      _logger.e('DriverTrackingNotifier loadDelivery', error: e);
      state = state.copyWith(
        isLoading: false,
        error: 'Erreur lors du chargement de la livraison.',
      );
    }
  }

  /// Refresh recipients list for current delivery.
  Future<void> loadRecipients() async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final recipients = await _service.getRecipients(delivery.id);
      state = state.copyWith(recipients: recipients);
    } catch (e) {
      _logger.e('DriverTrackingNotifier loadRecipients', error: e);
    }
  }

  /// Update scheduled delivery time (start and optional end for time range).
  Future<void> updateScheduledRange({
    required DateTime? scheduledAt,
    DateTime? scheduledEndAt,
  }) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.updateScheduledRange(
        delivery.id,
        scheduledAt: scheduledAt,
        scheduledEndAt: scheduledEndAt,
      );
      if (updated != null) state = state.copyWith(delivery: updated, error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier updateScheduledRange', error: e);
      state = state.copyWith(error: 'Erreur lors de la mise à jour de l\'heure.');
    }
  }

  /// Set delay flag and optional minutes.
  Future<void> setDelay({required bool isDelayed, int? delayMinutes}) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.setDelay(
        delivery.id,
        isDelayed: isDelayed,
        delayMinutes: delayMinutes,
      );
      if (updated != null) state = state.copyWith(delivery: updated, error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier setDelay', error: e);
      state = state.copyWith(error: 'Erreur lors de la mise à jour du retard.');
    }
  }

  /// Set or clear problem message.
  Future<void> setProblemMessage(String? message) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.setProblemMessage(delivery.id, message);
      if (updated != null) state = state.copyWith(delivery: updated, error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier setProblemMessage', error: e);
      state = state.copyWith(error: 'Erreur lors de la mise à jour du message.');
    }
  }

  /// Add a recipient.
  Future<void> addRecipient({
    required String label,
    DateTime? scheduledAt,
    String? address,
    double? latitude,
    double? longitude,
  }) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final list = state.recipients;
      final sortOrder = list.isEmpty ? 0 : (list.map((r) => r.sortOrder).reduce((a, b) => a > b ? a : b) + 1);
      final added = await _service.addRecipient(
        delivery.id,
        label: label,
        scheduledAt: scheduledAt,
        sortOrder: sortOrder,
        address: address,
        latitude: latitude,
        longitude: longitude,
      );
      state = state.copyWith(recipients: [...list, added], error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier addRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors de l\'ajout de la personne.');
    }
  }

  /// Start driving to a recipient (sets current_recipient_id).
  Future<void> startDrivingToRecipient(String recipientId) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      await _service.setCurrentRecipient(delivery.id, recipientId: recipientId);
      final updated = await _service.getDelivery(delivery.id);
      if (updated != null) {
        state = state.copyWith(delivery: updated, error: null);
      }
    } catch (e) {
      _logger.e('DriverTrackingNotifier startDrivingToRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors du démarrage de la livraison.');
    }
  }

  /// Revert current recipient to pending (clears current_recipient_id).
  Future<void> revertToPending() async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      await _service.setCurrentRecipient(delivery.id, recipientId: null);
      final updated = await _service.getDelivery(delivery.id);
      if (updated != null) {
        state = state.copyWith(delivery: updated, error: null);
      }
    } catch (e) {
      _logger.e('DriverTrackingNotifier revertToPending', error: e);
      state = state.copyWith(error: 'Erreur lors du report en attente.');
    }
  }

  /// Reorder recipients (updates sort_order for each).
  Future<void> reorderRecipients(List<String> recipientIdsInOrder) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      await _service.reorderRecipients(delivery.id, recipientIdsInOrder);
      await loadRecipients();
      state = state.copyWith(error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier reorderRecipients', error: e);
      state = state.copyWith(error: 'Erreur lors du réordonnancement.');
    }
  }

  /// Update a recipient.
  Future<void> updateRecipient(
    String recipientId, {
    String? label,
    DateTime? scheduledAt,
    int? sortOrder,
    String? address,
    double? latitude,
    double? longitude,
  }) async {
    try {
      await _service.updateRecipient(
        recipientId,
        label: label,
        scheduledAt: scheduledAt,
        sortOrder: sortOrder,
        address: address,
        latitude: latitude,
        longitude: longitude,
      );
      await loadRecipients();
      state = state.copyWith(error: null);
    } catch (e) {
      _logger.e('DriverTrackingNotifier updateRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors de la modification.');
    }
  }

  /// Delete a recipient.
  Future<void> deleteRecipient(String recipientId) async {
    try {
      await _service.deleteRecipient(recipientId);
      state = state.copyWith(
        recipients: state.recipients.where((r) => r.id != recipientId).toList(),
        error: null,
      );
    } catch (e) {
      _logger.e('DriverTrackingNotifier deleteRecipient', error: e);
      state = state.copyWith(error: 'Erreur lors de la suppression.');
    }
  }

  /// Mark a recipient as delivered (also clears current_recipient_id on delivery).
  Future<void> markRecipientDelivered(String recipientId) async {
    final delivery = state.delivery;
    if (delivery == null) return;
    try {
      final updated = await _service.markRecipientDelivered(recipientId);
      if (updated != null) {
        await loadRecipients();
        final refreshedDelivery = await _service.getDelivery(delivery.id);
        state = state.copyWith(
          delivery: refreshedDelivery ?? delivery,
          error: null,
        );
      }
    } catch (e) {
      _logger.e('DriverTrackingNotifier markRecipientDelivered', error: e);
      state = state.copyWith(
          error: 'Erreur lors du marquage comme livré.');
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Start tracking: request permission, start DB tracking, then position stream + backup timer.
  Future<void> startTracking() async {
    final delivery = state.delivery;
    if (delivery == null) {
      state = state.copyWith(
          error: 'Aucune livraison. Rechargez la page.');
      return;
    }

    state = state.copyWith(error: null);

    // Check / request location permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      state = state.copyWith(
        error:
            'Permission de géolocalisation refusée. Autorisez l\'accès dans les paramètres.',
      );
      return;
    }

    try {
      await _service.startTracking(delivery.id);
    } catch (e) {
      _logger.e('DriverTrackingNotifier startTracking DB', error: e);
      state = state.copyWith(
          error: 'Erreur lors du démarrage du suivi.');
      return;
    }

    state = state.copyWith(isTracking: true);

    final deliveryId = delivery.id;

    Future<void> onPosition(Position position) async {
      state = state.copyWith(
        position: TrackingPosition(
          lat: position.latitude,
          lng: position.longitude,
          accuracyMeters: position.accuracy,
        ),
      );
      try {
        await _service.updatePosition(
          deliveryId,
          position.latitude,
          position.longitude,
        );
      } catch (e) {
        _logger.e('DriverTrackingNotifier updatePosition failed', error: e);
      }
    }

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen(
      onPosition,
      onError: (e) {
        _logger.w('DriverTrackingNotifier position stream error', error: e);
      },
    );

    // Fire one position update immediately, then every 10 seconds (stream may not emit if device hasn't moved 10m)
    void sendBackupPosition() async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 15),
        );
        await onPosition(pos);
      } catch (e) {
        _logger.w('DriverTrackingNotifier backup getCurrentPosition failed', error: e);
      }
    }

    sendBackupPosition();
    _backupTimer = Timer.periodic(const Duration(seconds: 10), (_) => sendBackupPosition());

    _logger.i('DriverTrackingNotifier: tracking started for $deliveryId');
  }

  /// Stop tracking: cancel stream and timer, update DB.
  Future<void> stopTracking() async {
    await _positionSubscription?.cancel();
    _positionSubscription = null;
    _backupTimer?.cancel();
    _backupTimer = null;

    final delivery = state.delivery;
    if (delivery != null) {
      try {
        await _service.stopTracking(delivery.id);
      } catch (e) {
        _logger.e('DriverTrackingNotifier stopTracking DB', error: e);
      }
    }

    state = state.copyWith(isTracking: false);
    _logger.i('DriverTrackingNotifier: tracking stopped');
  }

  /// Reset token and extend expiry. Returns updated delivery or null.
  Future<Delivery?> resetToken() async {
    final delivery = state.delivery;
    if (delivery == null) return null;
    try {
      final updated = await _service.resetToken(delivery.id);
      if (updated != null) {
        state = state.copyWith(delivery: updated, error: null);
      }
      return updated;
    } catch (e) {
      _logger.e('DriverTrackingNotifier resetToken', error: e);
      state = state.copyWith(
          error: 'Erreur lors de la réinitialisation du token.');
      return null;
    }
  }
}
