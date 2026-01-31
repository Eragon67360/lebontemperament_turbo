import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:hive/hive.dart';

part 'concert.freezed.dart';
part 'concert.g.dart';

enum Context {
  @JsonValue('orchestre')
  orchestre,
  @JsonValue('choeur')
  choeur,
  @JsonValue('orchestre_et_choeur')
  orchestreEtChoeur,
  @JsonValue('autre')
  autre,
}

@freezed
@HiveType(typeId: 5)
class Concert with _$Concert {
  const factory Concert({
    @HiveField(0) required String id,
    @HiveField(1) String? createdAt,
    @HiveField(2) String? updatedAt,
    @HiveField(3) required String place,
    @HiveField(4) required String date,
    @HiveField(5) required String time,
    @HiveField(6) required Context context,
    @HiveField(7) String? additionalInformations,
    @HiveField(8) String? name,
    @HiveField(9) String? createdBy,
    @HiveField(10) String? affiche,
  }) = _Concert;

  factory Concert.fromJson(Map<String, dynamic> json) =>
      _$ConcertFromJson(json);
}
