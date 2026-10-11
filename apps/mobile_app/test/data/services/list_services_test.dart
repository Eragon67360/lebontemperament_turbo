import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/models/event_document.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/services/concerts_service.dart';
import 'package:lebontemperament/data/services/events_service.dart';
import 'package:lebontemperament/data/services/rehearsals_service.dart';
import 'package:lebontemperament/data/services/storage_service.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../helpers/screen_harness.dart';

/// In-memory stand-in for the Hive-backed cache.
class FakeStorageService extends StorageService {
  FakeStorageService() : super(logger: Logger(level: Level.off));

  List<Rehearsal> rehearsals = [];
  List<Concert> concerts = [];
  List<Event> events = [];

  @override
  Future<void> saveRehearsals(List<Rehearsal> items) async =>
      rehearsals = items;
  @override
  List<Rehearsal> getRehearsals() => rehearsals;

  @override
  Future<void> saveConcerts(List<Concert> items) async => concerts = items;
  @override
  List<Concert> getConcerts() => concerts;

  @override
  Future<void> saveEvents(List<Event> items) async => events = items;
  @override
  List<Event> getEvents() => events;

  @override
  Future<void> saveEvent(Event event) async =>
      events = [...events.where((e) => e.id != event.id), event];
  @override
  Event? getEvent(String id) => events.where((e) => e.id == id).firstOrNull;
}

final _off = Logger(level: Level.off);

Future<List<Map<String, dynamic>>> _serverDown() async =>
    throw Exception('SocketException: Failed host lookup');

/// What PostgREST answers while `event_documents` isn't on the server yet.
Future<List<Map<String, dynamic>>> _noDocumentsTable(String? eventId) async =>
    throw const PostgrestException(
      message: "Could not find the table 'public.event_documents'",
      code: 'PGRST205',
    );

/// Fake file rows: no real event, file or bucket key.
Map<String, dynamic> _documentRow(
  String id, {
  String eventId = 'event-test-0001',
  int sortOrder = 0,
  String createdAt = '2099-01-01T00:00:00Z',
}) => {
  'id': id,
  'event_id': eventId,
  'label': 'Document $id',
  'file_name': 'Document-$id.pdf',
  'storage_key': 'events/$eventId/$id-Document-$id.pdf',
  'mime_type': 'application/pdf',
  'size_bytes': 2048,
  'sort_order': sortOrder,
  'created_at': createdAt,
};

const _otherEvent = Event(id: 'event-test-0003', eventType: EventType.autre);

