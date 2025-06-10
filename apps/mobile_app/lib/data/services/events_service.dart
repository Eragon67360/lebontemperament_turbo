import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/event.dart';

class EventsService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<Event>> getEvents() async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .order('date_from', ascending: true);

      return response.map<Event>((json) => Event.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des événements: $e');
    }
  }

  Future<Event?> getEventById(String id) async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .eq('id', id)
          .single();

      return Event.fromJson(response);
    } catch (e) {
      if (e is PostgrestException && e.code == 'PGRST116') {
        return null; // Event not found
      }
      throw Exception('Erreur lors de la récupération de l\'événement: $e');
    }
  }

  Future<List<Event>> getPublicEvents() async {
    try {
      final response = await _supabase
          .from('events')
          .select()
          .eq('is_public', true)
          .order('date_from', ascending: true);

      return response.map<Event>((json) => Event.fromJson(json)).toList();
    } catch (e) {
      throw Exception(
        'Erreur lors de la récupération des événements publics: $e',
      );
    }
  }
}
