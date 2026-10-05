import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// The Play Store listing lives in android/fastlane/metadata (uploaded by the
/// "Play Store" workflow); Google refuses an upload past these limits, so
/// they are checked on every pull request instead of at upload time.
const _metadata = 'android/fastlane/metadata/android';

const _limits = {
  'title.txt': 30,
  'short_description.txt': 80,
  'full_description.txt': 4000,
  'changelogs/default.txt': 500,
};

void main() {
  final locales = Directory(_metadata)
      .listSync()
      .whereType<Directory>()
      .map((d) => d.uri.pathSegments.where((s) => s.isNotEmpty).last)
      .toList();

  test('the listing has a French locale', () {
    expect(locales, contains('fr-FR'));
  });

  for (final locale in locales) {
    for (final entry in _limits.entries) {
      test(
        '$locale/${entry.key} is filled and within ${entry.value} chars',
        () {
          final file = File('$_metadata/$locale/${entry.key}');
          expect(file.existsSync(), isTrue, reason: '${file.path} is missing');
          // Google counts characters (code points), not bytes.
          final length = file.readAsStringSync().trim().runes.length;
          expect(length, greaterThan(0));
          expect(length, lessThanOrEqualTo(entry.value));
        },
      );
    }
  }
}
