// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'concert.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Concert _$ConcertFromJson(Map<String, dynamic> json) {
  return _Concert.fromJson(json);
}

/// @nodoc
mixin _$Concert {
  String get id => throw _privateConstructorUsedError;
  String? get createdAt => throw _privateConstructorUsedError;
  String? get updatedAt => throw _privateConstructorUsedError;
  String get place => throw _privateConstructorUsedError;
  String get date => throw _privateConstructorUsedError;
  String get time => throw _privateConstructorUsedError;
  Context get context => throw _privateConstructorUsedError;
  @JsonKey(name: 'additional_informations')
  String? get additionalInformations => throw _privateConstructorUsedError;
  String? get name => throw _privateConstructorUsedError;
  String? get createdBy => throw _privateConstructorUsedError;
  String? get affiche =>
      throw _privateConstructorUsedError; // Where and how to come, as the website shows them (public part, #593).
  @JsonKey(name: 'venue_name')
  String? get venueName => throw _privateConstructorUsedError;
  @JsonKey(name: 'street_address')
  String? get streetAddress => throw _privateConstructorUsedError;
  @JsonKey(name: 'postal_code')
  String? get postalCode => throw _privateConstructorUsedError;
  String? get city => throw _privateConstructorUsedError;
  double? get price => throw _privateConstructorUsedError;
  @JsonKey(name: 'is_free')
  bool? get isFree => throw _privateConstructorUsedError;
  @JsonKey(name: 'related_link')
  String? get relatedLink => throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $ConcertCopyWith<Concert> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConcertCopyWith<$Res> {
  factory $ConcertCopyWith(Concert value, $Res Function(Concert) then) =
      _$ConcertCopyWithImpl<$Res, Concert>;
  @useResult
  $Res call(
      {String id,
      String? createdAt,
      String? updatedAt,
      String place,
      String date,
      String time,
      Context context,
      @JsonKey(name: 'additional_informations') String? additionalInformations,
      String? name,
      String? createdBy,
      String? affiche,
      @JsonKey(name: 'venue_name') String? venueName,
      @JsonKey(name: 'street_address') String? streetAddress,
      @JsonKey(name: 'postal_code') String? postalCode,
      String? city,
      double? price,
      @JsonKey(name: 'is_free') bool? isFree,
      @JsonKey(name: 'related_link') String? relatedLink});
}

/// @nodoc
class _$ConcertCopyWithImpl<$Res, $Val extends Concert>
    implements $ConcertCopyWith<$Res> {
  _$ConcertCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? place = null,
    Object? date = null,
    Object? time = null,
    Object? context = null,
    Object? additionalInformations = freezed,
    Object? name = freezed,
    Object? createdBy = freezed,
    Object? affiche = freezed,
    Object? venueName = freezed,
    Object? streetAddress = freezed,
    Object? postalCode = freezed,
    Object? city = freezed,
    Object? price = freezed,
    Object? isFree = freezed,
    Object? relatedLink = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      place: null == place
          ? _value.place
          : place // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      time: null == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as String,
      context: null == context
          ? _value.context
          : context // ignore: cast_nullable_to_non_nullable
              as Context,
      additionalInformations: freezed == additionalInformations
          ? _value.additionalInformations
          : additionalInformations // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as String?,
      affiche: freezed == affiche
          ? _value.affiche
          : affiche // ignore: cast_nullable_to_non_nullable
              as String?,
      venueName: freezed == venueName
          ? _value.venueName
          : venueName // ignore: cast_nullable_to_non_nullable
              as String?,
      streetAddress: freezed == streetAddress
          ? _value.streetAddress
          : streetAddress // ignore: cast_nullable_to_non_nullable
              as String?,
      postalCode: freezed == postalCode
          ? _value.postalCode
          : postalCode // ignore: cast_nullable_to_non_nullable
              as String?,
      city: freezed == city
          ? _value.city
          : city // ignore: cast_nullable_to_non_nullable
              as String?,
      price: freezed == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as double?,
      isFree: freezed == isFree
          ? _value.isFree
          : isFree // ignore: cast_nullable_to_non_nullable
              as bool?,
      relatedLink: freezed == relatedLink
          ? _value.relatedLink
          : relatedLink // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$ConcertImplCopyWith<$Res> implements $ConcertCopyWith<$Res> {
  factory _$$ConcertImplCopyWith(
          _$ConcertImpl value, $Res Function(_$ConcertImpl) then) =
      __$$ConcertImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String? createdAt,
      String? updatedAt,
      String place,
      String date,
      String time,
      Context context,
      @JsonKey(name: 'additional_informations') String? additionalInformations,
      String? name,
      String? createdBy,
      String? affiche,
      @JsonKey(name: 'venue_name') String? venueName,
      @JsonKey(name: 'street_address') String? streetAddress,
      @JsonKey(name: 'postal_code') String? postalCode,
      String? city,
      double? price,
      @JsonKey(name: 'is_free') bool? isFree,
      @JsonKey(name: 'related_link') String? relatedLink});
}

