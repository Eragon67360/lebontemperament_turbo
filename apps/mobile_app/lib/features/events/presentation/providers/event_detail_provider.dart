import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/models/event.dart';
import '../../../../data/services/events_service.dart';

final eventDetailProvider = FutureProvider.family<Event?, String>((
  ref,
  eventId,
) async {
  final eventsService = EventsService();
  return await eventsService.getEventById(eventId);
});
