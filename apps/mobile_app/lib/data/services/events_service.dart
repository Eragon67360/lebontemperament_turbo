import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/event.dart';
import '../models/list_result.dart';
import 'storage_service.dart';
import '../../core/utils/parse_rows.dart';

class EventsService {
  final StorageService _storageService;
  final Future<List<Map<String, dynamic>>> Function() _fetchRows;
  final Logger _logger;

  /// [fetchRows] replaces the Supabase query in tests.
  EventsService({
    StorageService? storageService,
    Future<List<Map<String, dynamic>>> Function()? fetchRows,
    Logger? logger,
  }) : _storageService = storageService ?? StorageService(logger: Logger()),
       _fetchRows = fetchRows ?? _fetchFromSupabase,
       _logger = logger ?? Logger();

  static SupabaseClient get _supabase => Supabase.instance.client;

  static Future<List<Map<String, dynamic>>> _fetchFromSupabase() {
    return _supabase
        .from('events')
        .select()
        .order('date_from', ascending: true);
  }

  /// Every event, fresh from the server or, when it cannot be reached, from
  /// the local cache (the result says which). Never throws.
  Future<ListResult<Event>> getEvents() async {
    try {
      final response = await _fetchRows();
      final events = parseRows(
        response,
        Event.fromJson,
        onSkip: (e, row) => _logger.w('Skipped event ${row['id']}: $e'),
      );

      await _storageService.saveEvents(events);
      _logger.i('Saved ${events.length} events to local storage');

      return ListResult.fresh(events);
    } catch (e) {
      _logger.w('Failed to fetch events from server: $e');

      final cachedEvents = _storageService.getEvents();
      _logger.i('Loaded ${cachedEvents.length} events from local storage');

      return ListResult.cached(cachedEvents, error: e);
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
}
