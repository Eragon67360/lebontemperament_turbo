import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';
import 'package:lebontemperament/data/services/drive_folders_service.dart';
import 'package:logger/logger.dart';

const _fallback = [
  DriveFolder(slug: kDriveRootSlug, label: 'Drive', folderId: 'env-root'),
  DriveFolder(slug: 'adultes', label: 'Adultes', folderId: 'env-adultes'),
  DriveFolder(slug: 'enfants', label: 'Enfants', folderId: 'env-enfants'),
];

DriveFoldersService _service(
  Future<List<Map<String, dynamic>>> Function() fetchRows,
) => DriveFoldersService(
  fetchRows: fetchRows,
  fallbackFolders: _fallback,
  logger: Logger(level: Level.off),
);

void main() {
  test('uses the table when it answers', () async {
    final service = _service(
      () async => [
        {'slug': 'racine', 'label': 'Drive complet', 'folder_id': 'db-root'},
        {'slug': 'adultes', 'label': 'Adultes', 'folder_id': 'db-adultes'},
      ],
    );

    final catalog = await service.getCatalog();

    expect(catalog.fromFallback, isFalse);
    expect(catalog.tabs.single.folderId, 'db-adultes');
    expect(catalog.root?.folderId, 'db-root');
  });

  test('falls back to .env when the read fails (never throws)', () async {
    final service = _service(() async => throw Exception('RLS: no session'));

    final catalog = await service.getCatalog();

    expect(catalog.fromFallback, isTrue);
    expect(catalog.tabs.map((t) => t.folderId), ['env-adultes', 'env-enfants']);
    expect(catalog.root?.folderId, 'env-root');
  });

  test('falls back to .env when the table has no usable tab', () async {
    final service = _service(
      () async => [
        {'slug': 'racine', 'label': 'Drive complet', 'folder_id': 'db-root'},
        {'slug': 'adultes', 'label': 'Adultes', 'folder_id': ''},
      ],
    );

    final catalog = await service.getCatalog();

    expect(catalog.fromFallback, isTrue);
    expect(catalog.tabs, hasLength(2));
  });
}
