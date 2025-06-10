import 'package:freezed_annotation/freezed_annotation.dart';

part 'rehearsal.freezed.dart';
part 'rehearsal.g.dart';

enum GroupType {
  @JsonValue('Orchestre')
  orchestre,
  @JsonValue('Hommes')
  hommes,
  @JsonValue('Femmes')
  femmes,
  @JsonValue('Jeunes/Enfants')
  jeunesEnfants,
  @JsonValue('Choeur complet')
  choeurComplet,
  @JsonValue('Tous')
  tous,
}

@freezed
class Rehearsal with _$Rehearsal {
  const factory Rehearsal({
    required String id,
    String? name,
    String? place,
    String? date,
    @JsonKey(name: 'start_time') String? startTime,
    @JsonKey(name: 'end_time') String? endTime,
    @JsonKey(name: 'group_type') required GroupType groupType,
    @JsonKey(name: 'created_at') String? createdAt,
    @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _Rehearsal;

  factory Rehearsal.fromJson(Map<String, dynamic> json) =>
      _$RehearsalFromJson(json);
}
