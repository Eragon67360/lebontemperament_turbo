/// Slug of the `drive_folders` row that is the "Accès direct au Drive" link,
/// not a Partitions tab (mirrors `DRIVE_ROOT_SLUG` in `@repo/domain`).
const String kDriveRootSlug = 'racine';

/// Builds the public URL of a Drive folder.
String driveFolderUrl(String folderId) =>
    'https://drive.google.com/drive/folders/$folderId';

/// A row of the `drive_folders` table: a Partitions tab (or the Drive root)
/// and the Google Drive folder it points at. The admin can retarget a folder,
/// so the app reads this table instead of trusting its build-time `.env`.
class DriveFolder {
  const DriveFolder({
    required this.slug,
    required this.label,
    required this.folderId,
  });

  final String slug;
  final String label;
  final String folderId;

  bool get isRoot => slug == kDriveRootSlug;

  String get url => driveFolderUrl(folderId);

  /// Parses a row of `drive_folders`; returns null when a required column is
  /// missing or empty, so a half-edited row never becomes an unusable tab.
  static DriveFolder? fromRow(Map<String, dynamic> row) {
    final slug = row['slug']?.toString().trim() ?? '';
    final label = row['label']?.toString().trim() ?? '';
    final folderId = row['folder_id']?.toString().trim() ?? '';
    if (slug.isEmpty || folderId.isEmpty) return null;
    return DriveFolder(
      slug: slug,
      label: label.isEmpty ? slug : label,
      folderId: folderId,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is DriveFolder &&
      other.slug == slug &&
      other.label == label &&
      other.folderId == folderId;

  @override
  int get hashCode => Object.hash(slug, label, folderId);

  @override
  String toString() => 'DriveFolder($slug → $folderId)';
}

/// The folders the Partitions screen shows: the tabs in display order and,
/// when configured, the root folder behind "Accès direct au Drive".
class DriveFolderCatalog {
  const DriveFolderCatalog({
    required this.tabs,
    required this.root,
    required this.fromFallback,
  });

  /// Builds a catalog from table rows in display order. Rows that don't parse
  /// are skipped; the root row is split out of the tabs.
  factory DriveFolderCatalog.fromRows(
    Iterable<Map<String, dynamic>> rows, {
    bool fromFallback = false,
  }) {
    final folders = rows.map(DriveFolder.fromRow).whereType<DriveFolder>();
    DriveFolder? root;
    final tabs = <DriveFolder>[];
    for (final folder in folders) {
      if (folder.isRoot) {
        root ??= folder;
      } else {
        tabs.add(folder);
      }
    }
    return DriveFolderCatalog(
      tabs: tabs,
      root: root,
      fromFallback: fromFallback,
    );
  }

  final List<DriveFolder> tabs;
  final DriveFolder? root;

  /// True when the catalog comes from the `.env` fallback rather than the
  /// table (the table read failed or returned no tab).
  final bool fromFallback;

  bool get hasTabs => tabs.isNotEmpty;

  /// URL of the "Accès direct au Drive" link, or null when unknown.
  String? get rootUrl => root?.url;
}
