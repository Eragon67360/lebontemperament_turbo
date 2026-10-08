// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'concert.dart';

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
      additionalInformations: json['additional_informations'] as String?,
      name: json['name'] as String?,
      createdBy: json['createdBy'] as String?,
      affiche: json['affiche'] as String?,
      venueName: json['venue_name'] as String?,
      streetAddress: json['street_address'] as String?,
      postalCode: json['postal_code'] as String?,
      city: json['city'] as String?,
      price: (json['price'] as num?)?.toDouble(),
      isFree: json['is_free'] as bool?,
      relatedLink: json['related_link'] as String?,
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
      'additional_informations': instance.additionalInformations,
      'name': instance.name,
      'createdBy': instance.createdBy,
      'affiche': instance.affiche,
      'venue_name': instance.venueName,
      'street_address': instance.streetAddress,
      'postal_code': instance.postalCode,
      'city': instance.city,
      'price': instance.price,
      'is_free': instance.isFree,
      'related_link': instance.relatedLink,
    };

const _$ContextEnumMap = {
  Context.orchestre: 'orchestre',
  Context.choeur: 'choeur',
  Context.orchestreEtChoeur: 'orchestre_et_choeur',
  Context.autre: 'autre',
};
