import 'package:hive/hive.dart';

part 'event.g.dart';

@HiveType(typeId: 0)
enum EventType {
  @HiveField(0)
  concert,
  @HiveField(1)
  rehearsal,
}

@HiveType(typeId: 1)
class Event extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final DateTime date;

  @HiveField(3)
  final String location;

  @HiveField(4)
  final String description;

  @HiveField(5)
  final EventType type;

  @HiveField(6)
  final DateTime? createdAt;

  @HiveField(7)
  final DateTime? updatedAt;

  @HiveField(8)
  final String? imageUrl;

  @HiveField(9)
  final bool isPublished;

  Event({
    required this.id,
    required this.title,
    required this.date,
    required this.location,
    required this.description,
    required this.type,
    this.createdAt,
    this.updatedAt,
    this.imageUrl,
    this.isPublished = true,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as String,
      title: json['title'] as String,
      date: DateTime.parse(json['date'] as String),
      location: json['location'] as String,
      description: json['description'] as String,
      type: EventType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => EventType.concert,
      ),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'] as String)
          : null,
      imageUrl: json['image_url'] as String?,
      isPublished: json['is_published'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'date': date.toIso8601String(),
      'location': location,
      'description': description,
      'type': type.name,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'image_url': imageUrl,
      'is_published': isPublished,
    };
  }

  Event copyWith({
    String? id,
    String? title,
    DateTime? date,
    String? location,
    String? description,
    EventType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? imageUrl,
    bool? isPublished,
  }) {
    return Event(
      id: id ?? this.id,
      title: title ?? this.title,
      date: date ?? this.date,
      location: location ?? this.location,
      description: description ?? this.description,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      imageUrl: imageUrl ?? this.imageUrl,
      isPublished: isPublished ?? this.isPublished,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Event && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
