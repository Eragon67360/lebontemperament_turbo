// freezed copies @JsonKey onto the generated fields, where it is valid.
// ignore_for_file: invalid_annotation_target

import 'package:freezed_annotation/freezed_annotation.dart';

part 'event.freezed.dart';
part 'event.g.dart';

enum EventType {
  @JsonValue('concert')
  concert,
  @JsonValue('vente')
  vente,
  @JsonValue('repetition')
  repetition,
  @JsonValue('sejour')
  sejour,
  @JsonValue('autre')
  autre,
}

@freezed
abstract class Event with _$Event {
  const factory Event({
    required String id,
    String? title,
    @JsonKey(name: 'date_from') String? dateFrom,
    @JsonKey(name: 'date_to') String? dateTo,
    String? time,
    String? location,
    @JsonKey(name: 'responsible_name') String? responsibleName,
    @JsonKey(name: 'responsible_email') String? responsibleEmail,
    @JsonKey(name: 'event_type') required EventType eventType,
    String? description,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
    String? link,
    @JsonKey(name: 'is_public') bool? isPublic,
  }) = _Event;

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);
}
