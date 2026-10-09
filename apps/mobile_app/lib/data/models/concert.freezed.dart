// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'concert.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Concert {

 String get id; String? get createdAt; String? get updatedAt; String get place; String get date; String get time; Context get context;@JsonKey(name: 'additional_informations') String? get additionalInformations; String? get name; String? get createdBy; String? get affiche;@JsonKey(name: 'venue_name') String? get venueName;@JsonKey(name: 'street_address') String? get streetAddress;@JsonKey(name: 'postal_code') String? get postalCode; String? get city; double? get price;@JsonKey(name: 'is_free') bool? get isFree;@JsonKey(name: 'related_link') String? get relatedLink;
/// Create a copy of Concert
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ConcertCopyWith<Concert> get copyWith => _$ConcertCopyWithImpl<Concert>(this as Concert, _$identity);

  /// Serializes this Concert to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Concert;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Concert&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&(identical(other.updatedAt, _this.updatedAt) || other.updatedAt == _this.updatedAt)&&(identical(other.place, _this.place) || other.place == _this.place)&&(identical(other.date, _this.date) || other.date == _this.date)&&(identical(other.time, _this.time) || other.time == _this.time)&&(identical(other.context, _this.context) || other.context == _this.context)&&(identical(other.additionalInformations, _this.additionalInformations) || other.additionalInformations == _this.additionalInformations)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.createdBy, _this.createdBy) || other.createdBy == _this.createdBy)&&(identical(other.affiche, _this.affiche) || other.affiche == _this.affiche)&&(identical(other.venueName, _this.venueName) || other.venueName == _this.venueName)&&(identical(other.streetAddress, _this.streetAddress) || other.streetAddress == _this.streetAddress)&&(identical(other.postalCode, _this.postalCode) || other.postalCode == _this.postalCode)&&(identical(other.city, _this.city) || other.city == _this.city)&&(identical(other.price, _this.price) || other.price == _this.price)&&(identical(other.isFree, _this.isFree) || other.isFree == _this.isFree)&&(identical(other.relatedLink, _this.relatedLink) || other.relatedLink == _this.relatedLink));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Concert;
  return Object.hash(runtimeType,_this.id,_this.createdAt,_this.updatedAt,_this.place,_this.date,_this.time,_this.context,_this.additionalInformations,_this.name,_this.createdBy,_this.affiche,_this.venueName,_this.streetAddress,_this.postalCode,_this.city,_this.price,_this.isFree,_this.relatedLink);
}

@override
String toString() {
  final _this = this as Concert;
  return 'Concert(id: ${_this.id}, createdAt: ${_this.createdAt}, updatedAt: ${_this.updatedAt}, place: ${_this.place}, date: ${_this.date}, time: ${_this.time}, context: ${_this.context}, additionalInformations: ${_this.additionalInformations}, name: ${_this.name}, createdBy: ${_this.createdBy}, affiche: ${_this.affiche}, venueName: ${_this.venueName}, streetAddress: ${_this.streetAddress}, postalCode: ${_this.postalCode}, city: ${_this.city}, price: ${_this.price}, isFree: ${_this.isFree}, relatedLink: ${_this.relatedLink})';
}


}

