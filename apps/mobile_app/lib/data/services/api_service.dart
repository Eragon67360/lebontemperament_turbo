import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../models/models.dart';

class ApiService {
  final supabase.SupabaseClient _supabaseClient;
  final Logger _logger;

  ApiService({
    required supabase.SupabaseClient supabaseClient,
    required Logger logger,
  }) : _supabaseClient = supabaseClient,
       _logger = logger;

  // Events
  Future<List<Event>> getEvents() async {
    try {
      final response = await _supabaseClient
          .from('events')
          .select()
          .eq('is_published', true)
          .order('date', ascending: true);

      return (response as List).map((json) => Event.fromJson(json)).toList();
    } catch (e) {
      _logger.e('Error fetching events: $e');
      rethrow;
    }
  }

  Future<Event?> getEvent(String id) async {
    try {
      final response = await _supabaseClient
          .from('events')
          .select()
          .eq('id', id)
          .single();

      return Event.fromJson(response);
    } catch (e) {
      _logger.e('Error fetching event $id: $e');
      return null;
    }
  }

  // Announcements
  Future<List<Announcement>> getAnnouncements() async {
    try {
      final response = await _supabaseClient
          .from('announcements')
          .select()
          .eq('is_published', true)
          .order('published_at', ascending: false);

      return (response as List)
          .map((json) => Announcement.fromJson(json))
          .toList();
    } catch (e) {
      _logger.e('Error fetching announcements: $e');
      rethrow;
    }
  }

  Future<Announcement?> getAnnouncement(String id) async {
    try {
      final response = await _supabaseClient
          .from('announcements')
          .select()
          .eq('id', id)
          .single();

      return Announcement.fromJson(response);
    } catch (e) {
      _logger.e('Error fetching announcement $id: $e');
      return null;
    }
  }

  // TODO: Add real-time subscriptions when needed
  // RealtimeChannel subscribeToEvents(Function(List<Event>) onData) {
  //   // Implementation for real-time events
  // }
}
