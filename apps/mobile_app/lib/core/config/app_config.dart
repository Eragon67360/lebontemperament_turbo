import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../data/models/drive_folder.dart';

/// App-wide config from .env (loaded at startup via SupabaseConfig.initialize).
class AppConfig {
  /// Reads a `.env` value; null when unset or when `.env` was never loaded
  /// (widget tests, or a build without the asset).
  static String? _env(String key) {
    try {
      final value = dotenv.env[key];
      if (value == null || value.trim().isEmpty) return null;
      return value.trim();
    } catch (_) {
      return null;
    }
  }

  /// Base URL of the public website (e.g. https://www.lebontemperament.com).
  /// Used to build the client tracking link: $siteUrl/track/{deliveryId}?token=...
  /// Never ends with a slash, so `$siteUrl/api/...` stays a valid path.
  static String get siteUrl {
    final url =
        _env('SITE_URL') ??
        _env('WEBSITE_URL') ??
        'https://www.lebontemperament.com';
    return url.replaceAll(RegExp(r'/+$'), '');
  }

  /// Partitions folder IDs from `.env`, used only when the `drive_folders`
  /// table can't be read (see `DriveFoldersService`). No ID is compiled in:
  /// this repository is public and the folders are members-only (#347).
  static String? get driveFolderIdMain => _env('DRIVE_FOLDER_MAIN');
  static String? get driveFolderIdAdultes => _env('DRIVE_FOLDER_ADULTES');
  static String? get driveFolderIdJeunes => _env('DRIVE_FOLDER_JEUNES');
  static String? get driveFolderIdEnfants => _env('DRIVE_FOLDER_ENFANTS');
  static String? get driveFolderIdOrchestre => _env('DRIVE_FOLDER_ORCHESTRE');
  static String? get driveFolderIdCahier30Ans =>
      _env('DRIVE_FOLDER_CAHIER_30_ANS');

  /// The Partitions folders as the app knew them before the `drive_folders`
  /// table existed, with the table's slugs, for those set in `.env`. Used
  /// only when the table can't be read.
  static List<DriveFolder> get fallbackDriveFolders => [
    for (final (slug, label, folderId) in [
      (kDriveRootSlug, 'Drive complet', driveFolderIdMain),
      ('adultes', 'Adultes', driveFolderIdAdultes),
      ('jeunes', 'Jeunes', driveFolderIdJeunes),
      ('enfants', 'Enfants', driveFolderIdEnfants),
      ('orchestre', 'Orchestre', driveFolderIdOrchestre),
      ('cahier-30-ans', 'Cahier 30 ans', driveFolderIdCahier30Ans),
    ])
      if (folderId != null)
        DriveFolder(slug: slug, label: label, folderId: folderId),
  ];
}
