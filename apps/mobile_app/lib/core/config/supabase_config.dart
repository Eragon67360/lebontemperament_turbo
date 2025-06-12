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
    // Load environment variables
    await dotenv.load(fileName: ".env");

    await supabase.Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  static bool get isInitialized =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
