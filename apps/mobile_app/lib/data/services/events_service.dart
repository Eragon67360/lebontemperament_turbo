import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/event.dart';
import '../models/event_document.dart';
import '../models/list_result.dart';
import 'storage_service.dart';
import '../../core/utils/parse_rows.dart';

/// The rows of `event_documents`: every one the member may read when
/// [eventId] is null, else that event's.
typedef FetchDocumentRows =
    Future<List<Map<String, dynamic>>> Function(String? eventId);

/// The columns the app reads from `event_documents` (as the website does).
const kEventDocumentColumns =
    'id, event_id, label, file_name, storage_key, mime_type, size_bytes, '
    'sort_order, created_at';

/// The bucket event files live in (public).
const kEventDocumentsBucket = 'site-media';

/// Where to open [document]: its public URL in `site-media`, as a download
/// under its clean name for Word and Excel files.
String eventDocumentUrl(EventDocument document) {
  final publicUrl = Supabase.instance.client.storage
      .from(kEventDocumentsBucket)
      .getPublicUrl(document.storageKey);
  return document.urlFrom(publicUrl);
}

class EventsService {
  final StorageService _storageService;
  final Future<List<Map<String, dynamic>>> Function() _fetchRows;
  final Future<Map<String, dynamic>> Function(String id) _fetchRow;
  final FetchDocumentRows _fetchDocumentRows;
  final Logger _logger;

  /// [fetchRows], [fetchRow] and [fetchDocumentRows] replace the Supabase
  /// queries in tests.
  EventsService({
    StorageService? storageService,
    Future<List<Map<String, dynamic>>> Function()? fetchRows,
    Future<Map<String, dynamic>> Function(String id)? fetchRow,
    FetchDocumentRows? fetchDocumentRows,
    Logger? logger,
  }) : _storageService = storageService ?? StorageService(logger: Logger()),
       _fetchRows = fetchRows ?? _fetchFromSupabase,
       _fetchRow = fetchRow ?? _fetchOneFromSupabase,
       _fetchDocumentRows = fetchDocumentRows ?? _fetchDocumentsFromSupabase,
       _logger = logger ?? Logger();

  static SupabaseClient get _supabase => Supabase.instance.client;

  static Future<List<Map<String, dynamic>>> _fetchFromSupabase() {
    return _supabase
        .from('events')
        .select()
        .order('date_from', ascending: true);
  }

  static Future<Map<String, dynamic>> _fetchOneFromSupabase(String id) {
    return _supabase.from('events').select().eq('id', id).single();
  }

  static Future<List<Map<String, dynamic>>> _fetchDocumentsFromSupabase(
    String? eventId,
  ) {
    final query = _supabase
        .from('event_documents')
        .select(kEventDocumentColumns);
    final filtered = eventId == null ? query : query.eq('event_id', eventId);
    return filtered
        .order('sort_order', ascending: true)
        .order('created_at', ascending: true);
  }

  /// The files of the events, by event id, in display order. Row-level
  /// security already hides the files of events the member may not see.
  /// Never throws: the table may not exist yet on the server the app talks
  /// to, and a failure here must not cost the events themselves, so any
  /// error means no files.
  Future<Map<String, List<EventDocument>>> _documentsByEvent({
    String? eventId,
  }) async {
    try {
      final rows = await _fetchDocumentRows(eventId);
      final documents = parseRows(
        rows,
        EventDocument.fromJson,
        onSkip: (e, row) =>
            _logger.w('Skipped event document ${row['id']}: $e'),
      );
      final byEvent = <String, List<EventDocument>>{};
      for (final document in sortEventDocuments(documents)) {
        byEvent.putIfAbsent(document.eventId, () => []).add(document);
      }
      return byEvent;
    } catch (e) {
      _logger.w('Event documents unavailable, showing none: $e');
      return const {};
    }
  }

  List<Event> _withDocuments(
    List<Event> events,
    Map<String, List<EventDocument>> byEvent,
  ) => [
    for (final event in events)
      event.copyWith(documents: byEvent[event.id] ?? const []),
  ];

  /// Every event, fresh from the server or, when it cannot be reached, from
  /// the local cache (the result says which). Never throws.
  Future<ListResult<Event>> getEvents() async {
    try {
      // Both queries at once; the files one never throws.
      final documents = _documentsByEvent();
      final response = await _fetchRows();
      final parsed = parseRows(
        response,
        Event.fromJson,
        onSkip: (e, row) => _logger.w('Skipped event ${row['id']}: $e'),
      );
      final events = _withDocuments(parsed, await documents);

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
      final documents = _documentsByEvent(eventId: id);
      final response = await _fetchRow(id);

      final event = _withDocuments([
        Event.fromJson(response),
      ], await documents).single;

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
