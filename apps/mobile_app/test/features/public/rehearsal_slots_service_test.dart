import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/public/data/public_content.dart';
import 'package:lebontemperament/features/public/data/rehearsal_slots_service.dart';
import 'package:logger/logger.dart';

/// Answers every request with a canned status and JSON body.
class _CannedAdapter implements HttpClientAdapter {
  _CannedAdapter({this.status = 200, this.body = '{}'});

  final int status;
  final String body;
  Uri? lastUri;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    lastUri = options.uri;
    return ResponseBody.fromString(
      body,
      status,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

RehearsalSlotsService _service(_CannedAdapter adapter) => RehearsalSlotsService(
  dio: Dio()..httpClientAdapter = adapter,
  logger: Logger(level: Level.off),
  siteUrl: 'https://site.test',
);

void main() {
  test('reads the published rehearsal times', () async {
    final adapter = _CannedAdapter(
      body: jsonEncode({
        'slots': [
          {
            'group': 'Chœur de femmes',
            'day': 'mercredi',
            'time': '20h – 22h',
            'place': 'Wangen',
            'rhythm': 'Chaque semaine',
          },
        ],
      }),
    );
    final slots = await _service(adapter).getSlots();

    expect(adapter.lastUri.toString(), 'https://site.test/api/joining');
    expect(slots.single.group, 'Chœur de femmes');
    expect(slots.single.when, 'Mercredi, 20h – 22h');
    expect(slots.single.place, 'Wangen');
  });

  test(
    'none published, website down or odd answer: the built-in times',
    () async {
      for (final adapter in [
        _CannedAdapter(body: jsonEncode({'slots': []})),
        _CannedAdapter(status: 500),
        _CannedAdapter(body: '"oops"'),
      ]) {
        expect(await _service(adapter).getSlots(), kRehearsalSlots);
      }
    },
  );

  test('skips incomplete rows', () {
    final slots = parseRehearsalSlots({
      'slots': [
        {'group': 'A', 'day': 'jeudi', 'time': '20h', 'place': 'B'},
        {
          'group': 'A',
          'day': 'jeudi',
          'time': '20h',
          'place': 'B',
          'rhythm': '',
        },
      ],
    });
    expect(slots, isEmpty);
  });
}
