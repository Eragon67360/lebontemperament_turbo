// freezed copies @JsonKey onto the generated fields, where it is valid.
// ignore_for_file: invalid_annotation_target

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
    @JsonKey(name: 'additional_informations') String? additionalInformations,
    String? name,
    String? createdBy,
    String? affiche,
    // Where and how to come, as the website shows them (public part, #593).
    @JsonKey(name: 'venue_name') String? venueName,
    @JsonKey(name: 'street_address') String? streetAddress,
    @JsonKey(name: 'postal_code') String? postalCode,
    String? city,
    double? price,
    @JsonKey(name: 'is_free') bool? isFree,
    @JsonKey(name: 'related_link') String? relatedLink,
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
