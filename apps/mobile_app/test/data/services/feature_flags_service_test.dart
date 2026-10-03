import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/services/feature_flags_service.dart';
import 'package:logger/logger.dart';

FeatureFlagsService _service(
  Future<List<Map<String, dynamic>>> Function() fetchRows,
) => FeatureFlagsService(
  fetchRows: fetchRows,
  logger: Logger(level: Level.off),
);

void main() {
  group('FeatureFlagsService.getFlags', () {
    test('maintenance on when the row is enabled', () async {
      final flags = await _service(
        () async => [
          {'flag_key': 'mobile_maintenance', 'is_enabled': true},
        ],
      ).getFlags();

      expect(flags.maintenance, isTrue);
      expect(flags.minVersion, isNull);
    });

    test('maintenance off when the row is disabled or absent', () async {
      final disabled = await _service(
        () async => [
          {'flag_key': 'mobile_maintenance', 'is_enabled': false},
        ],
      ).getFlags();
      final absent = await _service(() async => []).getFlags();

      expect(disabled.maintenance, isFalse);
      expect(absent.maintenance, isFalse);
    });

    test('a failed read means no flag, never an error', () async {
      final flags = await _service(
        () async => throw Exception('network unreachable'),
      ).getFlags();

      expect(flags.maintenance, isFalse);
      expect(flags.minVersion, isNull);
    });

    test('min version comes from the description while enabled', () async {
      final enabled = await _service(
        () async => [
          {
            'flag_key': 'mobile_min_version',
            'is_enabled': true,
            'description': ' 2.1.0 ',
          },
        ],
      ).getFlags();
      final disabled = await _service(
        () async => [
          {
            'flag_key': 'mobile_min_version',
            'is_enabled': false,
            'description': '2.1.0',
          },
        ],
      ).getFlags();
      final garbage = await _service(
        () async => [
          {
            'flag_key': 'mobile_min_version',
            'is_enabled': true,
            'description': 'Version minimale de l\'app',
          },
        ],
      ).getFlags();

      expect(enabled.minVersion, '2.1.0');
      expect(disabled.minVersion, isNull);
      expect(garbage.minVersion, isNull, reason: 'not a version string');
    });

    test('ignores other flags', () async {
      final flags = await _service(
        () async => [
          {'flag_key': 'anniversary_40_years', 'is_enabled': true},
        ],
      ).getFlags();

      expect(flags.maintenance, isFalse);
    });
  });

  group('version comparison', () {
    test('parses dotted versions with optional v and build number', () {
      expect(parseVersion('2.0.117'), [2, 0, 117]);
      expect(parseVersion('2.0.117+133'), [2, 0, 117]);
      expect(parseVersion('v2.1'), [2, 1]);
      expect(parseVersion(''), isNull);
      expect(parseVersion('2.x'), isNull);
    });

    test('isVersionBelow compares numerically, missing parts are zero', () {
      expect(isVersionBelow('2.0.117', '2.1.0'), isTrue);
      expect(isVersionBelow('2.0.9', '2.0.10'), isTrue, reason: 'not lexical');
      expect(isVersionBelow('2.1.0', '2.1'), isFalse);
      expect(isVersionBelow('2.1.0', '2.1.0'), isFalse);
      expect(isVersionBelow('3.0.0', '2.9.9'), isFalse);
      expect(isVersionBelow('garbage', '2.0.0'), isFalse);
      expect(isVersionBelow('2.0.0', 'garbage'), isFalse);
    });
  });
}
