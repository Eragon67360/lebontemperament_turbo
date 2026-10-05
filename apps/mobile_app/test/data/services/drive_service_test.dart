import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/services/drive_service.dart';
import 'package:logger/logger.dart';

/// Records the request and answers with a canned status and JSON body.
class _RecordingAdapter implements HttpClientAdapter {
  _RecordingAdapter({
    this.status = 200,
    this.body = '[]',
    this.headers = const {
      Headers.contentTypeHeader: ['application/json'],
    },
  });

  final int status;
  final String body;
  final Map<String, List<String>> headers;
  RequestOptions? lastRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    lastRequest = options;
    return ResponseBody.fromString(body, status, headers: headers);
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
      adapter.lastRequest?.uri.queryParameters.containsKey('download'),
      isFalse,
    );
    expect(
      adapter.lastRequest?.headers['Authorization'],
      'Bearer test-access-token',
    );
  });

  test('downloads an attachment named by the proxy (#443)', () async {
    final adapter = _RecordingAdapter(
      body: 'pdf-bytes',
      headers: {
        Headers.contentTypeHeader: ['application/pdf'],
        'content-disposition': [
          "attachment; filename=\"Choeur d'ete.pdf\"; "
              "filename*=UTF-8''Ch%C5%93ur%20d%27%C3%A9t%C3%A9.pdf",
        ],
      },
    );
    final service = _service(adapter, token: 'test-access-token');

    final download = await service.downloadAttachment('file-test-1');

    expect(utf8.decode(download.bytes), 'pdf-bytes');
    expect(download.fileName, "Chœur d'été.pdf");
    expect(download.contentType, 'application/pdf');
    expect(adapter.lastRequest?.uri.path, '/api/drive/file');
    expect(adapter.lastRequest?.uri.queryParameters['fileId'], 'file-test-1');
    expect(adapter.lastRequest?.uri.queryParameters['download'], '1');
    expect(
      adapter.lastRequest?.headers['Authorization'],
      'Bearer test-access-token',
    );
  });

  test('explains a 415 (Google-native item) in French', () async {
    final service = _service(
      _RecordingAdapter(status: 415, body: '{"error":"unsupported"}'),
      token: 'test-access-token',
    );
    await expectLater(
      service.downloadAttachment('file-test-1'),
      throwsA(
        isA<DriveServiceException>().having(
          (e) => e.message,
          'message',
          contains('ne peut pas être téléchargé'),
        ),
      ),
    );
  });

  group('fileNameFromContentDisposition', () {
    test('prefers the UTF-8 filename* over the ASCII fallback', () {
      expect(
        fileNameFromContentDisposition(
          "attachment; filename=\"Noel.pdf\"; filename*=UTF-8''No%C3%ABl.pdf",
        ),
        'Noël.pdf',
      );
    });

    test('falls back to a quoted or bare filename', () {
      expect(
        fileNameFromContentDisposition(
          'attachment; filename="Air \\"Les vrais\\" tenors.mp3"',
        ),
        'Air "Les vrais" tenors.mp3',
      );
      expect(
        fileNameFromContentDisposition('attachment; filename=Partition.pdf'),
        'Partition.pdf',
      );
    });

    test('drops path separators and handles missing headers', () {
      expect(
        fileNameFromContentDisposition(
          "attachment; filename*=UTF-8''..%2F..%2Fetc%2Fpasswd",
        ),
        '.._.._etc_passwd',
      );
      expect(fileNameFromContentDisposition(null), isNull);
      expect(fileNameFromContentDisposition('inline'), isNull);
      expect(fileNameFromContentDisposition('attachment; filename=""'), isNull);
    });
  });
}
