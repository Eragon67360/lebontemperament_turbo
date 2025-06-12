import 'package:hive/hive.dart';

part 'announcement.g.dart';

@HiveType(typeId: 2)
class Announcement extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String content;

  @HiveField(3)
  final DateTime publishedAt;

  @HiveField(4)
  final DateTime? createdAt;

  @HiveField(5)
  final DateTime? updatedAt;

  @HiveField(6)
  final bool isPublished;

  @HiveField(7)
  final String? authorId;

  Announcement({
    required this.id,
    required this.title,
    required this.content,
    required this.publishedAt,
    this.createdAt,
    this.updatedAt,
    this.isPublished = true,
    this.authorId,
  });

  factory Announcement.fromJson(Map<String, dynamic> json) {
    return Announcement(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      publishedAt: DateTime.parse(json['published_at'] as String),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      isPublished: json['is_published'] as bool? ?? true,
      authorId: json['author_id'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'published_at': publishedAt.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'is_published': isPublished,
      'author_id': authorId,
    };
  }

  Announcement copyWith({
    String? id,
    String? title,
    String? content,
    DateTime? publishedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isPublished,
    String? authorId,
  }) {
    return Announcement(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      publishedAt: publishedAt ?? this.publishedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isPublished: isPublished ?? this.isPublished,
      authorId: authorId ?? this.authorId,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Announcement && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