void main() {
  group('RehearsalsService.getRehearsals', () {
    test('serves the server rows as fresh and caches them', () async {
      final storage = FakeStorageService();
      final service = RehearsalsService(
        storageService: storage,
        fetchRows: () async => [kTestRehearsal.toJson()],
        logger: _off,
      );

      final result = await service.getRehearsals();

      expect(result.fromCache, isFalse);
      expect(result.isUnavailable, isFalse);
      expect(result.items.single.id, kTestRehearsal.id);
      expect(storage.rehearsals.single.id, kTestRehearsal.id);
    });

    test('serves the cache, flagged, when the server fails', () async {
      final storage = FakeStorageService()..rehearsals = [kTestRehearsal];
      final service = RehearsalsService(
        storageService: storage,
        fetchRows: _serverDown,
        logger: _off,
      );

      final result = await service.getRehearsals();

      expect(result.fromCache, isTrue);
      expect(result.isUnavailable, isFalse);
      expect(result.error, isException);
      expect(result.items.single.id, kTestRehearsal.id);
    });

    test('is unavailable (not empty) when the server fails and the cache '
        'is empty', () async {
      final service = RehearsalsService(
        storageService: FakeStorageService(),
        fetchRows: _serverDown,
        logger: _off,
      );

      final result = await service.getRehearsals();

      expect(result.isUnavailable, isTrue);
      expect(result.items, isEmpty);
    });
  });

  group('ConcertsService.getConcerts', () {
    test('fresh from the server, cached on failure', () async {
      final storage = FakeStorageService();
      final fresh = await ConcertsService(
        storageService: storage,
        fetchRows: () async => [kTestConcert.toJson()],
        logger: _off,
      ).getConcerts();
      final cached = await ConcertsService(
        storageService: storage,
        fetchRows: _serverDown,
        logger: _off,
      ).getConcerts();

      expect(fresh.fromCache, isFalse);
      expect(cached.fromCache, isTrue);
      expect(cached.items.single.id, kTestConcert.id);
    });
  });

  group('EventsService.getEvents', () {
    test('fresh from the server, cached on failure', () async {
      final storage = FakeStorageService();
      final fresh = await EventsService(
        storageService: storage,
        fetchRows: () async => [kTestEvent.toJson()],
        logger: _off,
      ).getEvents();
      final cached = await EventsService(
        storageService: storage,
        fetchRows: _serverDown,
        logger: _off,
      ).getEvents();

      expect(fresh.fromCache, isFalse);
      expect(cached.fromCache, isTrue);
      expect(cached.items.single.id, kTestEvent.id);
    });

    test('attaches each event its documents, in display order', () async {
      final storage = FakeStorageService();
      String? askedFor = 'not asked';
      final result = await EventsService(
        storageService: storage,
        fetchRows: () async => [kTestEvent.toJson(), _otherEvent.toJson()],
        fetchDocumentRows: (eventId) async {
          askedFor = eventId;
          return [
            _documentRow('late', sortOrder: 1),
            _documentRow('new', createdAt: '2099-01-02T00:00:00Z'),
            _documentRow('old'),
            {'id': 'broken'},
          ];
        },
        logger: _off,
      ).getEvents();

      expect(askedFor, isNull, reason: 'one query for every event');
      expect(result.fromCache, isFalse);
      final byId = {for (final e in result.items) e.id: e};
      expect(byId[kTestEvent.id]!.documents.map((d) => d.id), [
        'old',
        'new',
        'late',
      ]);
      expect(byId[_otherEvent.id]!.documents, isEmpty);
      // Cached with them, for offline use.
      expect(storage.events.first.documents, hasLength(3));
    });

    test('a missing documents table means no documents, and the events '
        'still load fresh', () async {
      final storage = FakeStorageService();
      final result = await EventsService(
        storageService: storage,
        fetchRows: () async => [kTestEvent.toJson()],
        fetchDocumentRows: _noDocumentsTable,
        logger: _off,
      ).getEvents();

      expect(result.fromCache, isFalse);
      expect(result.items.single.id, kTestEvent.id);
      expect(result.items.single.documents, isEmpty);
      expect(storage.events.single.id, kTestEvent.id);
    });

    test('offline, cached events keep their documents', () async {
      final storage = FakeStorageService()
        ..events = [
          kTestEvent.copyWith(
            documents: [EventDocument.fromJson(_documentRow('cached'))],
          ),
        ];
      final result = await EventsService(
        storageService: storage,
        fetchRows: _serverDown,
        fetchDocumentRows: (_) => _serverDown(),
        logger: _off,
      ).getEvents();

      expect(result.fromCache, isTrue);
      expect(result.items.single.documents.single.id, 'cached');
    });
  });

  group('EventsService.getEventById', () {
    test('reads the event and only its documents', () async {
      final storage = FakeStorageService();
      String? askedFor;
      final event = await EventsService(
        storageService: storage,
        fetchRow: (id) async => kTestEvent.toJson(),
        fetchDocumentRows: (eventId) async {
          askedFor = eventId;
          return [_documentRow('b', sortOrder: 2), _documentRow('a')];
        },
        logger: _off,
      ).getEventById(kTestEvent.id);

      expect(askedFor, kTestEvent.id);
      expect(event!.documents.map((d) => d.id), ['a', 'b']);
      expect(storage.getEvent(kTestEvent.id)!.documents, hasLength(2));
    });

    test('a missing documents table still shows the event', () async {
      final event = await EventsService(
        storageService: FakeStorageService(),
        fetchRow: (id) async => kTestEvent.toJson(),
        fetchDocumentRows: _noDocumentsTable,
        logger: _off,
      ).getEventById(kTestEvent.id);

      expect(event!.id, kTestEvent.id);
      expect(event.documents, isEmpty);
    });

    test('a deleted event is null', () async {
      final event = await EventsService(
        storageService: FakeStorageService(),
        fetchRow: (id) async => throw const PostgrestException(
          message: 'JSON object requested, multiple (or no) rows returned',
          code: 'PGRST116',
        ),
        fetchDocumentRows: (_) async => [],
        logger: _off,
      ).getEventById('event-gone');

      expect(event, isNull);
    });
  });
}
