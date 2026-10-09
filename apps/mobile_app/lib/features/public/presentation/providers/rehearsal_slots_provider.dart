import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/public_content.dart';
import '../../data/rehearsal_slots_service.dart';

final rehearsalSlotsServiceProvider = Provider<RehearsalSlotsService>(
  (ref) => RehearsalSlotsService(),
);

/// The rehearsal times on « Nous rejoindre ». Never fails: the service
/// answers the built-in [kRehearsalSlots] instead.
final rehearsalSlotsProvider = FutureProvider<List<RehearsalSlot>>(
  (ref) => ref.watch(rehearsalSlotsServiceProvider).getSlots(),
);
