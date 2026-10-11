import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/models/event_document.dart';

/// Fake rows only: no real event, file or bucket key.
Map<String, dynamic> _row({
  String id = 'doc-test-0001',
  String eventId = 'event-test-0001',
  String label = 'Bulletin de réservation',
  String fileName = 'Bulletin-de-reservation.pdf',
  String mimeType = 'application/pdf',
  Object? sizeBytes = 122880,
  Object? sortOrder = 0,
  String createdAt = '2099-01-01T10:00:00+00:00',
}) => {
  'id': id,
  'event_id': eventId,
  'label': label,
  'file_name': fileName,
  'storage_key': 'events/$eventId/$id-$fileName',
  'mime_type': mimeType,
  'size_bytes': sizeBytes,
  'sort_order': sortOrder,
  'created_at': createdAt,
};

const _publicUrl =
    'https://project.test/storage/v1/object/public/site-media/events/'
    'event-test-0001/doc-test-0001-Bulletin-de-reservation.docx';

void main() {
  group('EventDocument.fromJson', () {
    test('reads a database row', () {
      final document = EventDocument.fromJson(_row());

      expect(document.id, 'doc-test-0001');
      expect(document.eventId, 'event-test-0001');
      expect(document.label, 'Bulletin de réservation');
      expect(document.fileName, 'Bulletin-de-reservation.pdf');
      expect(
        document.storageKey,
        'events/event-test-0001/doc-test-0001-Bulletin-de-reservation.pdf',
      );
      expect(document.sizeBytes, 122880);
      expect(document.sortOrder, 0);
    });

    test('accepts a size sent as text (bigint) or missing', () {
      expect(EventDocument.fromJson(_row(sizeBytes: '2048')).sizeBytes, 2048);
      expect(EventDocument.fromJson(_row(sizeBytes: null)).sizeBytes, isNull);
    });

    test('rejects a row without its file', () {
      final row = _row()..remove('storage_key');
      expect(() => EventDocument.fromJson(row), throwsFormatException);
    });
  });

  group('kind', () {
    test('PDF, Word or Excel from the MIME type', () {
      expect(eventDocumentKind('application/pdf').label, 'PDF');
      expect(eventDocumentKind('application/msword').label, 'Word');
      expect(
        eventDocumentKind(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ).label,
        'Word',
      );
      expect(eventDocumentKind('application/vnd.ms-excel').label, 'Excel');
      expect(
        eventDocumentKind(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ).label,
        'Excel',
      );
      expect(
        eventDocumentKind('Application/MSWord; charset=binary'),
        EventDocumentKind.word,
      );
    });
  });

  group('fileSizeLabel', () {
    test('ko under 1 Mo, at least 1 ko', () {
      expect(fileSizeLabel(122880), '120 ko');
      expect(fileSizeLabel(0), '1 ko');
      expect(fileSizeLabel(300), '1 ko');
      expect(fileSizeLabel(1024 * 1024 - 1), '1024 ko');
    });

    test('Mo with one decimal and a comma from 1 Mo', () {
      expect(fileSizeLabel(1024 * 1024), '1,0 Mo');
      expect(fileSizeLabel((1.2 * 1024 * 1024).round()), '1,2 Mo');
      expect(fileSizeLabel(15 * 1024 * 1024), '15,0 Mo');
    });

    test('no label for an unknown size', () {
      expect(fileSizeLabel(null), isNull);
      expect(fileSizeLabel(-1), isNull);
    });

    test('the line under the label', () {
      expect(EventDocument.fromJson(_row()).details, 'PDF · 120 ko');
      expect(EventDocument.fromJson(_row(sizeBytes: null)).details, 'PDF');
    });
  });

  group('urlFrom', () {
    test('a PDF opens at its plain public URL', () {
      final pdf = EventDocument.fromJson(_row());
      expect(pdf.urlFrom(_publicUrl), _publicUrl);
    });

    test('Word and Excel download under their clean name', () {
      final word = EventDocument.fromJson(
        _row(
          fileName: 'Bulletin-de-reservation.docx',
          mimeType:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      );
      final excel = EventDocument.fromJson(
        _row(
          fileName: 'Commandes_2099.xls',
          mimeType: 'application/vnd.ms-excel',
        ),
      );

      expect(
        word.urlFrom(_publicUrl),
        '$_publicUrl?download=Bulletin-de-reservation.docx',
      );
      expect(
        excel.urlFrom('$_publicUrl?v=1'),
        '$_publicUrl?v=1&download=Commandes_2099.xls',
      );
      expect(
        EventDocument.fromJson(
          _row(fileName: 'a b.xls', mimeType: 'application/vnd.ms-excel'),
        ).urlFrom(_publicUrl),
        '$_publicUrl?download=a%20b.xls',
      );
    });
  });

  test('sorted by the admin order, then oldest first', () {
    final documents = [
      _row(id: 'c', sortOrder: 1, createdAt: '2099-01-01T00:00:00Z'),
      _row(id: 'b', sortOrder: 0, createdAt: '2099-01-03T00:00:00Z'),
      _row(id: 'a', sortOrder: 0, createdAt: '2099-01-02T00:00:00Z'),
    ].map(EventDocument.fromJson);

    expect(sortEventDocuments(documents).map((d) => d.id), ['a', 'b', 'c']);
  });

  group('the offline cache', () {
    const event = Event(id: 'event-test-0001', eventType: EventType.vente);

    test('keeps the documents of an event through JSON', () {
      final withFiles = event.copyWith(
        documents: [EventDocument.fromJson(_row())],
      );

      final restored = Event.fromJson(
        jsonDecode(jsonEncode(withFiles.toJson())) as Map<String, dynamic>,
      );

      expect(restored, withFiles);
      expect(restored.documents.single.details, 'PDF · 120 ko');
    });

    test('an event cached before documents existed has none', () {
      final old = event.toJson()..remove('documents');
      expect(Event.fromJson(old).documents, isEmpty);
    });

    test('a damaged cached document is dropped, not the event', () {
      final json = event.toJson()
        ..['documents'] = [
          _row(),
          {'id': 'broken'},
          'not a row',
        ];

      final restored = Event.fromJson(json);

      expect(restored.id, event.id);
      expect(restored.documents.map((d) => d.id), ['doc-test-0001']);
    });
  });
}
