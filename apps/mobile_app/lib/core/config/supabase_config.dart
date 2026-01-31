import 'package:supabase_flutter/supabase_flutter.dart' as supabase;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class SupabaseConfig {
  static String get supabaseUrl {
    return dotenv.env['SUPABASE_URL'] ?? 'https://api.lebontemperament.com';
  }

  static String get supabaseAnonKey {
    return dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  }

  static supabase.SupabaseClient get client =>
      supabase.Supabase.instance.client;

  static Future<void> initialize() async {
    try {
      // Load environment variables
      await dotenv.load(fileName: ".env");
    } catch (e) {
      // If .env file doesn't exist or can't be loaded, continue with defaults
      print('Warning: Could not load .env file: $e');
    }

    final url = supabaseUrl;
    final anonKey = supabaseAnonKey;

    if (url.isEmpty || anonKey.isEmpty) {
      throw Exception(
        'Supabase configuration is incomplete. Please check your .env file or provide valid URL and anon key.',
      );
    }

    await supabase.Supabase.initialize(url: url, anonKey: anonKey);
  }

  static bool get isInitialized =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
