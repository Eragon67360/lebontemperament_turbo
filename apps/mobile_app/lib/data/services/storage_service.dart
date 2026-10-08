import 'dart:convert';

import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/event.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';

/// The offline copy of the lists the app fetches (events, concerts,
/// rehearsals), so a member without network still sees the last ones.
///
/// Each list is one JSON object in shared preferences, keyed by row id in the
/// order the server sent them. Until #362 this lived in Hive boxes; the old
/// box files stay on the device and are no longer read.
class StorageService {
  final Logger _logger;
  SharedPreferences? _prefs;

  final _events = _CachedCollection<Event>(
    key: 'offline_cache.events',
    fromJson: Event.fromJson,
    toJson: (e) => e.toJson(),
    idOf: (e) => e.id,
  );
  final _concerts = _CachedCollection<Concert>(
    key: 'offline_cache.concerts',
    fromJson: Concert.fromJson,
    toJson: (c) => c.toJson(),
    idOf: (c) => c.id,
  );
  final _rehearsals = _CachedCollection<Rehearsal>(
    key: 'offline_cache.rehearsals',
    fromJson: Rehearsal.fromJson,
    toJson: (r) => r.toJson(),
    idOf: (r) => r.id,
  );

  StorageService({required Logger logger}) : _logger = logger;

  // Initialize storage
  Future<void> initialize() async {
    if (_prefs != null) return;

    try {
      _prefs = await SharedPreferences.getInstance();
      _logger.i('Storage service initialized');
    } catch (e) {
      _logger.e('Error initializing storage service: $e');
      rethrow;
    }
  }

  // Check if storage is initialized
  bool get isInitialized => _prefs != null;

  // Ensure storage is initialized
  Future<SharedPreferences> _ensureInitialized() async {
    await initialize();
    return _prefs!;
  }

  // Events storage
  Future<void> saveEvents(List<Event> events) async {
    try {
      await _events.replaceAll(await _ensureInitialized(), events);
      _logger.i('Saved ${events.length} events to local storage');
    } catch (e) {
      _logger.e('Error saving events: $e');
      rethrow;
    }
  }

  List<Event> getEvents() => _readAll(_events, 'events');

  Future<void> saveEvent(Event event) async {
    try {
      await _events.put(await _ensureInitialized(), event);
      _logger.i('Saved event: ${event.title}');
    } catch (e) {
      _logger.e('Error saving event: $e');
      rethrow;
    }
  }

  Event? getEvent(String id) => _readOne(_events, id, 'event');

  Future<void> deleteEvent(String id) async {
    try {
      await _events.delete(await _ensureInitialized(), id);
      _logger.i('Deleted event: $id');
    } catch (e) {
      _logger.e('Error deleting event: $e');
      rethrow;
    }
  }

  // Concerts storage
  Future<void> saveConcerts(List<Concert> concerts) async {
    try {
      await _concerts.replaceAll(await _ensureInitialized(), concerts);
      _logger.i('Saved ${concerts.length} concerts to local storage');
    } catch (e) {
      _logger.e('Error saving concerts: $e');
      rethrow;
    }
  }

  List<Concert> getConcerts() => _readAll(_concerts, 'concerts');

  Future<void> saveConcert(Concert concert) async {
    try {
      await _concerts.put(await _ensureInitialized(), concert);
      _logger.i('Saved concert: ${concert.name}');
    } catch (e) {
      _logger.e('Error saving concert: $e');
      rethrow;
    }
  }

  Concert? getConcert(String id) => _readOne(_concerts, id, 'concert');

  Future<void> deleteConcert(String id) async {
    try {
      await _concerts.delete(await _ensureInitialized(), id);
      _logger.i('Deleted concert: $id');
    } catch (e) {
      _logger.e('Error deleting concert: $e');
      rethrow;
    }
  }

  // Rehearsals storage
  Future<void> saveRehearsals(List<Rehearsal> rehearsals) async {
    try {
      await _rehearsals.replaceAll(await _ensureInitialized(), rehearsals);
      _logger.i('Saved ${rehearsals.length} rehearsals to local storage');
    } catch (e) {
      _logger.e('Error saving rehearsals: $e');
      rethrow;
    }
  }

