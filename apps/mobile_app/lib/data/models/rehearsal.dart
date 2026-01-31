import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

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
@HiveType(typeId: 6)
class Rehearsal with _$Rehearsal {
  const factory Rehearsal({
    @HiveField(0) required String id,
    @HiveField(1) String? name,
    @HiveField(2) String? place,
    @HiveField(3) String? date,
    @HiveField(4) @JsonKey(name: 'start_time') String? startTime,
    @HiveField(5) @JsonKey(name: 'end_time') String? endTime,
    @HiveField(6) @JsonKey(name: 'group_type') required GroupType groupType,
    @HiveField(7) @JsonKey(name: 'created_at') String? createdAt,
    @HiveField(8) @JsonKey(name: 'updated_at') String? updatedAt,
  }) = _Rehearsal;

  factory Rehearsal.fromJson(Map<String, dynamic> json) =>
      _$RehearsalFromJson(json);
}
