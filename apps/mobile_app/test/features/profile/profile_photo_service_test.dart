import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/features/profile/data/profile_photo_service.dart';
import 'package:logger/logger.dart';

final _jpeg = Uint8List.fromList([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 1, 2]);

/// Answers each request with the next canned (status, body), recording it.
class _Adapter implements HttpClientAdapter {
  _Adapter(this.answers);

  final List<(int, String)> answers;
  final List<RequestOptions> requests = [];
  final List<List<int>> bodies = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final body = <int>[];
    if (requestStream != null) {
      await for (final chunk in requestStream) {
        body.addAll(chunk);
      }
    }
    bodies.add(body);
    final (status, json) = answers[requests.length - 1];
    return ResponseBody.fromString(
      json,
      status,
      headers: {
        Headers.contentTypeHeader: ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

ProfilePhotoService _service(
  _Adapter adapter, {
  String? Function()? token,
  Future<bool> Function()? refresh,
}) => ProfilePhotoService(
  dio: Dio()..httpClientAdapter = adapter,
  accessToken: token ?? () => 'test-token',
  refreshSession: refresh ?? () async => false,
  logger: Logger(level: Level.off),
);

void main() {
  test('sniffs the image types the website accepts, and nothing else', () {
    expect(sniffImageType(_jpeg), 'image/jpeg');
    expect(
      sniffImageType(
        Uint8List.fromList([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
      'image/png',
    );
    expect(
      sniffImageType(
        Uint8List.fromList(utf8.encode('RIFF\x00\x00\x00\x00WEBP')),
      ),
      'image/webp',
    );
    expect(
      sniffImageType(Uint8List.fromList(utf8.encode('GIF89a'))),
      'image/gif',
    );
    expect(sniffImageType(Uint8List.fromList(utf8.encode('<svg>'))), isNull);
    // HEIC: ftyp box, not accepted (browsers can't show it).
    expect(
      sniffImageType(
        Uint8List.fromList([0, 0, 0, 24, ...utf8.encode('ftypheic')]),
      ),
      isNull,
    );
    expect(sniffImageType(Uint8List(0)), isNull);
  });

  test('uploads the photo as multipart with the member token', () async {
    final adapter = _Adapter([
      (200, '{"url":"https://example.test/p/me_1.jpg"}'),
    ]);

    final url = await _service(adapter).upload(_jpeg);

    expect(url, 'https://example.test/p/me_1.jpg');
    final request = adapter.requests.single;
    expect(request.method, 'POST');
    expect(request.uri.path, '/api/profile/photo');
    expect(request.headers['Authorization'], 'Bearer test-token');
    final body = latin1.decode(adapter.bodies.single);
    expect(body, contains('name="file"; filename="photo.jpeg"'));
    expect(body, contains('content-type: image/jpeg'));
  });

  test('never sends a file that is not a supported image', () async {
    final adapter = _Adapter([]);
    await expectLater(
      _service(adapter).upload(Uint8List.fromList(utf8.encode('<html>'))),
      throwsA(
        isA<ProfilePhotoException>().having(
          (e) => e.message,
          'message',
          contains('format'),
        ),
      ),
    );
    expect(adapter.requests, isEmpty);
  });

  test('refreshes an expired session once, then retries', () async {
    var token = 'old';
    final adapter = _Adapter([
      (401, '{"error":"Non authentifié"}'),
      (200, '{"url":"https://example.test/p/me_2.jpg"}'),
    ]);
    final service = _service(
      adapter,
      token: () => token,
      refresh: () async {
        token = 'new';
        return true;
      },
    );

    expect(await service.upload(_jpeg), 'https://example.test/p/me_2.jpg');
    expect(adapter.requests.map((r) => r.headers['Authorization']), [
      'Bearer old',
      'Bearer new',
    ]);
  });

  test('shows the website’s reason for a refusal, in French', () async {
    final adapter = _Adapter([
      (400, '{"error":"Le contenu du fichier ne correspond pas à son type"}'),
    ]);
    await expectLater(
      _service(adapter).upload(_jpeg),
      throwsA(
        isA<ProfilePhotoException>().having(
          (e) => e.message,
          'message',
          'Le contenu du fichier ne correspond pas à son type',
        ),
      ),
    );
  });

  test('a server error gets a plain message, not the raw error', () async {
    final adapter = _Adapter([(500, '{"error":"stack trace"}')]);
    await expectLater(
      _service(adapter).upload(_jpeg),
      throwsA(
        isA<ProfilePhotoException>().having(
          (e) => e.message,
          'message',
          contains('Réessayez plus tard'),
        ),
      ),
    );
  });

  test('removes the photo with a DELETE', () async {
    final adapter = _Adapter([(200, '{"url":null}')]);
    await _service(adapter).remove();
    expect(adapter.requests.single.method, 'DELETE');
    expect(adapter.requests.single.uri.path, '/api/profile/photo');
  });
}
