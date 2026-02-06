import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/ca_minute.dart';
import '../../core/config/supabase_config.dart';

class CaService {
  CaService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  SupabaseClient get _client => SupabaseConfig.client;

  Future<List<CaMinute>> getCaMinutes() async {
    try {
      final response = await _client
          .from('cas')
          .select('id, title, date_from, file_url')
          .order('date_from', ascending: false);

      final list = response as List<dynamic>;
      return list
          .whereType<Map<String, dynamic>>()
          .map((json) => CaMinute.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('CaService getCaMinutes error: $e');
      rethrow;
    }
  }
}
