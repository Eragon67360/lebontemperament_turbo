import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/delivery_pass.dart';
import '../../data/delivery_pass_service.dart';

/// The delivery service; tests override it with fakes.
final deliveryServiceProvider = Provider<DeliveryPassService>(
  (ref) => DeliveryPassService.production(),
);

/// The passes on this phone. Invalidate it after a redeem or a forget.
final deliveryPassesProvider = FutureProvider<List<DeliveryPass>>(
  (ref) => ref.watch(deliveryServiceProvider).passes(),
);
