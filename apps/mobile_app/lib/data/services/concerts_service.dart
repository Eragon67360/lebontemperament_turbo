import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';
import '../models/concert.dart';
import 'storage_service.dart';

class ConcertsService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final StorageService _storageService;
  final Logger _logger = Logger();

  ConcertsService({StorageService? storageService})
    : _storageService = storageService ?? StorageService(logger: Logger());

  Future<List<Concert>> getConcerts() async {
    try {
      final response = await _supabase
          .from('concerts')
          .select()
          .order('date', ascending: true);

      final concerts = response
          .map<Concert>((json) => Concert.fromJson(json))
          .toList();

      // Save to local storage for caching
      await _storageService.saveConcerts(concerts);
      _logger.i('Saved ${concerts.length} concerts to local storage');

      return concerts;
    } catch (e) {
      _logger.w('Failed to fetch concerts from server: $e');
      _logger.i('Attempting to load concerts from local storage...');

      // Fallback to local storage
      final cachedConcerts = _storageService.getConcerts();
      _logger.i('Loaded ${cachedConcerts.length} concerts from local storage');

      return cachedConcerts;
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