/// @nodoc
class __$$ConcertImplCopyWithImpl<$Res>
    extends _$ConcertCopyWithImpl<$Res, _$ConcertImpl>
    implements _$$ConcertImplCopyWith<$Res> {
  __$$ConcertImplCopyWithImpl(
      _$ConcertImpl _value, $Res Function(_$ConcertImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? place = null,
    Object? date = null,
    Object? time = null,
    Object? context = null,
    Object? additionalInformations = freezed,
    Object? name = freezed,
    Object? createdBy = freezed,
    Object? affiche = freezed,
    Object? venueName = freezed,
    Object? streetAddress = freezed,
    Object? postalCode = freezed,
    Object? city = freezed,
    Object? price = freezed,
    Object? isFree = freezed,
    Object? relatedLink = freezed,
  }) {
    return _then(_$ConcertImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      place: null == place
          ? _value.place
          : place // ignore: cast_nullable_to_non_nullable
              as String,
      date: null == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String,
      time: null == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as String,
      context: null == context
          ? _value.context
          : context // ignore: cast_nullable_to_non_nullable
              as Context,
      additionalInformations: freezed == additionalInformations
          ? _value.additionalInformations
          : additionalInformations // ignore: cast_nullable_to_non_nullable
              as String?,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      createdBy: freezed == createdBy
          ? _value.createdBy
          : createdBy // ignore: cast_nullable_to_non_nullable
              as String?,
      affiche: freezed == affiche
          ? _value.affiche
          : affiche // ignore: cast_nullable_to_non_nullable
              as String?,
      venueName: freezed == venueName
          ? _value.venueName
          : venueName // ignore: cast_nullable_to_non_nullable
              as String?,
      streetAddress: freezed == streetAddress
          ? _value.streetAddress
          : streetAddress // ignore: cast_nullable_to_non_nullable
              as String?,
      postalCode: freezed == postalCode
          ? _value.postalCode
          : postalCode // ignore: cast_nullable_to_non_nullable
              as String?,
      city: freezed == city
          ? _value.city
          : city // ignore: cast_nullable_to_non_nullable
              as String?,
      price: freezed == price
          ? _value.price
          : price // ignore: cast_nullable_to_non_nullable
              as double?,
      isFree: freezed == isFree
          ? _value.isFree
          : isFree // ignore: cast_nullable_to_non_nullable
              as bool?,
      relatedLink: freezed == relatedLink
          ? _value.relatedLink
          : relatedLink // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConcertImpl implements _Concert {
  const _$ConcertImpl(
      {required this.id,
      this.createdAt,
      this.updatedAt,
      required this.place,
      required this.date,
      required this.time,
      required this.context,
      @JsonKey(name: 'additional_informations') this.additionalInformations,
      this.name,
      this.createdBy,
      this.affiche,
      @JsonKey(name: 'venue_name') this.venueName,
      @JsonKey(name: 'street_address') this.streetAddress,
      @JsonKey(name: 'postal_code') this.postalCode,
      this.city,
      this.price,
      @JsonKey(name: 'is_free') this.isFree,
      @JsonKey(name: 'related_link') this.relatedLink});

  factory _$ConcertImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConcertImplFromJson(json);

  @override
  final String id;
  @override
  final String? createdAt;
  @override
  final String? updatedAt;
  @override
  final String place;
  @override
  final String date;
  @override
  final String time;
  @override
  final Context context;
  @override
  @JsonKey(name: 'additional_informations')
  final String? additionalInformations;
  @override
  final String? name;
  @override
  final String? createdBy;
  @override
  final String? affiche;
// Where and how to come, as the website shows them (public part, #593).
  @override
  @JsonKey(name: 'venue_name')
  final String? venueName;
  @override
  @JsonKey(name: 'street_address')
  final String? streetAddress;
  @override
  @JsonKey(name: 'postal_code')
  final String? postalCode;
  @override
  final String? city;
  @override
  final double? price;
  @override
  @JsonKey(name: 'is_free')
  final bool? isFree;
  @override
  @JsonKey(name: 'related_link')
  final String? relatedLink;

  @override
  String toString() {
    return 'Concert(id: $id, createdAt: $createdAt, updatedAt: $updatedAt, place: $place, date: $date, time: $time, context: $context, additionalInformations: $additionalInformations, name: $name, createdBy: $createdBy, affiche: $affiche, venueName: $venueName, streetAddress: $streetAddress, postalCode: $postalCode, city: $city, price: $price, isFree: $isFree, relatedLink: $relatedLink)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ConcertImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.place, place) || other.place == place) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.time, time) || other.time == time) &&
            (identical(other.context, context) || other.context == context) &&
            (identical(other.additionalInformations, additionalInformations) ||
                other.additionalInformations == additionalInformations) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.createdBy, createdBy) ||
                other.createdBy == createdBy) &&
            (identical(other.affiche, affiche) || other.affiche == affiche) &&
            (identical(other.venueName, venueName) ||
                other.venueName == venueName) &&
            (identical(other.streetAddress, streetAddress) ||
                other.streetAddress == streetAddress) &&
            (identical(other.postalCode, postalCode) ||
                other.postalCode == postalCode) &&
            (identical(other.city, city) || other.city == city) &&
            (identical(other.price, price) || other.price == price) &&
            (identical(other.isFree, isFree) || other.isFree == isFree) &&
            (identical(other.relatedLink, relatedLink) ||
                other.relatedLink == relatedLink));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      createdAt,
      updatedAt,
      place,
      date,
      time,
      context,
      additionalInformations,
      name,
      createdBy,
      affiche,
      venueName,
      streetAddress,
      postalCode,
      city,
      price,
      isFree,
      relatedLink);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ConcertImplCopyWith<_$ConcertImpl> get copyWith =>
      __$$ConcertImplCopyWithImpl<_$ConcertImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$ConcertImplToJson(
      this,
    );
  }
}

