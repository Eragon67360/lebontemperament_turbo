// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Event {

 String get id; String? get title;@JsonKey(name: 'date_from') String? get dateFrom;@JsonKey(name: 'date_to') String? get dateTo; String? get time; String? get location;@JsonKey(name: 'responsible_name') String? get responsibleName;@JsonKey(name: 'responsible_email') String? get responsibleEmail;@JsonKey(name: 'event_type') EventType get eventType; String? get description;@JsonKey(name: 'created_at') String? get createdAt;@JsonKey(name: 'updated_at') String? get updatedAt; String? get link;@JsonKey(name: 'is_public') bool? get isPublic;
/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EventCopyWith<Event> get copyWith => _$EventCopyWithImpl<Event>(this as Event, _$identity);

  /// Serializes this Event to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Event;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Event&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.dateFrom, _this.dateFrom) || other.dateFrom == _this.dateFrom)&&(identical(other.dateTo, _this.dateTo) || other.dateTo == _this.dateTo)&&(identical(other.time, _this.time) || other.time == _this.time)&&(identical(other.location, _this.location) || other.location == _this.location)&&(identical(other.responsibleName, _this.responsibleName) || other.responsibleName == _this.responsibleName)&&(identical(other.responsibleEmail, _this.responsibleEmail) || other.responsibleEmail == _this.responsibleEmail)&&(identical(other.eventType, _this.eventType) || other.eventType == _this.eventType)&&(identical(other.description, _this.description) || other.description == _this.description)&&(identical(other.createdAt, _this.createdAt) || other.createdAt == _this.createdAt)&&(identical(other.updatedAt, _this.updatedAt) || other.updatedAt == _this.updatedAt)&&(identical(other.link, _this.link) || other.link == _this.link)&&(identical(other.isPublic, _this.isPublic) || other.isPublic == _this.isPublic));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Event;
  return Object.hash(runtimeType,_this.id,_this.title,_this.dateFrom,_this.dateTo,_this.time,_this.location,_this.responsibleName,_this.responsibleEmail,_this.eventType,_this.description,_this.createdAt,_this.updatedAt,_this.link,_this.isPublic);
}

@override
String toString() {
  final _this = this as Event;
  return 'Event(id: ${_this.id}, title: ${_this.title}, dateFrom: ${_this.dateFrom}, dateTo: ${_this.dateTo}, time: ${_this.time}, location: ${_this.location}, responsibleName: ${_this.responsibleName}, responsibleEmail: ${_this.responsibleEmail}, eventType: ${_this.eventType}, description: ${_this.description}, createdAt: ${_this.createdAt}, updatedAt: ${_this.updatedAt}, link: ${_this.link}, isPublic: ${_this.isPublic})';
}


}

/// @nodoc
abstract mixin class $EventCopyWith<$Res>  {
  factory $EventCopyWith(Event value, $Res Function(Event) _then) = _$EventCopyWithImpl;
@useResult
$Res call({
 String id, String? title,@JsonKey(name: 'date_from') String? dateFrom,@JsonKey(name: 'date_to') String? dateTo, String? time, String? location,@JsonKey(name: 'responsible_name') String? responsibleName,@JsonKey(name: 'responsible_email') String? responsibleEmail,@JsonKey(name: 'event_type') EventType eventType, String? description,@JsonKey(name: 'created_at') String? createdAt,@JsonKey(name: 'updated_at') String? updatedAt, String? link,@JsonKey(name: 'is_public') bool? isPublic
});




}
/// @nodoc
class _$EventCopyWithImpl<$Res>
    implements $EventCopyWith<$Res> {
  _$EventCopyWithImpl(this._self, this._then);

  final Event _self;
  final $Res Function(Event) _then;

/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? title = freezed,Object? dateFrom = freezed,Object? dateTo = freezed,Object? time = freezed,Object? location = freezed,Object? responsibleName = freezed,Object? responsibleEmail = freezed,Object? eventType = null,Object? description = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? link = freezed,Object? isPublic = freezed,}) {
  return _then(Event(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,dateFrom: freezed == dateFrom ? _self.dateFrom : dateFrom // ignore: cast_nullable_to_non_nullable
as String?,dateTo: freezed == dateTo ? _self.dateTo : dateTo // ignore: cast_nullable_to_non_nullable
as String?,time: freezed == time ? _self.time : time // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,responsibleName: freezed == responsibleName ? _self.responsibleName : responsibleName // ignore: cast_nullable_to_non_nullable
as String?,responsibleEmail: freezed == responsibleEmail ? _self.responsibleEmail : responsibleEmail // ignore: cast_nullable_to_non_nullable
as String?,eventType: null == eventType ? _self.eventType : eventType // ignore: cast_nullable_to_non_nullable
as EventType,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String?,link: freezed == link ? _self.link : link // ignore: cast_nullable_to_non_nullable
as String?,isPublic: freezed == isPublic ? _self.isPublic : isPublic // ignore: cast_nullable_to_non_nullable
as bool?,
  ));
}

}


