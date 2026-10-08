/// A signalement: a problem a member reported from the app or the admin,
/// with the conversation that follows (`bug_reports`, `bug_messages`).
library;

enum BugReportStatus {
  pending('pending', 'En attente'),
  inProgress('in_progress', 'En cours'),
  resolved('resolved', 'Résolu');

  const BugReportStatus(this.value, this.label);

  /// Value stored in `bug_reports.status`.
  final String value;

  /// What the member reads (same words as the admin's « Signalements »).
  final String label;

  /// An unknown or missing value reads as « En attente », as in the admin.
  static BugReportStatus fromValue(String? value) => BugReportStatus.values
      .firstWhere((s) => s.value == value, orElse: () => pending);
}

/// Who wrote a report or a message: the display name, else the e-mail.
String personLabel(Map<String, dynamic>? profile) {
  final name = (profile?['display_name'] as String?)?.trim();
  if (name != null && name.isNotEmpty) return name;
  final email = (profile?['email'] as String?)?.trim();
  if (email != null && email.isNotEmpty) return email;
  return 'Un membre';
}

/// A profile embedded by PostgREST: an object, or a one-item list.
Map<String, dynamic>? _embedded(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is List && value.isNotEmpty && value.first is Map) {
    return Map<String, dynamic>.from(value.first as Map);
  }
  return null;
}

class BugMessage {
  const BugMessage({
    required this.id,
    required this.reportId,
    required this.senderId,
    required this.message,
    required this.createdAt,
    required this.isRead,
    required this.senderName,
  });

  final String id;
  final String reportId;
  final String senderId;
  final String message;
  final DateTime createdAt;
  final bool isRead;
  final String senderName;

  /// Columns read for a message, with the sender's name.
  static const select =
      'id, bug_report_id, sender_id, message, created_at, is_read, '
      'sender:profiles!sender_id(email, display_name)';

  factory BugMessage.fromJson(Map<String, dynamic> json) => BugMessage(
    id: json['id'] as String,
    reportId: json['bug_report_id'] as String,
    senderId: json['sender_id'] as String,
    message: json['message'] as String,
    createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
    isRead: json['is_read'] as bool? ?? false,
    senderName: personLabel(_embedded(json['sender'])),
  );
}

class BugReport {
  const BugReport({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.reportedBy,
    required this.createdAt,
    required this.isRead,
    required this.authorName,
    this.screenshotPaths = const [],
    this.fromApp = false,
    this.appInfo,
    this.messages = const [],
  });

  final String id;
  final String title;
  final String description;
  final BugReportStatus status;
  final String reportedBy;
  final DateTime createdAt;

  /// Seen by a superadmin.
  final bool isRead;
  final String authorName;
  final List<String> screenshotPaths;
  final bool fromApp;
  final String? appInfo;

  /// Only `sender_id`, `is_read` and `created_at` in lists (for the counts);
  /// the whole conversation is read on its own screen.
  final List<BugMessageSummary> messages;

  /// Columns read for a list: the report, its author, and a summary of each
  /// message (who, read or not, when).
  static const select =
      'id, title, description, status, reported_by, created_at, is_read, '
      'screenshot_paths, source, app_info, '
      'profiles:reported_by(email, display_name), '
      'bug_messages(sender_id, is_read, created_at)';

  /// Messages from someone other than [userId] that they haven't read.
  int unreadFor(String userId) =>
      messages.where((m) => m.senderId != userId && !m.isRead).length;

  /// The latest message's date, else the report's.
  DateTime get lastActivity => messages.fold(
    createdAt,
    (latest, m) => m.createdAt.isAfter(latest) ? m.createdAt : latest,
  );

  factory BugReport.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['bug_messages'];
    return BugReport(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      status: BugReportStatus.fromValue(json['status'] as String?),
      reportedBy: json['reported_by'] as String,
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      isRead: json['is_read'] as bool? ?? false,
      authorName: personLabel(_embedded(json['profiles'])),
      screenshotPaths: [
        for (final p in (json['screenshot_paths'] as List? ?? const []))
          if (p is String) p,
      ],
      fromApp: json['source'] == 'app',
      appInfo: json['app_info'] as String?,
      messages: [
        if (rawMessages is List)
          for (final m in rawMessages)
            if (m is Map) BugMessageSummary.fromJson(Map.from(m)),
      ],
    );
  }
}

class BugMessageSummary {
  const BugMessageSummary({
    required this.senderId,
    required this.isRead,
    required this.createdAt,
  });

  final String senderId;
  final bool isRead;
  final DateTime createdAt;

  factory BugMessageSummary.fromJson(Map<String, dynamic> json) =>
      BugMessageSummary(
        senderId: json['sender_id'] as String,
        isRead: json['is_read'] as bool? ?? false,
        createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      );
}
