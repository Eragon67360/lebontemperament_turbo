// freezed copies @JsonKey onto the generated fields, where it is valid.
// ignore_for_file: invalid_annotation_target

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
abstract class Rehearsal with _$Rehearsal {
  const factory Rehearsal({
    required String id,
    String? name,
    String? place,
    // Complete postal address for the maps app; null = search `place`.
    String? address,
    // Room inside the building (« Salle 12 »), shown but never searched.
    String? room,
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

extension RehearsalWhere on Rehearsal {
  /// « Conservatoire de Strasbourg · Salle 12 », or the place alone. The
  /// dot sticks to the place and the room never splits (« Salle / 12 »), so
  /// a long line breaks before the room, not inside it.
  String? get placeWithRoom {
    final p = place?.trim() ?? '';
    final r = (room?.trim() ?? '').replaceAll(' ', '\u00A0');
    if (p.isEmpty) return r.isEmpty ? null : r;
    return r.isEmpty ? p : '$p\u00A0· $r';
  }

  /// What « Itinéraire » searches: the full address, else the place. Never
  /// the room, which would send the map to a street that does not exist.
  String? get directionsQuery {
    final a = address?.trim() ?? '';
    if (a.isNotEmpty) return a;
    final p = place?.trim() ?? '';
    return p.isEmpty ? null : p;
  }
}
