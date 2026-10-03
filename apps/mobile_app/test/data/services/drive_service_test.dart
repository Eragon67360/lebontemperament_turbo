import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:logger/logger.dart';

/// Records the request and answers with a canned status and JSON body.
class _RecordingAdapter implements HttpClientAdapter {
  _RecordingAdapter({this.status = 200, this.body = '[]'});

  final int status;
  final String body;
  RequestOptions? lastRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    lastRequest = options;
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

DriveService _service(_RecordingAdapter adapter, {String? token}) {
  final dio = Dio()..httpClientAdapter = adapter;
  return DriveService(
    dio: dio,
    accessToken: () => token,
    logger: Logger(level: Level.off),
  );
}

void main() {
  test('sends the session access token as a bearer (#319)', () async {
    final adapter = _RecordingAdapter(
      body: jsonEncode([
        {
          'id': 'file-test-1',
          'name': 'Partition.pdf',
          'type': 'file',
          'mimeType': 'application/pdf',
        },
      ]),
    );
    final service = _service(adapter, token: 'test-access-token');

    final files = await service.getFolderContents('folder-test');

    expect(files.single.name, 'Partition.pdf');
    expect(
      adapter.lastRequest?.headers['Authorization'],
      'Bearer test-access-token',
    );
    expect(adapter.lastRequest?.uri.path, '/api/drive/files');
    expect(adapter.lastRequest?.uri.queryParameters['folderID'], 'folder-test');
  });

  test('sends no Authorization header without a session', () async {
    final adapter = _RecordingAdapter();
    final service = _service(adapter, token: null);

    await service.getFolderContents('folder-test');

    expect(adapter.lastRequest?.headers.containsKey('Authorization'), isFalse);
    expect(service.authHeaders, isEmpty);
  });

  test('explains a 401 and a 403 in French', () async {
    final unauthorized = _service(
      _RecordingAdapter(status: 401, body: '{"error":"Unauthorized"}'),
    );
    await expectLater(
      unauthorized.getFolderContents('folder-test'),
      throwsA(
        isA<DriveServiceException>().having(
          (e) => e.message,
          'message',
          contains('Session expirée'),
        ),
      ),
    );

    final forbidden = _service(
      _RecordingAdapter(status: 403, body: '{"error":"Accès refusé"}'),
      token: 'test-access-token',
    );
    await expectLater(
      forbidden.getFolderContents('folder-test'),
      throwsA(
        isA<DriveServiceException>().having(
          (e) => e.message,
          'message',
          contains('pas accessible'),
        ),
      ),
    );
  });

  test('downloads a file through the authenticated proxy', () async {
    final adapter = _RecordingAdapter(body: 'pdf-bytes');
    final service = _service(adapter, token: 'test-access-token');

    final bytes = await service.downloadFile('file-test-1');

    expect(utf8.decode(bytes), 'pdf-bytes');
    expect(adapter.lastRequest?.uri.path, '/api/drive/file');
    expect(adapter.lastRequest?.uri.queryParameters['fileId'], 'file-test-1');
    expect(
      adapter.lastRequest?.headers['Authorization'],
      'Bearer test-access-token',
    );
  });
}
