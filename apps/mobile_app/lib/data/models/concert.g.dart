// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'concert.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ConcertAdapter extends TypeAdapter<Concert> {
  @override
  final int typeId = 5;

  @override
  Concert read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Concert(
      id: fields[0] as String,
      createdAt: fields[1] as String?,
      updatedAt: fields[2] as String?,
      place: fields[3] as String,
      date: fields[4] as String,
      time: fields[5] as String,
      context: fields[6] as Context,
      additionalInformations: fields[7] as String?,
      name: fields[8] as String?,
      createdBy: fields[9] as String?,
      affiche: fields[10] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, Concert obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.createdAt)
      ..writeByte(2)
      ..write(obj.updatedAt)
      ..writeByte(3)
      ..write(obj.place)
      ..writeByte(4)
      ..write(obj.date)
      ..writeByte(5)
      ..write(obj.time)
      ..writeByte(6)
      ..write(obj.context)
      ..writeByte(7)
      ..write(obj.additionalInformations)
      ..writeByte(8)
      ..write(obj.name)
      ..writeByte(9)
      ..write(obj.createdBy)
      ..writeByte(10)
      ..write(obj.affiche);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConcertAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ConcertImpl _$$ConcertImplFromJson(Map<String, dynamic> json) =>
    _$ConcertImpl(
      id: json['id'] as String,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      place: json['place'] as String,
      date: json['date'] as String,
      time: json['time'] as String,
      context: $enumDecode(_$ContextEnumMap, json['context']),
      additionalInformations: json['additionalInformations'] as String?,
      name: json['name'] as String?,
      createdBy: json['createdBy'] as String?,
      affiche: json['affiche'] as String?,
    );

Map<String, dynamic> _$$ConcertImplToJson(_$ConcertImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'createdAt': instance.createdAt,
      'updatedAt': instance.updatedAt,
      'place': instance.place,
      'date': instance.date,
      'time': instance.time,
      'context': _$ContextEnumMap[instance.context]!,
      'additionalInformations': instance.additionalInformations,
      'name': instance.name,
      'createdBy': instance.createdBy,
      'affiche': instance.affiche,
    };

const _$ContextEnumMap = {
  Context.orchestre: 'orchestre',
  Context.choeur: 'choeur',
  Context.orchestreEtChoeur: 'orchestre_et_choeur',
  Context.autre: 'autre',
};
