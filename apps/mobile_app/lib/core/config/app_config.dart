import 'package:flutter_dotenv/flutter_dotenv.dart';

/// App-wide config from .env (loaded at startup via SupabaseConfig.initialize).
class AppConfig {
  /// Base URL of the public website (e.g. https://www.lebontemperament.com).
  /// Used to build the client tracking link: $siteUrl/track/{deliveryId}?token=...
  static String get siteUrl {
    return dotenv.env['SITE_URL'] ??
        dotenv.env['WEBSITE_URL'] ??
        'https://www.lebontemperament.com';
  }
}
