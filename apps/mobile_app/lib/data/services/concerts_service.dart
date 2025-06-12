import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/concert.dart';

class ConcertsService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<Concert>> getConcerts() async {
    try {
      final response = await _supabase
          .from('concerts')
          .select()
          .order('date', ascending: true);

      return response.map<Concert>((json) => Concert.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des concerts: $e');
    }
  }

  Future<Concert?> getConcertById(String id) async {
    try {
      final response = await _supabase
          .from('concerts')
          .select()
          .eq('id', id)
          .single();

      return Concert.fromJson(response);
    } catch (e) {
      if (e is PostgrestException && e.code == 'PGRST116') {
        return null; // Concert not found
      }
      throw Exception('Erreur lors de la récupération du concert: $e');
    }
  }
}
