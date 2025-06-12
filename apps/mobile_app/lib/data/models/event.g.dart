// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$EventImpl _$$EventImplFromJson(Map<String, dynamic> json) => _$EventImpl(
      id: json['id'] as String,
      title: json['title'] as String?,
      dateFrom: json['date_from'] as String?,
      dateTo: json['date_to'] as String?,
      time: json['time'] as String?,
      location: json['location'] as String?,
      responsibleName: json['responsible_name'] as String?,
      responsibleEmail: json['responsible_email'] as String?,
      eventType: $enumDecode(_$EventTypeEnumMap, json['event_type']),
      description: json['description'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      link: json['link'] as String?,
      isPublic: json['is_public'] as bool?,
    );

Map<String, dynamic> _$$EventImplToJson(_$EventImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'date_from': instance.dateFrom,
      'date_to': instance.dateTo,
      'time': instance.time,
      'location': instance.location,
      'responsible_name': instance.responsibleName,
      'responsible_email': instance.responsibleEmail,
      'event_type': _$EventTypeEnumMap[instance.eventType]!,
      'description': instance.description,
      'created_at': instance.createdAt,
      'updated_at': instance.updatedAt,
      'link': instance.link,
      'is_public': instance.isPublic,
    };

const _$EventTypeEnumMap = {
  EventType.concert: 'concert',
  EventType.vente: 'vente',
  EventType.repetition: 'repetition',
  EventType.autre: 'autre',
};
