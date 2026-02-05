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
    @HiveField(7)
    @JsonKey(name: 'additional_informations')
    String? additionalInformations,
    @HiveField(8) String? name,
    @HiveField(9) String? createdBy,
    @HiveField(10) String? affiche,
  }) = _Concert;

  factory Concert.fromJson(Map<String, dynamic> json) =>
      _$ConcertFromJson(_normalizeJson(json));

  /// Ensures additional_informations is present (API/realtime may use snake_case or camelCase).
  static Map<String, dynamic> _normalizeJson(Map<String, dynamic> json) {
    final map = Map<String, dynamic>.from(json);
    if (map['additional_informations'] == null &&
        map['additionalInformations'] != null) {
      map['additional_informations'] = map['additionalInformations'];
    }
    return map;
  }
}
