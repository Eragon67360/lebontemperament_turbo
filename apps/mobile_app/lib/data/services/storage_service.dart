import 'package:hive_flutter/hive_flutter.dart';
import 'package:logger/logger.dart';

import '../models/announcement.dart';
import '../models/user.dart';
import '../models/event.dart';
import '../models/concert.dart';
import '../models/rehearsal.dart';

class StorageService {
  final Logger _logger;
  Box<Announcement>? _announcementsBox;
  Box<User>? _usersBox;
  Box<Event>? _eventsBox;
  Box<Concert>? _concertsBox;
  Box<Rehearsal>? _rehearsalsBox;
  bool _isInitialized = false;

  StorageService({required Logger logger}) : _logger = logger;

  // Initialize storage
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _announcementsBox = Hive.box<Announcement>('announcements');
      _usersBox = Hive.box<User>('users');
      _eventsBox = Hive.box<Event>('events');
      _concertsBox = Hive.box<Concert>('concerts');
      _rehearsalsBox = Hive.box<Rehearsal>('rehearsals');
      _isInitialized = true;
      _logger.i('Storage service initialized');
    } catch (e) {
      _logger.e('Error initializing storage service: $e');
      rethrow;
    }
  }

  // Check if storage is initialized
  bool get isInitialized => _isInitialized;

  // Ensure storage is initialized
  Future<void> _ensureInitialized() async {
    if (!_isInitialized) {
      await initialize();
    }
  }

  // Announcements storage
  Future<void> saveAnnouncements(List<Announcement> announcements) async {
    await _ensureInitialized();
    try {
      await _announcementsBox!.clear();
      await _announcementsBox!.addAll(announcements);
      _logger.i('Saved ${announcements.length} announcements to local storage');
    } catch (e) {
      _logger.e('Error saving announcements: $e');
      rethrow;
    }
  }

  List<Announcement> getAnnouncements() {
    if (!_isInitialized || _announcementsBox == null) {
      _logger.w('Storage not initialized, returning empty list');
      return [];
    }
    try {
      return _announcementsBox!.values.toList();
    } catch (e) {
      _logger.e('Error getting announcements: $e');
      return [];
    }
  }

  Future<void> saveAnnouncement(Announcement announcement) async {
    await _ensureInitialized();
    try {
      await _announcementsBox!.put(announcement.id, announcement);
      _logger.i('Saved announcement: ${announcement.title}');
    } catch (e) {
      _logger.e('Error saving announcement: $e');
      rethrow;
    }
  }

  Announcement? getAnnouncement(String id) {
    if (!_isInitialized || _announcementsBox == null) {
      _logger.w('Storage not initialized, returning null');
      return null;
    }
    try {
      return _announcementsBox!.get(id);
    } catch (e) {
      _logger.e('Error getting announcement: $e');
      return null;
    }
  }

  Future<void> deleteAnnouncement(String id) async {
    await _ensureInitialized();
    try {
      await _announcementsBox!.delete(id);
      _logger.i('Deleted announcement: $id');
    } catch (e) {
      _logger.e('Error deleting announcement: $e');
      rethrow;
    }
  }

  // Users storage
  Future<void> saveUser(User user) async {
    await _ensureInitialized();
    try {
      await _usersBox!.put(user.id, user);
      _logger.i('Saved user: ${user.email}');
    } catch (e) {
      _logger.e('Error saving user: $e');
      rethrow;
    }
  }

  User? getUser(String id) {
    if (!_isInitialized || _usersBox == null) {
      _logger.w('Storage not initialized, returning null');
      return null;
    }
    try {
      return _usersBox!.get(id);
    } catch (e) {
      _logger.e('Error getting user: $e');
      return null;
    }
  }

  Future<void> deleteUser(String id) async {
    await _ensureInitialized();
    try {
      await _usersBox!.delete(id);
      _logger.i('Deleted user: $id');
    } catch (e) {
      _logger.e('Error deleting user: $e');
      rethrow;
    }
  }

  // Events storage
  Future<void> saveEvents(List<Event> events) async {
    await _ensureInitialized();
    try {
      await _eventsBox!.clear();
      await _eventsBox!.addAll(events);
      _logger.i('Saved ${events.length} events to local storage');
    } catch (e) {
      _logger.e('Error saving events: $e');
      rethrow;
    }
  }

  List<Event> getEvents() {
    if (!_isInitialized || _eventsBox == null) {
      _logger.w('Storage not initialized, returning empty list');
      return [];
    }
    try {
      return _eventsBox!.values.toList();
    } catch (e) {
      _logger.e('Error getting events: $e');
      return [];
    }
  }

  Future<void> saveEvent(Event event) async {
    await _ensureInitialized();
    try {
      await _eventsBox!.put(event.id, event);
      _logger.i('Saved event: ${event.title}');
    } catch (e) {
      _logger.e('Error saving event: $e');
      rethrow;
    }
  }

  Event? getEvent(String id) {
    if (!_isInitialized || _eventsBox == null) {
      _logger.w('Storage not initialized, returning null');
      return null;
    }
    try {
      return _eventsBox!.get(id);
    } catch (e) {
      _logger.e('Error getting event: $e');
      return null;
    }
  }

  Future<void> deleteEvent(String id) async {
    await _ensureInitialized();
    try {
      await _eventsBox!.delete(id);
      _logger.i('Deleted event: $id');
    } catch (e) {
      _logger.e('Error deleting event: $e');
      rethrow;
    }
  }

  // Concerts storage
  Future<void> saveConcerts(List<Concert> concerts) async {
    await _ensureInitialized();
    try {
      await _concertsBox!.clear();
      await _concertsBox!.addAll(concerts);
      _logger.i('Saved ${concerts.length} concerts to local storage');
    } catch (e) {
      _logger.e('Error saving concerts: $e');
      rethrow;
    }
  }

  List<Concert> getConcerts() {
    if (!_isInitialized || _concertsBox == null) {
      _logger.w('Storage not initialized, returning empty list');
      return [];
    }
    try {
      return _concertsBox!.values.toList();
    } catch (e) {
      _logger.e('Error getting concerts: $e');
      return [];
    }
  }

  Future<void> saveConcert(Concert concert) async {
    await _ensureInitialized();
    try {
      await _concertsBox!.put(concert.id, concert);
      _logger.i('Saved concert: ${concert.name}');
    } catch (e) {
      _logger.e('Error saving concert: $e');
      rethrow;
    }
  }

  Concert? getConcert(String id) {
    if (!_isInitialized || _concertsBox == null) {
      _logger.w('Storage not initialized, returning null');
      return null;
    }
    try {
      return _concertsBox!.get(id);
    } catch (e) {
      _logger.e('Error getting concert: $e');
      return null;
    }
  }

  Future<void> deleteConcert(String id) async {
    await _ensureInitialized();
    try {
      await _concertsBox!.delete(id);
      _logger.i('Deleted concert: $id');
    } catch (e) {
      _logger.e('Error deleting concert: $e');
      rethrow;
    }
  }

  // Rehearsals storage
  Future<void> saveRehearsals(List<Rehearsal> rehearsals) async {
    await _ensureInitialized();
    try {
      await _rehearsalsBox!.clear();
      await _rehearsalsBox!.addAll(rehearsals);
      _logger.i('Saved ${rehearsals.length} rehearsals to local storage');
    } catch (e) {
      _logger.e('Error saving rehearsals: $e');
      rethrow;
    }
  }

  List<Rehearsal> getRehearsals() {
    if (!_isInitialized || _rehearsalsBox == null) {
      _logger.w('Storage not initialized, returning empty list');
      return [];
    }
    try {
      return _rehearsalsBox!.values.toList();
    } catch (e) {
      _logger.e('Error getting rehearsals: $e');
      return [];
    }
  }

  Future<void> saveRehearsal(Rehearsal rehearsal) async {
    await _ensureInitialized();
    try {
      await _rehearsalsBox!.put(rehearsal.id, rehearsal);
      _logger.i('Saved rehearsal: ${rehearsal.name}');
    } catch (e) {
      _logger.e('Error saving rehearsal: $e');
      rethrow;
    }
  }

  Rehearsal? getRehearsal(String id) {
    if (!_isInitialized || _rehearsalsBox == null) {
      _logger.w('Storage not initialized, returning null');
      return null;
    }
    try {
      return _rehearsalsBox!.get(id);
    } catch (e) {
      _logger.e('Error getting rehearsal: $e');
      return null;
    }
  }

  Future<void> deleteRehearsal(String id) async {
    await _ensureInitialized();
    try {
      await _rehearsalsBox!.delete(id);
      _logger.i('Deleted rehearsal: $id');
    } catch (e) {
      _logger.e('Error deleting rehearsal: $e');
      rethrow;
    }
  }

  // Clear all data
  Future<void> clearAll() async {
    await _ensureInitialized();
    try {
      await _announcementsBox!.clear();
      await _usersBox!.clear();
      await _eventsBox!.clear();
      await _concertsBox!.clear();
      await _rehearsalsBox!.clear();
      _logger.i('Cleared all local storage');
    } catch (e) {
      _logger.e('Error clearing storage: $e');
      rethrow;
    }
  }

  // Get storage statistics
  Map<String, int> getStorageStats() {
    if (!_isInitialized) {
      return {
        'announcements': 0,
        'users': 0,
        'events': 0,
        'concerts': 0,
        'rehearsals': 0,
      };
    }

    return {
      'announcements': _announcementsBox?.length ?? 0,
      'users': _usersBox?.length ?? 0,
      'events': _eventsBox?.length ?? 0,
      'concerts': _concertsBox?.length ?? 0,
      'rehearsals': _rehearsalsBox?.length ?? 0,
    };
  }
}
