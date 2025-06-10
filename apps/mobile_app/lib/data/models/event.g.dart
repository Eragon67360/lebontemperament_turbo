// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'event.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class EventAdapter extends TypeAdapter<Event> {
  @override
  final int typeId = 4;

  @override
  Event read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Event(
      id: fields[0] as String,
      title: fields[1] as String?,
      dateFrom: fields[2] as String?,
      dateTo: fields[3] as String?,
      time: fields[4] as String?,
      location: fields[5] as String?,
      responsibleName: fields[6] as String?,
      responsibleEmail: fields[7] as String?,
      eventType: fields[8] as EventType,
      description: fields[9] as String?,
      createdAt: fields[10] as String?,
      updatedAt: fields[11] as String?,
      link: fields[12] as String?,
      isPublic: fields[13] as bool?,
    );
  }

  @override
  void write(BinaryWriter writer, Event obj) {
    writer
      ..writeByte(14)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.dateFrom)
      ..writeByte(3)
      ..write(obj.dateTo)
      ..writeByte(4)
      ..write(obj.time)
      ..writeByte(5)
      ..write(obj.location)
      ..writeByte(6)
      ..write(obj.responsibleName)
      ..writeByte(7)
      ..write(obj.responsibleEmail)
      ..writeByte(8)
      ..write(obj.eventType)
      ..writeByte(9)
      ..write(obj.description)
      ..writeByte(10)
      ..write(obj.createdAt)
      ..writeByte(11)
      ..write(obj.updatedAt)
      ..writeByte(12)
      ..write(obj.link)
      ..writeByte(13)
      ..write(obj.isPublic);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is EventAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

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
