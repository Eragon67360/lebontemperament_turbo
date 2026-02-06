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

  static String _driveUrl(String folderId) =>
      'https://drive.google.com/drive/folders/$folderId';

  /// Main Drive folder (Accès Drive). Override via DRIVE_FOLDER_MAIN.
  static String get driveFolderMain => _driveUrl(
      dotenv.env['DRIVE_FOLDER_MAIN'] ?? '1oQGEse5USfg9KhM7dZv7_w6olmk_slaU');

  /// Partitions: folder IDs for the Drive API (file explorer).
  static String get driveFolderIdAdultes =>
      dotenv.env['DRIVE_FOLDER_ADULTES'] ?? '1VUBWpzqILkYli_E6ecOC47PHg_XgF-PX';
  static String get driveFolderIdJeunes =>
      dotenv.env['DRIVE_FOLDER_JEUNES'] ?? '18ZukzBIhWotJ9UxpUTdodGBSY1wf0Q81';
  static String get driveFolderIdEnfants =>
      dotenv.env['DRIVE_FOLDER_ENFANTS'] ?? '1Jcn6pSKBHpOvFXp5j0h6kKcwOBrAIkId';
  static String get driveFolderIdOrchestre =>
      dotenv.env['DRIVE_FOLDER_ORCHESTRE'] ??
      '1t72TgfhowS2WqYDFYLkasqopdUI_FEem';
  static String get driveFolderIdCahier30Ans =>
      dotenv.env['DRIVE_FOLDER_CAHIER_30_ANS'] ??
      '1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB';

  /// Partitions: full Drive URLs (for "Accès direct" link).
  static String get driveFolderAdultes => _driveUrl(driveFolderIdAdultes);
  static String get driveFolderJeunes => _driveUrl(driveFolderIdJeunes);
  static String get driveFolderEnfants => _driveUrl(driveFolderIdEnfants);
  static String get driveFolderOrchestre => _driveUrl(driveFolderIdOrchestre);
  static String get driveFolderCahier30Ans =>
      _driveUrl(driveFolderIdCahier30Ans);
}