/// Adds pattern-matching-related methods to [Event].
extension EventPatterns on Event {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Event value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Event() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Event value)  $default,){
final _that = this;
switch (_that) {
case _Event():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Event value)?  $default,){
final _that = this;
switch (_that) {
case _Event() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String? title, @JsonKey(name: 'date_from')  String? dateFrom, @JsonKey(name: 'date_to')  String? dateTo,  String? time,  String? location, @JsonKey(name: 'responsible_name')  String? responsibleName, @JsonKey(name: 'responsible_email')  String? responsibleEmail, @JsonKey(name: 'event_type')  EventType eventType,  String? description, @JsonKey(name: 'created_at')  String? createdAt, @JsonKey(name: 'updated_at')  String? updatedAt,  String? link, @JsonKey(name: 'is_public')  bool? isPublic)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Event() when $default != null:
return $default(_that.id,_that.title,_that.dateFrom,_that.dateTo,_that.time,_that.location,_that.responsibleName,_that.responsibleEmail,_that.eventType,_that.description,_that.createdAt,_that.updatedAt,_that.link,_that.isPublic);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String? title, @JsonKey(name: 'date_from')  String? dateFrom, @JsonKey(name: 'date_to')  String? dateTo,  String? time,  String? location, @JsonKey(name: 'responsible_name')  String? responsibleName, @JsonKey(name: 'responsible_email')  String? responsibleEmail, @JsonKey(name: 'event_type')  EventType eventType,  String? description, @JsonKey(name: 'created_at')  String? createdAt, @JsonKey(name: 'updated_at')  String? updatedAt,  String? link, @JsonKey(name: 'is_public')  bool? isPublic)  $default,) {final _that = this;
switch (_that) {
case _Event():
return $default(_that.id,_that.title,_that.dateFrom,_that.dateTo,_that.time,_that.location,_that.responsibleName,_that.responsibleEmail,_that.eventType,_that.description,_that.createdAt,_that.updatedAt,_that.link,_that.isPublic);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String? title, @JsonKey(name: 'date_from')  String? dateFrom, @JsonKey(name: 'date_to')  String? dateTo,  String? time,  String? location, @JsonKey(name: 'responsible_name')  String? responsibleName, @JsonKey(name: 'responsible_email')  String? responsibleEmail, @JsonKey(name: 'event_type')  EventType eventType,  String? description, @JsonKey(name: 'created_at')  String? createdAt, @JsonKey(name: 'updated_at')  String? updatedAt,  String? link, @JsonKey(name: 'is_public')  bool? isPublic)?  $default,) {final _that = this;
switch (_that) {
case _Event() when $default != null:
return $default(_that.id,_that.title,_that.dateFrom,_that.dateTo,_that.time,_that.location,_that.responsibleName,_that.responsibleEmail,_that.eventType,_that.description,_that.createdAt,_that.updatedAt,_that.link,_that.isPublic);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Event implements Event {
  const _Event({required this.id, this.title, @JsonKey(name: 'date_from') this.dateFrom, @JsonKey(name: 'date_to') this.dateTo, this.time, this.location, @JsonKey(name: 'responsible_name') this.responsibleName, @JsonKey(name: 'responsible_email') this.responsibleEmail, @JsonKey(name: 'event_type') required this.eventType, this.description, @JsonKey(name: 'created_at') this.createdAt, @JsonKey(name: 'updated_at') this.updatedAt, this.link, @JsonKey(name: 'is_public') this.isPublic});
  factory _Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);

@override final  String id;
@override final  String? title;
@override@JsonKey(name: 'date_from') final  String? dateFrom;
@override@JsonKey(name: 'date_to') final  String? dateTo;
@override final  String? time;
@override final  String? location;
@override@JsonKey(name: 'responsible_name') final  String? responsibleName;
@override@JsonKey(name: 'responsible_email') final  String? responsibleEmail;
@override@JsonKey(name: 'event_type') final  EventType eventType;
@override final  String? description;
@override@JsonKey(name: 'created_at') final  String? createdAt;
@override@JsonKey(name: 'updated_at') final  String? updatedAt;
@override final  String? link;
@override@JsonKey(name: 'is_public') final  bool? isPublic;

/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EventCopyWith<_Event> get copyWith => __$EventCopyWithImpl<_Event>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EventToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Event&&(identical(other.id, id) || other.id == id)&&(identical(other.title, title) || other.title == title)&&(identical(other.dateFrom, dateFrom) || other.dateFrom == dateFrom)&&(identical(other.dateTo, dateTo) || other.dateTo == dateTo)&&(identical(other.time, time) || other.time == time)&&(identical(other.location, location) || other.location == location)&&(identical(other.responsibleName, responsibleName) || other.responsibleName == responsibleName)&&(identical(other.responsibleEmail, responsibleEmail) || other.responsibleEmail == responsibleEmail)&&(identical(other.eventType, eventType) || other.eventType == eventType)&&(identical(other.description, description) || other.description == description)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt)&&(identical(other.updatedAt, updatedAt) || other.updatedAt == updatedAt)&&(identical(other.link, link) || other.link == link)&&(identical(other.isPublic, isPublic) || other.isPublic == isPublic));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,title,dateFrom,dateTo,time,location,responsibleName,responsibleEmail,eventType,description,createdAt,updatedAt,link,isPublic);
}

