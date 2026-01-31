import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

part 'event.freezed.dart';
part 'event.g.dart';

enum EventType {
  @JsonValue('concert')
  concert,
  @JsonValue('vente')
  vente,
  @JsonValue('repetition')
  repetition,
  @JsonValue('autre')
  autre,
}

@freezed
@HiveType(typeId: 4)
class Event with _$Event {
  const factory Event({
    @HiveField(0) required String id,
    @HiveField(1) String? title,
    @HiveField(2) @JsonKey(name: 'date_from') String? dateFrom,
    @HiveField(3) @JsonKey(name: 'date_to') String? dateTo,
    @HiveField(4) String? time,
    @HiveField(5) String? location,
    @HiveField(6) @JsonKey(name: 'responsible_name') String? responsibleName,
    @HiveField(7) @JsonKey(name: 'responsible_email') String? responsibleEmail,
    @HiveField(8) @JsonKey(name: 'event_type') required EventType eventType,
    @HiveField(9) String? description,
    @HiveField(10) @JsonKey(name: 'created_at') String? createdAt,
    @HiveField(11) @JsonKey(name: 'updated_at') String? updatedAt,
    @HiveField(12) String? link,
    @HiveField(13) @JsonKey(name: 'is_public') bool? isPublic,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}
