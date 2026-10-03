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
  static String get siteUrl {
    return _env('SITE_URL') ??
        _env('WEBSITE_URL') ??
        'https://www.lebontemperament.com';
  }

  /// Main Drive folder (Accès Drive). Override via DRIVE_FOLDER_MAIN.
  ///
  /// Fallback only: the Partitions screen reads the `drive_folders` table
  /// first (see `DriveFoldersService`).
  static String get driveFolderMain => driveFolderUrl(driveFolderIdMain);

  static String get driveFolderIdMain =>
      _env('DRIVE_FOLDER_MAIN') ?? '1oQGEse5USfg9KhM7dZv7_w6olmk_slaU';

  /// Partitions: folder IDs for the Drive API (file explorer). Fallback only.
  static String get driveFolderIdAdultes =>
      _env('DRIVE_FOLDER_ADULTES') ?? '1VUBWpzqILkYli_E6ecOC47PHg_XgF-PX';
  static String get driveFolderIdJeunes =>
      _env('DRIVE_FOLDER_JEUNES') ?? '18ZukzBIhWotJ9UxpUTdodGBSY1wf0Q81';
  static String get driveFolderIdEnfants =>
      _env('DRIVE_FOLDER_ENFANTS') ?? '1Jcn6pSKBHpOvFXp5j0h6kKcwOBrAIkId';
  static String get driveFolderIdOrchestre =>
      _env('DRIVE_FOLDER_ORCHESTRE') ?? '1t72TgfhowS2WqYDFYLkasqopdUI_FEem';
  static String get driveFolderIdCahier30Ans =>
      _env('DRIVE_FOLDER_CAHIER_30_ANS') ?? '1HJaLRjjkRxwIFiC2FUgN-c-7KoepLKFB';

  /// Partitions: full Drive URLs (for "Accès direct" link). Fallback only.
  static String get driveFolderAdultes => driveFolderUrl(driveFolderIdAdultes);
  static String get driveFolderJeunes => driveFolderUrl(driveFolderIdJeunes);
  static String get driveFolderEnfants => driveFolderUrl(driveFolderIdEnfants);
  static String get driveFolderOrchestre =>
      driveFolderUrl(driveFolderIdOrchestre);
  static String get driveFolderCahier30Ans =>
      driveFolderUrl(driveFolderIdCahier30Ans);

  /// The Partitions folders as the app knew them before the `drive_folders`
  /// table existed, with the table's slugs. Used only when the table can't
  /// be read.
  static List<DriveFolder> get fallbackDriveFolders => [
    DriveFolder(
      slug: kDriveRootSlug,
      label: 'Drive complet',
      folderId: driveFolderIdMain,
    ),
    DriveFolder(
      slug: 'adultes',
      label: 'Adultes',
      folderId: driveFolderIdAdultes,
    ),
    DriveFolder(slug: 'jeunes', label: 'Jeunes', folderId: driveFolderIdJeunes),
    DriveFolder(
      slug: 'enfants',
      label: 'Enfants',
      folderId: driveFolderIdEnfants,
    ),
    DriveFolder(
      slug: 'orchestre',
      label: 'Orchestre',
      folderId: driveFolderIdOrchestre,
    ),
    DriveFolder(
      slug: 'cahier-30-ans',
      label: 'Cahier 30 ans',
      folderId: driveFolderIdCahier30Ans,
    ),
  ];
}
