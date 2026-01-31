import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import '../models/event.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';
import '../services/events_service.dart';
import '../services/concerts_service.dart';
import '../services/rehearsals_service.dart';
import '../services/storage_service.dart';
import 'realtime_notifications_provider.dart';

// Storage service provider
final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService(logger: Logger());
});

// Storage initialization provider
final storageInitializationProvider = FutureProvider<void>((ref) async {
  final storageService = ref.watch(storageServiceProvider);
  await storageService.initialize();
});

// Services providers
final eventsServiceProvider = Provider<EventsService>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return EventsService(storageService: storageService);
});

final concertsServiceProvider = Provider<ConcertsService>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return ConcertsService(storageService: storageService);
});

final rehearsalsServiceProvider = Provider<RehearsalsService>((ref) {
  final storageService = ref.watch(storageServiceProvider);
  return RehearsalsService(storageService: storageService);
});

// Refresh trigger provider for real-time updates
final refreshTriggerProvider = StateProvider<int>((ref) => 0);

// Events providers
final eventsProvider = FutureProvider<List<Event>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getEvents();
});

final publicEventsProvider = FutureProvider<List<Event>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getPublicEvents();
});

final eventProvider = FutureProvider.family<Event?, String>((
  ref,
  eventId,
) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getEventById(eventId);
});

// Concerts providers
final concertsProvider = FutureProvider<List<Concert>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final concertsService = ref.watch(concertsServiceProvider);
  return await concertsService.getConcerts();
});

final concertProvider = FutureProvider.family<Concert?, String>((
  ref,
  concertId,
) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final concertsService = ref.watch(concertsServiceProvider);
  return await concertsService.getConcertById(concertId);
});

// Rehearsals providers
final rehearsalsProvider = FutureProvider<List<Rehearsal>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final rehearsalsService = ref.watch(rehearsalsServiceProvider);
  return await rehearsalsService.getRehearsals();
});

final rehearsalProvider = FutureProvider.family<Rehearsal?, String>((
  ref,
  rehearsalId,
) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  final rehearsalsService = ref.watch(rehearsalsServiceProvider);
  return await rehearsalsService.getRehearsalById(rehearsalId);
});

final rehearsalsByGroupProvider =
    FutureProvider.family<List<Rehearsal>, GroupType>((ref, groupType) async {
      // Ensure storage is initialized
      await ref.watch(storageInitializationProvider.future);

      final rehearsalsService = ref.watch(rehearsalsServiceProvider);
      return await rehearsalsService.getRehearsalsByGroupType(groupType);
    });

// Real-time providers that automatically refresh when changes are detected
final realtimeEventsProvider = FutureProvider<List<Event>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  // Watch the realtime notifications controller to trigger refreshes
  ref.watch(realtimeNotificationsControllerProvider);
  // Watch the refresh trigger to force refresh when new data is received
  ref.watch(refreshTriggerProvider);

  final eventsService = ref.watch(eventsServiceProvider);
  return await eventsService.getEvents();
});

final realtimeConcertsProvider = FutureProvider<List<Concert>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  // Watch the realtime notifications controller to trigger refreshes
  ref.watch(realtimeNotificationsControllerProvider);
  // Watch the refresh trigger to force refresh when new data is received
  ref.watch(refreshTriggerProvider);

  final concertsService = ref.watch(concertsServiceProvider);
  return await concertsService.getConcerts();
});

final realtimeRehearsalsProvider = FutureProvider<List<Rehearsal>>((ref) async {
  // Ensure storage is initialized
  await ref.watch(storageInitializationProvider.future);

  // Watch the realtime notifications controller to trigger refreshes
  ref.watch(realtimeNotificationsControllerProvider);
  // Watch the refresh trigger to force refresh when new data is received
  ref.watch(refreshTriggerProvider);

  final rehearsalsService = ref.watch(rehearsalsServiceProvider);
  return await rehearsalsService.getRehearsals();
});
