import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/list_result.dart';
import '../models/rehearsal.dart';
import 'storage_service.dart';
import '../../core/utils/parse_rows.dart';

class RehearsalsService {
  final StorageService _storageService;
  final Future<List<Map<String, dynamic>>> Function() _fetchRows;
  final Logger _logger;

  /// [fetchRows] replaces the Supabase query in tests.
  RehearsalsService({
    StorageService? storageService,
    Future<List<Map<String, dynamic>>> Function()? fetchRows,
    Logger? logger,
  }) : _storageService = storageService ?? StorageService(logger: Logger()),
       _fetchRows = fetchRows ?? _fetchFromSupabase,
       _logger = logger ?? Logger();

  static SupabaseClient get _supabase => Supabase.instance.client;

  static Future<List<Map<String, dynamic>>> _fetchFromSupabase() {
    return _supabase.from('rehearsals').select().order('date', ascending: true);
  }

  /// Every rehearsal, fresh from the server or, when it cannot be reached,
  /// from the local cache (the result says which). Never throws.
  Future<ListResult<Rehearsal>> getRehearsals() async {
    try {
      final response = await _fetchRows();
      final rehearsals = parseRows(
        response,
        Rehearsal.fromJson,
        onSkip: (e, row) => _logger.w('Skipped rehearsal ${row['id']}: $e'),
      );

      await _storageService.saveRehearsals(rehearsals);
      _logger.i('Saved ${rehearsals.length} rehearsals to local storage');

      return ListResult.fresh(rehearsals);
    } catch (e) {
      _logger.w('Failed to fetch rehearsals from server: $e');

      final cachedRehearsals = _storageService.getRehearsals();
      _logger.i(
        'Loaded ${cachedRehearsals.length} rehearsals from local storage',
      );

      return ListResult.cached(cachedRehearsals, error: e);
    }
  }

  Future<Rehearsal?> getRehearsalById(String id) async {
    try {
      final response = await _supabase
          .from('rehearsals')
          .select()
          .eq('id', id)
          .single();

      final rehearsal = Rehearsal.fromJson(response);

      // Save to local storage for caching
      await _storageService.saveRehearsal(rehearsal);
      _logger.i('Saved rehearsal to local storage: ${rehearsal.name}');

      return rehearsal;
    } catch (e) {
      if (e is PostgrestException && e.code == 'PGRST116') {
        return null; // Rehearsal not found
      }

      _logger.w('Failed to fetch rehearsal from server: $e');
      _logger.i('Attempting to load rehearsal from local storage...');

      // Fallback to local storage
      final cachedRehearsal = _storageService.getRehearsal(id);
      _logger.i(
        'Loaded rehearsal from local storage: ${cachedRehearsal?.name}',
      );

      return cachedRehearsal;
    }
  }
}
