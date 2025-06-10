import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/event.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';
import '../services/events_service.dart';
import '../services/concerts_service.dart';
import '../services/rehearsals_service.dart';

// Services providers
final eventsServiceProvider = Provider<EventsService>((ref) {
  return EventsService();
});

final concertsServiceProvider = Provider<ConcertsService>((ref) {
  return ConcertsService();
});

final rehearsalsServiceProvider = Provider<RehearsalsService>((ref) {
  return RehearsalsService();
});

// Events providers
final eventsProvider = FutureProvider<List<Event>>((ref) async {
  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getEvents();
});

final publicEventsProvider = FutureProvider<List<Event>>((ref) async {
  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getPublicEvents();
});

final eventProvider = FutureProvider.family<Event?, String>((
  ref,
  eventId,
) async {
  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getEventById(eventId);
});

// Concerts providers
final concertsProvider = FutureProvider<List<Concert>>((ref) async {
  final concertsService = ref.watch(concertsServiceProvider);
  return await concertsService.getConcerts();
});

final concertProvider = FutureProvider.family<Concert?, String>((
  ref,
  concertId,
) async {
  final concertsService = ref.watch(concertsServiceProvider);
  return await concertsService.getConcertById(concertId);
});

// Rehearsals providers
final rehearsalsProvider = FutureProvider<List<Rehearsal>>((ref) async {
  final rehearsalsService = ref.watch(rehearsalsServiceProvider);
  return await rehearsalsService.getRehearsals();
});

final rehearsalProvider = FutureProvider.family<Rehearsal?, String>((
  ref,
  rehearsalId,
) async {
  final rehearsalsService = ref.watch(rehearsalsServiceProvider);
  return await rehearsalsService.getRehearsalById(rehearsalId);
});

final rehearsalsByGroupProvider =
    FutureProvider.family<List<Rehearsal>, GroupType>((ref, groupType) async {
      final rehearsalsService = ref.watch(rehearsalsServiceProvider);
      return await rehearsalsService.getRehearsalsByGroupType(groupType);
    });
