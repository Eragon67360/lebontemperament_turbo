import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/app_config.dart';
import '../models/drive_folder.dart';

/// Fetches the raw rows of `drive_folders` in display order.
typedef DriveFolderRowsFetcher = Future<List<Map<String, dynamic>>> Function();

/// Reads the Partitions folders from the `drive_folders` table (members can
/// read it with their session; see the website's `/membres/travail`).
///
/// The `.env` folder IDs are only a fallback for when the table can't be
/// read: some of them are last season's folders and the website refuses
/// anything outside the table, so the table is the source of truth.
class DriveFoldersService {
  DriveFoldersService({
    DriveFolderRowsFetcher? fetchRows,
    List<DriveFolder>? fallbackFolders,
    Logger? logger,
  }) : _fetchRows = fetchRows ?? _fetchFromSupabase,
       _fallbackFolders = fallbackFolders,
       _logger = logger ?? Logger();

  final DriveFolderRowsFetcher _fetchRows;
  final List<DriveFolder>? _fallbackFolders;
  final Logger _logger;

  static Future<List<Map<String, dynamic>>> _fetchFromSupabase() async {
    final rows = await Supabase.instance.client
        .from('drive_folders')
        .select('slug, label, folder_id')
        .order('display_order', ascending: true);
    return List<Map<String, dynamic>>.from(rows);
  }

  /// The folders to show. Never throws: on any failure, or when the table has
  /// no usable tab, returns the `.env` fallback (flagged as such).
  Future<DriveFolderCatalog> getCatalog() async {
    try {
      final rows = await _fetchRows();
      final catalog = DriveFolderCatalog.fromRows(rows);
      if (catalog.hasTabs) return catalog;
      _logger.w('drive_folders returned no usable tab, using .env fallback');
    } catch (e) {
      _logger.w('drive_folders read failed, using .env fallback: $e');
    }
    return fallbackCatalog();
  }

  /// The catalog built from `.env` (or the compiled-in defaults).
  DriveFolderCatalog fallbackCatalog() {
    final folders = _fallbackFolders ?? AppConfig.fallbackDriveFolders;
    return DriveFolderCatalog(
      tabs: folders.where((f) => !f.isRoot).toList(),
      root: folders.where((f) => f.isRoot).firstOrNull,
      fromFallback: true,
    );
  }
}
