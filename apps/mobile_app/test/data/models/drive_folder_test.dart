import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/drive_folder.dart';

void main() {
  group('DriveFolder.fromRow', () {
    test('parses a drive_folders row', () {
      final folder = DriveFolder.fromRow({
        'slug': 'adultes',
        'label': 'Adultes',
        'folder_id': 'folder-test-a',
      });
      expect(folder, isNotNull);
      expect(folder!.slug, 'adultes');
      expect(folder.label, 'Adultes');
      expect(folder.folderId, 'folder-test-a');
      expect(folder.isRoot, isFalse);
    });

    test('rejects rows without a slug or a folder id', () {
      expect(DriveFolder.fromRow({'label': 'x', 'folder_id': 'id'}), isNull);
      expect(DriveFolder.fromRow({'slug': 'x', 'folder_id': '  '}), isNull);
      expect(DriveFolder.fromRow({'slug': 'x', 'folder_id': null}), isNull);
    });

    test('falls back to the slug when the label is empty', () {
      final folder = DriveFolder.fromRow({'slug': 'jeunes', 'folder_id': 'id'});
      expect(folder!.label, 'jeunes');
    });
  });

  group('DriveFolderCatalog.fromRows', () {
    test('keeps the display order and splits the root out of the tabs', () {
      final catalog = DriveFolderCatalog.fromRows([
        {'slug': 'racine', 'label': 'Drive complet', 'folder_id': 'root-id'},
        {'slug': 'adultes', 'label': 'Adultes', 'folder_id': 'a-id'},
        {'slug': 'broken', 'label': 'Sans dossier', 'folder_id': ''},
        {'slug': 'jeunes', 'label': 'Jeunes', 'folder_id': 'j-id'},
      ]);

      expect(catalog.tabs.map((t) => t.slug), ['adultes', 'jeunes']);
      expect(catalog.root?.folderId, 'root-id');
      expect(catalog.fromFallback, isFalse);
      expect(catalog.hasTabs, isTrue);
    });

    test('has no tabs when only the root is configured', () {
      final catalog = DriveFolderCatalog.fromRows([
        {'slug': 'racine', 'label': 'Drive complet', 'folder_id': 'root-id'},
      ]);
      expect(catalog.hasTabs, isFalse);
      expect(catalog.root, isNotNull);
    });
  });
}
