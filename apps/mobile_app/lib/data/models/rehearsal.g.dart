// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rehearsal.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RehearsalImpl _$$RehearsalImplFromJson(Map<String, dynamic> json) =>
    _$RehearsalImpl(
      id: json['id'] as String,
      name: json['name'] as String?,
      place: json['place'] as String?,
      date: json['date'] as String?,
      startTime: json['start_time'] as String?,
      endTime: json['end_time'] as String?,
      groupType: $enumDecode(_$GroupTypeEnumMap, json['group_type']),
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
    );

Map<String, dynamic> _$$RehearsalImplToJson(_$RehearsalImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'place': instance.place,
      'date': instance.date,
      'start_time': instance.startTime,
      'end_time': instance.endTime,
      'group_type': _$GroupTypeEnumMap[instance.groupType]!,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
    };

const _$GroupTypeEnumMap = {
  GroupType.orchestre: 'Orchestre',
  GroupType.hommes: 'Hommes',
  GroupType.femmes: 'Femmes',
  GroupType.jeunesEnfants: 'Jeunes/Enfants',
  GroupType.choeurComplet: 'Choeur complet',
  GroupType.tous: 'Tous',
};
