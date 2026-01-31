import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';
import '../models/rehearsal.dart';
import 'storage_service.dart';

class RehearsalsService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final StorageService _storageService;
  final Logger _logger = Logger();

  RehearsalsService({StorageService? storageService})
    : _storageService = storageService ?? StorageService(logger: Logger());

  Future<List<Rehearsal>> getRehearsals() async {
    try {
      final response = await _supabase
          .from('rehearsals')
          .select()
          .order('date', ascending: true);

      final rehearsals = response
          .map<Rehearsal>((json) => Rehearsal.fromJson(json))
          .toList();

      // Save to local storage for caching
      await _storageService.saveRehearsals(rehearsals);
      _logger.i('Saved ${rehearsals.length} rehearsals to local storage');

      return rehearsals;
    } catch (e) {
      _logger.w('Failed to fetch rehearsals from server: $e');
      _logger.i('Attempting to load rehearsals from local storage...');

      // Fallback to local storage
      final cachedRehearsals = _storageService.getRehearsals();
      _logger.i(
        'Loaded ${cachedRehearsals.length} rehearsals from local storage',
      );

      return cachedRehearsals;
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

  Future<List<Rehearsal>> getRehearsalsByGroupType(GroupType groupType) async {
    try {
      final response = await _supabase
          .from('rehearsals')
          .select()
          .eq('group_type', groupType.name)
          .order('date', ascending: true);

      final rehearsals = response
          .map<Rehearsal>((json) => Rehearsal.fromJson(json))
          .toList();

      // Save to local storage for caching
      await _storageService.saveRehearsals(rehearsals);
      _logger.i(
        'Saved ${rehearsals.length} rehearsals for group ${groupType.name} to local storage',
      );

      return rehearsals;
    } catch (e) {
      _logger.w('Failed to fetch rehearsals by group from server: $e');
      _logger.i('Attempting to load rehearsals from local storage...');

      // Fallback to local storage - filter by group type
      final cachedRehearsals = _storageService.getRehearsals();
      final filteredRehearsals = cachedRehearsals
          .where((rehearsal) => rehearsal.groupType == groupType)
          .toList();
      _logger.i(
        'Loaded ${filteredRehearsals.length} rehearsals for group ${groupType.name} from local storage',
      );

      return filteredRehearsals;
    }
  }
}
