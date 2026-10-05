import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/concert.dart';
import '../models/list_result.dart';
import 'storage_service.dart';
import '../../core/utils/parse_rows.dart';

class ConcertsService {
  final StorageService _storageService;
  final Future<List<Map<String, dynamic>>> Function() _fetchRows;
  final Logger _logger;

  /// [fetchRows] replaces the Supabase query in tests.
  ConcertsService({
    StorageService? storageService,
    Future<List<Map<String, dynamic>>> Function()? fetchRows,
    Logger? logger,
  }) : _storageService = storageService ?? StorageService(logger: Logger()),
       _fetchRows = fetchRows ?? _fetchFromSupabase,
       _logger = logger ?? Logger();

  static SupabaseClient get _supabase => Supabase.instance.client;

  static Future<List<Map<String, dynamic>>> _fetchFromSupabase() {
    return _supabase.from('concerts').select().order('date', ascending: true);
  }

  /// Every concert, fresh from the server or, when it cannot be reached,
  /// from the local cache (the result says which). Never throws.
  Future<ListResult<Concert>> getConcerts() async {
    try {
      final response = await _fetchRows();
      final concerts = parseRows(
        response,
        Concert.fromJson,
        onSkip: (e, row) => _logger.w('Skipped concert ${row['id']}: $e'),
      );

      await _storageService.saveConcerts(concerts);
      _logger.i('Saved ${concerts.length} concerts to local storage');

      return ListResult.fresh(concerts);
    } catch (e) {
      _logger.w('Failed to fetch concerts from server: $e');

      final cachedConcerts = _storageService.getConcerts();
      _logger.i('Loaded ${cachedConcerts.length} concerts from local storage');

      return ListResult.cached(cachedConcerts, error: e);
    }
  }

  Future<Concert?> getConcertById(String id) async {
    try {
      final response = await _supabase
          .from('concerts')
          .select()
          .eq('id', id)
          .single();

      final concert = Concert.fromJson(response);

      // Save to local storage for caching
      await _storageService.saveConcert(concert);
      _logger.i('Saved concert to local storage: ${concert.name}');

      return concert;
    } catch (e) {
      if (e is PostgrestException && e.code == 'PGRST116') {
        return null; // Concert not found
      }

      _logger.w('Failed to fetch concert from server: $e');
      _logger.i('Attempting to load concert from local storage...');

      // Fallback to local storage
      final cachedConcert = _storageService.getConcert(id);
      _logger.i('Loaded concert from local storage: ${cachedConcert?.name}');

      return cachedConcert;
    }
  }
}