/// @nodoc
abstract mixin class $ConcertCopyWith<$Res>  {
  factory $ConcertCopyWith(Concert value, $Res Function(Concert) _then) = _$ConcertCopyWithImpl;
@useResult
$Res call({
 String id, String? createdAt, String? updatedAt, String place, String date, String time, Context context,@JsonKey(name: 'additional_informations') String? additionalInformations, String? name, String? createdBy, String? affiche,@JsonKey(name: 'venue_name') String? venueName,@JsonKey(name: 'street_address') String? streetAddress,@JsonKey(name: 'postal_code') String? postalCode, String? city, double? price,@JsonKey(name: 'is_free') bool? isFree,@JsonKey(name: 'related_link') String? relatedLink
});




}
/// @nodoc
class _$ConcertCopyWithImpl<$Res>
    implements $ConcertCopyWith<$Res> {
  _$ConcertCopyWithImpl(this._self, this._then);

  final Concert _self;
  final $Res Function(Concert) _then;

/// Create a copy of Concert
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? place = null,Object? date = null,Object? time = null,Object? context = null,Object? additionalInformations = freezed,Object? name = freezed,Object? createdBy = freezed,Object? affiche = freezed,Object? venueName = freezed,Object? streetAddress = freezed,Object? postalCode = freezed,Object? city = freezed,Object? price = freezed,Object? isFree = freezed,Object? relatedLink = freezed,}) {
  return _then(Concert(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String?,place: null == place ? _self.place : place // ignore: cast_nullable_to_non_nullable
as String,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,time: null == time ? _self.time : time // ignore: cast_nullable_to_non_nullable
as String,context: null == context ? _self.context : context // ignore: cast_nullable_to_non_nullable
as Context,additionalInformations: freezed == additionalInformations ? _self.additionalInformations : additionalInformations // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,createdBy: freezed == createdBy ? _self.createdBy : createdBy // ignore: cast_nullable_to_non_nullable
as String?,affiche: freezed == affiche ? _self.affiche : affiche // ignore: cast_nullable_to_non_nullable
as String?,venueName: freezed == venueName ? _self.venueName : venueName // ignore: cast_nullable_to_non_nullable
as String?,streetAddress: freezed == streetAddress ? _self.streetAddress : streetAddress // ignore: cast_nullable_to_non_nullable
as String?,postalCode: freezed == postalCode ? _self.postalCode : postalCode // ignore: cast_nullable_to_non_nullable
as String?,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,isFree: freezed == isFree ? _self.isFree : isFree // ignore: cast_nullable_to_non_nullable
as bool?,relatedLink: freezed == relatedLink ? _self.relatedLink : relatedLink // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Concert].
extension ConcertPatterns on Concert {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Concert value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Concert() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Concert value)  $default,){
final _that = this;
switch (_that) {
case _Concert():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Concert value)?  $default,){
final _that = this;
switch (_that) {
case _Concert() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String? createdAt,  String? updatedAt,  String place,  String date,  String time,  Context context, @JsonKey(name: 'additional_informations')  String? additionalInformations,  String? name,  String? createdBy,  String? affiche, @JsonKey(name: 'venue_name')  String? venueName, @JsonKey(name: 'street_address')  String? streetAddress, @JsonKey(name: 'postal_code')  String? postalCode,  String? city,  double? price, @JsonKey(name: 'is_free')  bool? isFree, @JsonKey(name: 'related_link')  String? relatedLink)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Concert() when $default != null:
return $default(_that.id,_that.createdAt,_that.updatedAt,_that.place,_that.date,_that.time,_that.context,_that.additionalInformations,_that.name,_that.createdBy,_that.affiche,_that.venueName,_that.streetAddress,_that.postalCode,_that.city,_that.price,_that.isFree,_that.relatedLink);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String? createdAt,  String? updatedAt,  String place,  String date,  String time,  Context context, @JsonKey(name: 'additional_informations')  String? additionalInformations,  String? name,  String? createdBy,  String? affiche, @JsonKey(name: 'venue_name')  String? venueName, @JsonKey(name: 'street_address')  String? streetAddress, @JsonKey(name: 'postal_code')  String? postalCode,  String? city,  double? price, @JsonKey(name: 'is_free')  bool? isFree, @JsonKey(name: 'related_link')  String? relatedLink)  $default,) {final _that = this;
switch (_that) {
case _Concert():
return $default(_that.id,_that.createdAt,_that.updatedAt,_that.place,_that.date,_that.time,_that.context,_that.additionalInformations,_that.name,_that.createdBy,_that.affiche,_that.venueName,_that.streetAddress,_that.postalCode,_that.city,_that.price,_that.isFree,_that.relatedLink);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String? createdAt,  String? updatedAt,  String place,  String date,  String time,  Context context, @JsonKey(name: 'additional_informations')  String? additionalInformations,  String? name,  String? createdBy,  String? affiche, @JsonKey(name: 'venue_name')  String? venueName, @JsonKey(name: 'street_address')  String? streetAddress, @JsonKey(name: 'postal_code')  String? postalCode,  String? city,  double? price, @JsonKey(name: 'is_free')  bool? isFree, @JsonKey(name: 'related_link')  String? relatedLink)?  $default,) {final _that = this;
switch (_that) {
case _Concert() when $default != null:
return $default(_that.id,_that.createdAt,_that.updatedAt,_that.place,_that.date,_that.time,_that.context,_that.additionalInformations,_that.name,_that.createdBy,_that.affiche,_that.venueName,_that.streetAddress,_that.postalCode,_that.city,_that.price,_that.isFree,_that.relatedLink);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Concert implements Concert {
  const _Concert({required this.id, this.createdAt, this.updatedAt, required this.place, required this.date, required this.time, required this.context, @JsonKey(name: 'additional_informations') this.additionalInformations, this.name, this.createdBy, this.affiche, @JsonKey(name: 'venue_name') this.venueName, @JsonKey(name: 'street_address') this.streetAddress, @JsonKey(name: 'postal_code') this.postalCode, this.city, this.price, @JsonKey(name: 'is_free') this.isFree, @JsonKey(name: 'related_link') this.relatedLink});
  factory _Concert.fromJson(Map<String, dynamic> json) => _$ConcertFromJson(json);

@override final  String id;
@override final  String? createdAt;
@override final  String? updatedAt;
@override final  String place;
@override final  String date;
@override final  String time;
@override final  Context context;
@override@JsonKey(name: 'additional_informations') final  String? additionalInformations;
@override final  String? name;
@override final  String? createdBy;
@override final  String? affiche;
@override@JsonKey(name: 'venue_name') final  String? venueName;
@override@JsonKey(name: 'street_address') final  String? streetAddress;
@override@JsonKey(name: 'postal_code') final  String? postalCode;
@override final  String? city;
@override final  double? price;
@override@JsonKey(name: 'is_free') final  bool? isFree;
@override@JsonKey(name: 'related_link') final  String? relatedLink;

/// Create a copy of Concert
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ConcertCopyWith<_Concert> get copyWith => __$ConcertCopyWithImpl<_Concert>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ConcertToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Concert&&(identical(other.id, id) || other.id == id)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.place, place) || other.place == place)&&(identical(other.date, date) || other.date == date)&&(identical(other.time, time) || other.time == time)&&(identical(other.context, context) || other.context == context)&&(identical(other.additionalInformations, additionalInformations) || other.additionalInformations == additionalInformations)&&(identical(other.name, name) || other.name == name)&&(identical(other.createdBy, createdBy) || other.createdBy == createdBy)&&(identical(other.affiche, affiche) || other.affiche == affiche)&&(identical(other.venueName, venueName) || other.venueName == venueName)&&(identical(other.streetAddress, streetAddress) || other.streetAddress == streetAddress)&&(identical(other.postalCode, postalCode) || other.postalCode == postalCode)&&(identical(other.city, city) || other.city == city)&&(identical(other.price, price) || other.price == price)&&(identical(other.isFree, isFree) || other.isFree == isFree)&&(identical(other.relatedLink, relatedLink) || other.relatedLink == relatedLink));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,createdAt,updatedAt,place,date,time,context,additionalInformations,name,createdBy,affiche,venueName,streetAddress,postalCode,city,price,isFree,relatedLink);
}