  List<Rehearsal> getRehearsals() => _readAll(_rehearsals, 'rehearsals');

  Future<void> saveRehearsal(Rehearsal rehearsal) async {
    try {
      await _rehearsals.put(await _ensureInitialized(), rehearsal);
      _logger.i('Saved rehearsal: ${rehearsal.name}');
    } catch (e) {
      _logger.e('Error saving rehearsal: $e');
      rethrow;
    }
  }

  Rehearsal? getRehearsal(String id) => _readOne(_rehearsals, id, 'rehearsal');

  Future<void> deleteRehearsal(String id) async {
    try {
      await _rehearsals.delete(await _ensureInitialized(), id);
      _logger.i('Deleted rehearsal: $id');
    } catch (e) {
      _logger.e('Error deleting rehearsal: $e');
      rethrow;
    }
  }

  // Clear all data
  Future<void> clearAll() async {
    try {
      final prefs = await _ensureInitialized();
      for (final collection in [_events, _concerts, _rehearsals]) {
        await collection.clear(prefs);
      }
      _logger.i('Cleared all local storage');
    } catch (e) {
      _logger.e('Error clearing storage: $e');
      rethrow;
    }
  }

  // Get storage statistics
  Map<String, int> getStorageStats() {
    final prefs = _prefs;
    return {
      'events': prefs == null ? 0 : _events.length(prefs),
      'concerts': prefs == null ? 0 : _concerts.length(prefs),
      'rehearsals': prefs == null ? 0 : _rehearsals.length(prefs),
    };
  }

  List<T> _readAll<T>(_CachedCollection<T> collection, String label) {
    final prefs = _prefs;
    if (prefs == null) {
      _logger.w('Storage not initialized, returning empty list');
      return [];
    }
    try {
      return collection.values(prefs);
    } catch (e) {
      _logger.e('Error getting $label: $e');
      return [];
    }
  }

  T? _readOne<T>(_CachedCollection<T> collection, String id, String label) {
    final prefs = _prefs;
    if (prefs == null) {
      _logger.w('Storage not initialized, returning null');
      return null;
    }
    try {
      return collection.get(prefs, id);
    } catch (e) {
      _logger.e('Error getting $label: $e');
      return null;
    }
  }
}

/// One cached list: a JSON object of row id → row, in insertion order.
class _CachedCollection<T> {
  final String key;
  final T Function(Map<String, dynamic>) fromJson;
  final Map<String, dynamic> Function(T) toJson;
  final String Function(T) idOf;

  _CachedCollection({
    required this.key,
    required this.fromJson,
    required this.toJson,
    required this.idOf,
  });

  Map<String, dynamic> _rows(SharedPreferences prefs) {
    final raw = prefs.getString(key);
    if (raw == null) return {};
    return (jsonDecode(raw) as Map).cast<String, dynamic>();
  }

  Future<void> _write(SharedPreferences prefs, Map<String, dynamic> rows) =>
      prefs.setString(key, jsonEncode(rows));

  T _decode(Object? row) => fromJson((row as Map).cast<String, dynamic>());

  List<T> values(SharedPreferences prefs) =>
      _rows(prefs).values.map(_decode).toList();

  T? get(SharedPreferences prefs, String id) {
    final row = _rows(prefs)[id];
    return row == null ? null : _decode(row);
  }

  int length(SharedPreferences prefs) => _rows(prefs).length;

  Future<void> replaceAll(SharedPreferences prefs, List<T> items) =>
      _write(prefs, {for (final item in items) idOf(item): toJson(item)});

  Future<void> put(SharedPreferences prefs, T item) =>
      _write(prefs, _rows(prefs)..[idOf(item)] = toJson(item));

  Future<void> delete(SharedPreferences prefs, String id) =>
      _write(prefs, _rows(prefs)..remove(id));

  Future<void> clear(SharedPreferences prefs) => prefs.remove(key);
}
