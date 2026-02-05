import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import '../../core/utils/date_utils.dart' as app_date_utils;
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

// Upcoming-only list providers (no past events/concerts/rehearsals)
final upcomingEventsProvider = FutureProvider<List<Event>>((ref) async {
  final events = await ref.watch(realtimeEventsProvider.future);
  return events.where((e) {
    return app_date_utils.isEventUpcoming(
      dateFrom: e.dateFrom,
      dateTo: e.dateTo,
      time: e.time,
    );
  }).toList();
});

final upcomingConcertsProvider = FutureProvider<List<Concert>>((ref) async {
  final concerts = await ref.watch(realtimeConcertsProvider.future);
  return concerts.where((c) {
    return app_date_utils.isConcertUpcoming(date: c.date, time: c.time);
  }).toList();
});

final upcomingRehearsalsProvider = FutureProvider<List<Rehearsal>>((ref) async {
  final rehearsals = await ref.watch(realtimeRehearsalsProvider.future);
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);

  final upcoming = rehearsals.where((r) {
    if (r.date == null) return false;
    final rehearsalDate = DateTime.tryParse(r.date!);
    return rehearsalDate != null && !rehearsalDate.isBefore(today);
  }).toList();

  // Sort by date, then by start time to ensure correct order
  upcoming.sort((a, b) {
    final dateA = DateTime.parse(a.date!);
    final dateB = DateTime.parse(b.date!);
    final dateComparison = dateA.compareTo(dateB);
    if (dateComparison != 0) return dateComparison;

    // If dates are the same, sort by start time
    final timeA = a.startTime ?? '00:00';
    final timeB = b.startTime ?? '00:00';
    return timeA.compareTo(timeB);
  });

  return upcoming;
});

// --- NEW: Providers specifically for the Home Screen ---

/// Provides the next 2 upcoming rehearsals for the home screen UI.
/// Handles loading/error states gracefully by returning an empty list.
final homeUpcomingRehearsalsProvider = Provider<List<Rehearsal>>((ref) {
  final asyncRehearsals = ref.watch(upcomingRehearsalsProvider);
  return asyncRehearsals.when(
    data: (rehearsals) => rehearsals.take(2).toList(),
    loading: () => [],
    error: (_, __) => [],
  );
});

/// Provides the next 2 upcoming concerts for the home screen UI.
/// Handles loading/error states gracefully by returning an empty list.
final homeUpcomingConcertsProvider = Provider<List<Concert>>((ref) {
  final asyncConcerts = ref.watch(upcomingConcertsProvider);
  // We need to sort the concerts here since your original provider doesn't.
  return asyncConcerts.when(
    data: (concerts) {
      // Create a mutable copy to sort
      final sortedConcerts = List<Concert>.from(concerts);
      sortedConcerts.sort((a, b) {
        final dateA = DateTime.parse(a.date);
        final dateB = DateTime.parse(b.date);
        final dateComparison = dateA.compareTo(dateB);
        if (dateComparison != 0) return dateComparison;
        return a.time.compareTo(b.time);
      });
      return sortedConcerts.take(2).toList();
    },
    loading: () => [],
    error: (_, __) => [],
  );
});

// --- NEW: Helper function for formatting dates ---
String formatDate(String dateString) {
  // Initialize locale data for French if not already done
  initializeDateFormatting('fr_FR', null);
  final date = DateTime.tryParse(dateString);
  if (date == null) return 'Date invalide';
  // Format: "Mar. 25 juin"
  return DateFormat('EEE d MMM', 'fr_FR').format(date);
}

/// Converts "HH:MM:SS" or "HH:MM" to French format "HHhMM" (e.g. "20h30")
String formatTime(String? time) {
  if (time == null || time.isEmpty) return '';
  try {
    final parts = time.split(':');
    if (parts.length >= 2) return '${parts[0]}h${parts[1]}';
  } catch (_) {}
  return time;
}
