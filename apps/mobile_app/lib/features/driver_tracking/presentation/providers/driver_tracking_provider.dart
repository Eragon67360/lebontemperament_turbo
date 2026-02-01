import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:logger/logger.dart';

import '../../../../data/models/delivery.dart';
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
  final bool isTracking;
  final TrackingPosition? position;
  final String? error;
  final bool isLoading;

  const DriverTrackingState({
    this.delivery,
    this.isTracking = false,
    this.position,
    this.error,
    this.isLoading = false,
  });

  DriverTrackingState copyWith({
    Delivery? delivery,
    bool? isTracking,
    TrackingPosition? position,
    String? error,
    bool? isLoading,
  }) {
    return DriverTrackingState(
      delivery: delivery ?? this.delivery,
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
      state = state.copyWith(
        delivery: delivery,
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

    void onPosition(Position position) {
      _service.updatePosition(
        delivery.id,
        position.latitude,
        position.longitude,
      );
      state = state.copyWith(
        position: TrackingPosition(
          lat: position.latitude,
          lng: position.longitude,
          accuracyMeters: position.accuracy,
        ),
      );
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

    _backupTimer = Timer.periodic(const Duration(seconds: 10), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );
        onPosition(pos);
      } catch (_) {}
    });

    _logger.i('DriverTrackingNotifier: tracking started for ${delivery.id}');
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
