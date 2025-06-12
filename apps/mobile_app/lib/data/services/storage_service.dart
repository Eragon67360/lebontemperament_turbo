import 'package:hive_flutter/hive_flutter.dart';
import 'package:logger/logger.dart';

import '../models/announcement.dart';
import '../models/user.dart';

class StorageService {
  final Logger _logger;
  late Box<Announcement> _announcementsBox;
  late Box<User> _usersBox;

  StorageService({required Logger logger}) : _logger = logger;

  // Initialize storage
  Future<void> initialize() async {
    _announcementsBox = Hive.box<Announcement>('announcements');
    _usersBox = Hive.box<User>('users');
    _logger.i('Storage service initialized');
  }

  // Announcements storage
  Future<void> saveAnnouncements(List<Announcement> announcements) async {
    try {
      await _announcementsBox.clear();
      await _announcementsBox.addAll(announcements);
      _logger.i('Saved ${announcements.length} announcements to local storage');
    } catch (e) {
      _logger.e('Error saving announcements: $e');
      rethrow;
    }
  }

  List<Announcement> getAnnouncements() {
    try {
      return _announcementsBox.values.toList();
    } catch (e) {
      _logger.e('Error getting announcements: $e');
      return [];
    }
  }

  Future<void> saveAnnouncement(Announcement announcement) async {
    try {
      await _announcementsBox.put(announcement.id, announcement);
      _logger.i('Saved announcement: ${announcement.title}');
    } catch (e) {
      _logger.e('Error saving announcement: $e');
      rethrow;
    }
  }

  Announcement? getAnnouncement(String id) {
    try {
      return _announcementsBox.get(id);
    } catch (e) {
      _logger.e('Error getting announcement: $e');
      return null;
    }
  }

  Future<void> deleteAnnouncement(String id) async {
    try {
      await _announcementsBox.delete(id);
      _logger.i('Deleted announcement: $id');
    } catch (e) {
      _logger.e('Error deleting announcement: $e');
      rethrow;
    }
  }

  // Users storage
  Future<void> saveUser(User user) async {
    try {
      await _usersBox.put(user.id, user);
      _logger.i('Saved user: ${user.email}');
    } catch (e) {
      _logger.e('Error saving user: $e');
      rethrow;
    }
  }

  User? getUser(String id) {
    try {
      return _usersBox.get(id);
    } catch (e) {
      _logger.e('Error getting user: $e');
      return null;
    }
  }

  Future<void> deleteUser(String id) async {
    try {
      await _usersBox.delete(id);
      _logger.i('Deleted user: $id');
    } catch (e) {
      _logger.e('Error deleting user: $e');
      rethrow;
    }
  }

  // Clear all data
  Future<void> clearAll() async {
    try {
      await _announcementsBox.clear();
      await _usersBox.clear();
      _logger.i('Cleared all local storage');
    } catch (e) {
      _logger.e('Error clearing storage: $e');
      rethrow;
    }
  }

  // Get storage statistics
  Map<String, int> getStorageStats() {
    return {
      'announcements': _announcementsBox.length,
      'users': _usersBox.length,
    };
  }
}
