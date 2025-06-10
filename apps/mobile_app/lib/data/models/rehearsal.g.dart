// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rehearsal.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class RehearsalAdapter extends TypeAdapter<Rehearsal> {
  @override
  final int typeId = 6;

  @override
  Rehearsal read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Rehearsal(
      id: fields[0] as String,
      name: fields[1] as String?,
      place: fields[2] as String?,
      date: fields[3] as String?,
      startTime: fields[4] as String?,
      endTime: fields[5] as String?,
      groupType: fields[6] as GroupType,
      createdAt: fields[7] as String?,
      updatedAt: fields[8] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, Rehearsal obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name)
      ..writeByte(2)
      ..write(obj.place)
      ..writeByte(3)
      ..write(obj.date)
      ..writeByte(4)
      ..write(obj.startTime)
      ..writeByte(5)
      ..write(obj.endTime)
      ..writeByte(6)
      ..write(obj.groupType)
      ..writeByte(7)
      ..write(obj.createdAt)
      ..writeByte(8)
      ..write(obj.updatedAt);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RehearsalAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

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
