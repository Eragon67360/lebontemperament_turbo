import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';
import '../models/event.dart';
import 'storage_service.dart';

class EventsService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final StorageService _storageService;
  final Logger _logger = Logger();

  EventsService({StorageService? storageService})
    : _storageService = storageService ?? StorageService(logger: Logger());

  Future<List<Event>> getEvents() async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .order('date_from', ascending: true);

      final events = response
          .map<Event>((json) => Event.fromJson(json))
          .toList();

      // Save to local storage for caching
      await _storageService.saveEvents(events);
      _logger.i('Saved ${events.length} events to local storage');

      return events;
    } catch (e) {
      _logger.w('Failed to fetch events from server: $e');
      _logger.i('Attempting to load events from local storage...');

      // Fallback to local storage
      final cachedEvents = _storageService.getEvents();
      _logger.i('Loaded ${cachedEvents.length} events from local storage');

      return cachedEvents;
    }
  }

  Future<Event?> getEventById(String id) async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .eq('id', id)
          .single();

      final event = Event.fromJson(response);

      // Save to local storage for caching
      await _storageService.saveEvent(event);
      _logger.i('Saved event to local storage: ${event.title}');

      return event;
    } catch (e) {
      if (e is PostgrestException && e.code == 'PGRST116') {
        return null; // Event not found
      }

      _logger.w('Failed to fetch event from server: $e');
      _logger.i('Attempting to load event from local storage...');

      // Fallback to local storage
      final cachedEvent = _storageService.getEvent(id);
      _logger.i('Loaded event from local storage: ${cachedEvent?.title}');

      return cachedEvent;
    }
  }

  Future<List<Event>> getPublicEvents() async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .eq('is_public', true)
          .order('date_from', ascending: true);

      final events = response
          .map<Event>((json) => Event.fromJson(json))
          .toList();

      // Save to local storage for caching
      await _storageService.saveEvents(events);
      _logger.i('Saved ${events.length} public events to local storage');

      return events;
    } catch (e) {
      _logger.w('Failed to fetch public events from server: $e');
      _logger.i('Attempting to load public events from local storage...');

      // Fallback to local storage - filter for public events
      final cachedEvents = _storageService.getEvents();
      final publicEvents = cachedEvents
          .where((event) => event.isPublic == true)
          .toList();
      _logger.i(
        'Loaded ${publicEvents.length} public events from local storage',
      );

      return publicEvents;
    }
  }
}
