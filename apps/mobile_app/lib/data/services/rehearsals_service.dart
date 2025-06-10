import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/rehearsal.dart';

class RehearsalsService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<Rehearsal>> getRehearsals() async {
    try {
      final response = await _supabase
          .from('rehearsals')
          .select()
          .order('date', ascending: true);

      return response
          .map<Rehearsal>((json) => Rehearsal.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des répétitions: $e');
    }
  }

  Future<Rehearsal?> getRehearsalById(String id) async {
    try {
      final response = await _supabase
          .from('rehearsals')
          .select()
          .eq('id', id)
          .single();

      return Rehearsal.fromJson(response);
    } catch (e) {
      if (e is PostgrestException && e.code == 'PGRST116') {
        return null; // Rehearsal not found
      }
      throw Exception('Erreur lors de la récupération de la répétition: $e');
    }
  }

  Future<List<Rehearsal>> getRehearsalsByGroupType(GroupType groupType) async {
    try {
      final response = await _supabase
          .from('rehearsals')
          .select()
          .eq('group_type', groupType.name)
          .order('date', ascending: true);

      return response
          .map<Rehearsal>((json) => Rehearsal.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception(
        'Erreur lors de la récupération des répétitions par groupe: $e',
      );
    }
  }
}
