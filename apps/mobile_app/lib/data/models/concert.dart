import 'package:freezed_annotation/freezed_annotation.dart';

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
class Concert with _$Concert {
  const factory Concert({
    required String id,
    String? createdAt,
    String? updatedAt,
    required String place,
    required String date,
    required String time,
    required Context context,
    String? additionalInformations,
    String? name,
    String? createdBy,
    String? affiche,
  }) = _Concert;

  factory Concert.fromJson(Map<String, dynamic> json) =>
      _$ConcertFromJson(json);
}