@override
String toString() {
    return 'Concert(id: $id, createdAt: $createdAt, updatedAt: $updatedAt, place: $place, date: $date, time: $time, context: $context, additionalInformations: $additionalInformations, name: $name, createdBy: $createdBy, affiche: $affiche, venueName: $venueName, streetAddress: $streetAddress, postalCode: $postalCode, city: $city, price: $price, isFree: $isFree, relatedLink: $relatedLink)';
}


}

/// @nodoc
abstract mixin class _$ConcertCopyWith<$Res> implements $ConcertCopyWith<$Res> {
  factory _$ConcertCopyWith(_Concert value, $Res Function(_Concert) _then) = __$ConcertCopyWithImpl;
@override @useResult
$Res call({
 String id, String? createdAt, String? updatedAt, String place, String date, String time, Context context,@JsonKey(name: 'additional_informations') String? additionalInformations, String? name, String? createdBy, String? affiche,@JsonKey(name: 'venue_name') String? venueName,@JsonKey(name: 'street_address') String? streetAddress,@JsonKey(name: 'postal_code') String? postalCode, String? city, double? price,@JsonKey(name: 'is_free') bool? isFree,@JsonKey(name: 'related_link') String? relatedLink
});




}
/// @nodoc
class __$ConcertCopyWithImpl<$Res>
    implements _$ConcertCopyWith<$Res> {
  __$ConcertCopyWithImpl(this._self, this._then);

  final _Concert _self;
  final $Res Function(_Concert) _then;

/// Create a copy of Concert
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? createdAt = freezed,Object? updatedAt = freezed,Object? place = null,Object? date = null,Object? time = null,Object? context = null,Object? additionalInformations = freezed,Object? name = freezed,Object? createdBy = freezed,Object? affiche = freezed,Object? venueName = freezed,Object? streetAddress = freezed,Object? postalCode = freezed,Object? city = freezed,Object? price = freezed,Object? isFree = freezed,Object? relatedLink = freezed,}) {
  return _then(_Concert(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String?,place: null == place ? _self.place : place // ignore: cast_nullable_to_non_nullable
as String,date: null == date ? _self.date : date // ignore: cast_nullable_to_non_nullable
as String,time: null == time ? _self.time : time // ignore: cast_nullable_to_non_nullable
as String,context: null == context ? _self.context : context // ignore: cast_nullable_to_non_nullable
as Context,additionalInformations: freezed == additionalInformations ? _self.additionalInformations : additionalInformations // ignore: cast_nullable_to_non_nullable
as String?,name: freezed == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String?,createdBy: freezed == createdBy ? _self.createdBy : createdBy // ignore: cast_nullable_to_non_nullable
as String?,affiche: freezed == affiche ? _self.affiche : affiche // ignore: cast_nullable_to_non_nullable
as String?,venueName: freezed == venueName ? _self.venueName : venueName // ignore: cast_nullable_to_non_nullable
as String?,streetAddress: freezed == streetAddress ? _self.streetAddress : streetAddress // ignore: cast_nullable_to_non_nullable
as String?,postalCode: freezed == postalCode ? _self.postalCode : postalCode // ignore: cast_nullable_to_non_nullable
as String?,city: freezed == city ? _self.city : city // ignore: cast_nullable_to_non_nullable
as String?,price: freezed == price ? _self.price : price // ignore: cast_nullable_to_non_nullable
as double?,isFree: freezed == isFree ? _self.isFree : isFree // ignore: cast_nullable_to_non_nullable
as bool?,relatedLink: freezed == relatedLink ? _self.relatedLink : relatedLink // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
