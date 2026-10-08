import 'dart:typed_data';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../models/bug_report.dart';

/// At most this many screenshots per report (the database refuses more).
const kMaxBugScreenshots = 3;

/// The bucket refuses files over 5 MB.
const kMaxBugScreenshotBytes = 5 * 1024 * 1024;

/// Content type of an image by its first bytes: JPEG, PNG or WebP (what the
/// bucket accepts), else null.
String? bugScreenshotContentType(Uint8List bytes) {
  if (bytes.length >= 3 &&
      bytes[0] == 0xFF &&
      bytes[1] == 0xD8 &&
      bytes[2] == 0xFF) {
    return 'image/jpeg';
  }
  if (bytes.length >= 8 &&
      bytes[0] == 0x89 &&
      bytes[1] == 0x50 &&
      bytes[2] == 0x4E &&
      bytes[3] == 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 12 &&
      String.fromCharCodes(bytes.sublist(0, 4)) == 'RIFF' &&
      String.fromCharCodes(bytes.sublist(8, 12)) == 'WEBP') {
    return 'image/webp';
  }
  return null;
}

/// Signalements: what a member sent and the conversation that follows, and
/// for superadmins every report. Rights are the database's (RLS): a member
/// reads and answers only their own reports.
abstract class BugReportsService {
  /// The signed-in member's reports, newest first.
  Future<List<BugReport>> myReports();

  /// Every report (superadmins; others get only their own).
  Future<List<BugReport>> allReports();

  Future<BugReport?> report(String id);

  Future<List<BugMessage>> messages(String reportId);

  /// Uploads one screenshot to the member's folder; returns its path.
  Future<String> uploadScreenshot(Uint8List bytes, String contentType);

  /// Removes screenshots uploaded for a report that could not be sent.
  Future<void> removeScreenshots(List<String> paths);

  /// Sends the report; returns its id.
  Future<String> createReport({
    required String title,
    required String description,
    required List<String> screenshotPaths,
    required String appInfo,
  });

  Future<void> sendMessage({
    required String reportId,
    required String message,
    String? receiverId,
  });

  /// Marks the other side's messages read (and the report, for a superadmin).
  Future<void> markRead(String reportId);

  /// Superadmins only.
  Future<void> setStatus(String reportId, BugReportStatus status);

  /// Short-lived links to screenshots, in order; a file that can't be read
  /// is left out.
  Future<List<String>> screenshotUrls(List<String> paths);

  String? get currentUserId;
}

class SupabaseBugReportsService implements BugReportsService {
  SupabaseBugReportsService([SupabaseClient? client]) : _client = client;

  final SupabaseClient? _client;
  SupabaseClient get _db => _client ?? Supabase.instance.client;

  static const _bucket = 'bug-screenshots';
  static const _linkSeconds = 60 * 60;

  @override
  String? get currentUserId => _db.auth.currentUser?.id;

  String get _uid {
    final id = currentUserId;
    if (id == null) throw const AuthException('Not signed in');
    return id;
  }

  @override
  Future<List<BugReport>> myReports() async {
    final rows = await _db
        .from('bug_reports')
        .select(BugReport.select)
        .eq('reported_by', _uid)
        .order('created_at', ascending: false);
    return rows.map(BugReport.fromJson).toList();
  }

  @override
  Future<List<BugReport>> allReports() async {
    final rows = await _db
        .from('bug_reports')
        .select(BugReport.select)
        .order('created_at', ascending: false);
    return rows.map(BugReport.fromJson).toList();
  }

  @override
  Future<BugReport?> report(String id) async {
    final row = await _db
        .from('bug_reports')
        .select(BugReport.select)
        .eq('id', id)
        .maybeSingle();
    return row == null ? null : BugReport.fromJson(row);
  }

  @override
  Future<List<BugMessage>> messages(String reportId) async {
    final rows = await _db
        .from('bug_messages')
        .select(BugMessage.select)
        .eq('bug_report_id', reportId)
        .order('created_at', ascending: true);
    return rows.map(BugMessage.fromJson).toList();
  }

  @override
  Future<String> uploadScreenshot(Uint8List bytes, String contentType) async {
    final ext = switch (contentType) {
      'image/png' => 'png',
      'image/webp' => 'webp',
      _ => 'jpg',
    };
    final path = '$_uid/${const Uuid().v4()}.$ext';
    await _db.storage
        .from(_bucket)
        .uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(contentType: contentType, upsert: false),
        );
    return path;
  }

  @override
  Future<void> removeScreenshots(List<String> paths) async {
    if (paths.isEmpty) return;
    await _db.storage.from(_bucket).remove(paths);
  }

  @override
  Future<String> createReport({
    required String title,
    required String description,
    required List<String> screenshotPaths,
    required String appInfo,
  }) async {
    final row = await _db
        .from('bug_reports')
        .insert({
          'title': title,
          'description': description,
          'reported_by': _uid,
          'screenshot_paths': screenshotPaths,
          'source': 'app',
          'app_info': appInfo,
        })
        .select('id')
        .single();
    return row['id'] as String;
  }

  @override
  Future<void> sendMessage({
    required String reportId,
    required String message,
    String? receiverId,
  }) async {
    await _db.from('bug_messages').insert({
      'bug_report_id': reportId,
      'sender_id': _uid,
      'receiver_id': ?receiverId,
      'message': message,
    });
  }

  @override
  Future<void> markRead(String reportId) async {
    await _db.rpc('mark_bug_report_read', params: {'p_report_id': reportId});
  }

  @override
  Future<void> setStatus(String reportId, BugReportStatus status) async {
    await _db
        .from('bug_reports')
        .update({'status': status.value})
        .eq('id', reportId);
  }

  @override
  Future<List<String>> screenshotUrls(List<String> paths) async {
    if (paths.isEmpty) return const [];
    final signed = await _db.storage
        .from(_bucket)
        .createSignedUrls(paths, _linkSeconds);
    return [
      for (final s in signed)
        if (s.signedUrl.isNotEmpty) s.signedUrl,
    ];
  }
}
