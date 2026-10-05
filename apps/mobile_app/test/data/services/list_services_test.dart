import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/event.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/services/concerts_service.dart';
import 'package:lebontemperament/data/services/events_service.dart';
import 'package:lebontemperament/data/services/rehearsals_service.dart';
import 'package:lebontemperament/data/services/storage_service.dart';
import 'package:logger/logger.dart';

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
}

final _off = Logger(level: Level.off);

Future<List<Map<String, dynamic>>> _serverDown() async =>
    throw Exception('SocketException: Failed host lookup');

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
  });
}