@override
String toString() {
    return 'Event(id: $id, title: $title, dateFrom: $dateFrom, dateTo: $dateTo, time: $time, location: $location, responsibleName: $responsibleName, responsibleEmail: $responsibleEmail, eventType: $eventType, description: $description, createdAt: $createdAt, updatedAt: $updatedAt, link: $link, isPublic: $isPublic)';
}


}

/// @nodoc
abstract mixin class _$EventCopyWith<$Res> implements $EventCopyWith<$Res> {
  factory _$EventCopyWith(_Event value, $Res Function(_Event) _then) = __$EventCopyWithImpl;
@override @useResult
$Res call({
 String id, String? title,@JsonKey(name: 'date_from') String? dateFrom,@JsonKey(name: 'date_to') String? dateTo, String? time, String? location,@JsonKey(name: 'responsible_name') String? responsibleName,@JsonKey(name: 'responsible_email') String? responsibleEmail,@JsonKey(name: 'event_type') EventType eventType, String? description,@JsonKey(name: 'created_at') String? createdAt,@JsonKey(name: 'updated_at') String? updatedAt, String? link,@JsonKey(name: 'is_public') bool? isPublic
});




}
/// @nodoc
class __$EventCopyWithImpl<$Res>
    implements _$EventCopyWith<$Res> {
  __$EventCopyWithImpl(this._self, this._then);

  final _Event _self;
  final $Res Function(_Event) _then;

/// Create a copy of Event
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? title = freezed,Object? dateFrom = freezed,Object? dateTo = freezed,Object? time = freezed,Object? location = freezed,Object? responsibleName = freezed,Object? responsibleEmail = freezed,Object? eventType = null,Object? description = freezed,Object? createdAt = freezed,Object? updatedAt = freezed,Object? link = freezed,Object? isPublic = freezed,}) {
  return _then(_Event(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,title: freezed == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String?,dateFrom: freezed == dateFrom ? _self.dateFrom : dateFrom // ignore: cast_nullable_to_non_nullable
as String?,dateTo: freezed == dateTo ? _self.dateTo : dateTo // ignore: cast_nullable_to_non_nullable
as String?,time: freezed == time ? _self.time : time // ignore: cast_nullable_to_non_nullable
as String?,location: freezed == location ? _self.location : location // ignore: cast_nullable_to_non_nullable
as String?,responsibleName: freezed == responsibleName ? _self.responsibleName : responsibleName // ignore: cast_nullable_to_non_nullable
as String?,responsibleEmail: freezed == responsibleEmail ? _self.responsibleEmail : responsibleEmail // ignore: cast_nullable_to_non_nullable
as String?,eventType: null == eventType ? _self.eventType : eventType // ignore: cast_nullable_to_non_nullable
as EventType,description: freezed == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String?,createdAt: freezed == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String?,updatedAt: freezed == updatedAt ? _self.updatedAt : updatedAt // ignore: cast_nullable_to_non_nullable
as String?,link: freezed == link ? _self.link : link // ignore: cast_nullable_to_non_nullable
as String?,isPublic: freezed == isPublic ? _self.isPublic : isPublic // ignore: cast_nullable_to_non_nullable
as bool?,
  ));
}


}

// dart format on