abstract class _Concert implements Concert {
  const factory _Concert(
          {required final String id,
          final String? createdAt,
          final String? updatedAt,
          required final String place,
          required final String date,
          required final String time,
          required final Context context,
          @JsonKey(name: 'additional_informations')
          final String? additionalInformations,
          final String? name,
          final String? createdBy,
          final String? affiche,
          @JsonKey(name: 'venue_name') final String? venueName,
          @JsonKey(name: 'street_address') final String? streetAddress,
          @JsonKey(name: 'postal_code') final String? postalCode,
          final String? city,
          final double? price,
          @JsonKey(name: 'is_free') final bool? isFree,
          @JsonKey(name: 'related_link') final String? relatedLink}) =
      _$ConcertImpl;

  factory _Concert.fromJson(Map<String, dynamic> json) = _$ConcertImpl.fromJson;

  @override
  String get id;
  @override
  String? get createdAt;
  @override
  String? get updatedAt;
  @override
  String get place;
  @override
  String get date;
  @override
  String get time;
  @override
  Context get context;
  @override
  @JsonKey(name: 'additional_informations')
  String? get additionalInformations;
  @override
  String? get name;
  @override
  String? get createdBy;
  @override
  String? get affiche;
  @override // Where and how to come, as the website shows them (public part, #593).
  @JsonKey(name: 'venue_name')
  String? get venueName;
  @override
  @JsonKey(name: 'street_address')
  String? get streetAddress;
  @override
  @JsonKey(name: 'postal_code')
  String? get postalCode;
  @override
  String? get city;
  @override
  double? get price;
  @override
  @JsonKey(name: 'is_free')
  bool? get isFree;
  @override
  @JsonKey(name: 'related_link')
  String? get relatedLink;
  @override
  @JsonKey(ignore: true)
  _$$ConcertImplCopyWith<_$ConcertImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
