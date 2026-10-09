import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/core/constants/ui_constants.dart';
import 'package:lebontemperament/data/services/site_documents_service.dart';
import 'package:logger/logger.dart';

const _site = 'https://site.test';

/// Records the request and answers with a canned status and JSON body.
class _RecordingAdapter implements HttpClientAdapter {
  _RecordingAdapter({this.status = 200, this.body = '{}'});

  final int status;
  final String body;
  final List<RequestOptions> requests = [];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
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

SiteDocumentsService _service(_RecordingAdapter adapter, {String? token}) =>
    SiteDocumentsService(
      dio: Dio()..httpClientAdapter = adapter,
      accessToken: () async => token,
      logger: Logger(level: Level.off),
      siteUrl: _site,
    );

final _published = jsonEncode({
  'collections': [
    {
      'slug': 'ag',
      'label': 'Assemblées générales',
      'description': null,
      'documents': [
        {
          'id': '1',
          'title': "Compte rendu de l'AG 2025",
          'dateLabel': '2025',
          'visibility': 'members',
          'href': '/documents/ag/cr-ag-2025.pdf',
        },
      ],
    },
    {'slug': 'vide', 'label': 'Vide', 'documents': []},
  ],
});

void main() {
  group('SiteDocumentsService', () {
    test('asks the website as the member and reads its collections', () async {
      final adapter = _RecordingAdapter(body: _published);
      final collections = await _service(
        adapter,
        token: 'jwt',
      ).getCollections();

      expect(adapter.requests.single.uri.toString(), '$_site/api/documents');
      expect(adapter.requests.single.headers['Authorization'], 'Bearer jwt');
      expect(collections.map((c) => c.slug), ['ag']);
      final doc = collections.single.documents.single;
      expect(doc.title, "Compte rendu de l'AG 2025");
      expect(doc.url, '$_site/documents/ag/cr-ag-2025.pdf');
      expect(collections.single.description, isNull);
    });

    test('signed out: the built-in lists, without calling', () async {
      final adapter = _RecordingAdapter(body: _published);
      final collections = await _service(adapter).getCollections();

      expect(adapter.requests, isEmpty);
      expect(collections.map((c) => c.slug), ['ag', 'gazettes', 'pele-mele']);
    });

    test('website down or odd answer: the built-in lists', () async {
      for (final adapter in [
        _RecordingAdapter(status: 500),
        _RecordingAdapter(body: '[]'),
      ]) {
        final collections = await _service(
          adapter,
          token: 'jwt',
        ).getCollections();
        expect(collections.map((c) => c.slug), ['ag', 'gazettes', 'pele-mele']);
      }
    });
  });

  group('parseDocumentCollections', () {
    test('keeps only links that stay on the website', () {
      final collections = parseDocumentCollections({
        'collections': [
          {
            'slug': 'gazettes',
            'label': 'Gazettes',
            'documents': [
              {'title': 'Ok', 'href': '/documents/gazettes/a.pdf'},
              {'title': 'Other host', 'href': '//evil.test/a.pdf'},
              {'title': 'Absolute', 'href': 'https://evil.test/a.pdf'},
              {'title': 'No href'},
            ],
          },
        ],
      }, _site);

      expect(collections!.single.documents.map((d) => d.title), ['Ok']);
    });

    test('null for another shape', () {
      expect(parseDocumentCollections(null, _site), isNull);
      expect(parseDocumentCollections({'collections': 3}, _site), isNull);
    });
  });

  test('built-in lists: newest first, at the old addresses', () {
    final ag = legacyDocumentCollections().first;
    expect(ag.label, 'Comptes-rendus AG');
    expect(ag.documents, isNotEmpty);
    expect(ag.documents.first.url, startsWith('$kWebsiteBaseUrl/pdf/AG/'));
    expect(ag.documents.first.title, startsWith('AG '));
  });
}
