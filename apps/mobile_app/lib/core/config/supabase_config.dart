import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

class SupabaseConfig {
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://api.lebontemperament.com',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZza2x1bnhwbGJidHpndXJ3cW1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NzcxNTEsImV4cCI6MjA1MzE1MzE1MX0.svdit6e1Lt2KG35S9S9-BNS67qvOwpJEiGYS9uBmVIU',
  );

  static supabase.SupabaseClient get client =>
      supabase.Supabase.instance.client;

  static Future<void> initialize() async {
    await supabase.Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static bool get isInitialized => supabaseUrl != 'YOUR_SUPABASE_URL';
}
