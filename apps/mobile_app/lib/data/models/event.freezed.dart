// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'event.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Event _$EventFromJson(Map<String, dynamic> json) {
  return _Event.fromJson(json);
}

/// @nodoc
mixin _$Event {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String? get title => throw _privateConstructorUsedError;
  @HiveField(2)
  @JsonKey(name: 'date_from')
  String? get dateFrom => throw _privateConstructorUsedError;
  @HiveField(3)
  @JsonKey(name: 'date_to')
  String? get dateTo => throw _privateConstructorUsedError;
  @HiveField(4)
  String? get time => throw _privateConstructorUsedError;
  @HiveField(5)
  String? get location => throw _privateConstructorUsedError;
  @HiveField(6)
  @JsonKey(name: 'responsible_name')
  String? get responsibleName => throw _privateConstructorUsedError;
  @HiveField(7)
  @JsonKey(name: 'responsible_email')
  String? get responsibleEmail => throw _privateConstructorUsedError;
  @HiveField(8)
  @JsonKey(name: 'event_type')
  EventType get eventType => throw _privateConstructorUsedError;
  @HiveField(9)
  String? get description => throw _privateConstructorUsedError;
  @HiveField(10)
  @JsonKey(name: 'created_at')
  String? get createdAt => throw _privateConstructorUsedError;
  @HiveField(11)
  @JsonKey(name: 'updated_at')
  String? get updatedAt => throw _privateConstructorUsedError;
  @HiveField(12)
  String? get link => throw _privateConstructorUsedError;
  @HiveField(13)
  @JsonKey(name: 'is_public')
  bool? get isPublic => throw _privateConstructorUsedError;

  /// Serializes this Event to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Event
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $EventCopyWith<Event> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $EventCopyWith<$Res> {
  factory $EventCopyWith(Event value, $Res Function(Event) then) =
      _$EventCopyWithImpl<$Res, Event>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String? title,
      @HiveField(2) @JsonKey(name: 'date_from') String? dateFrom,
      @HiveField(3) @JsonKey(name: 'date_to') String? dateTo,
      @HiveField(4) String? time,
      @HiveField(5) String? location,
      @HiveField(6) @JsonKey(name: 'responsible_name') String? responsibleName,
      @HiveField(7)
      @JsonKey(name: 'responsible_email')
      String? responsibleEmail,
      @HiveField(8) @JsonKey(name: 'event_type') EventType eventType,
      @HiveField(9) String? description,
      @HiveField(10) @JsonKey(name: 'created_at') String? createdAt,
      @HiveField(11) @JsonKey(name: 'updated_at') String? updatedAt,
      @HiveField(12) String? link,
      @HiveField(13) @JsonKey(name: 'is_public') bool? isPublic});
}

/// @nodoc
class _$EventCopyWithImpl<$Res, $Val extends Event>
    implements $EventCopyWith<$Res> {
  _$EventCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Event
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = freezed,
    Object? dateFrom = freezed,
    Object? dateTo = freezed,
    Object? time = freezed,
    Object? location = freezed,
    Object? responsibleName = freezed,
    Object? responsibleEmail = freezed,
    Object? eventType = null,
    Object? description = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? link = freezed,
    Object? isPublic = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      dateFrom: freezed == dateFrom
          ? _value.dateFrom
          : dateFrom // ignore: cast_nullable_to_non_nullable
              as String?,
      dateTo: freezed == dateTo
          ? _value.dateTo
          : dateTo // ignore: cast_nullable_to_non_nullable
              as String?,
      time: freezed == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      responsibleName: freezed == responsibleName
          ? _value.responsibleName
          : responsibleName // ignore: cast_nullable_to_non_nullable
              as String?,
      responsibleEmail: freezed == responsibleEmail
          ? _value.responsibleEmail
          : responsibleEmail // ignore: cast_nullable_to_non_nullable
              as String?,
      eventType: null == eventType
          ? _value.eventType
          : eventType // ignore: cast_nullable_to_non_nullable
              as EventType,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      link: freezed == link
          ? _value.link
          : link // ignore: cast_nullable_to_non_nullable
              as String?,
      isPublic: freezed == isPublic
          ? _value.isPublic
          : isPublic // ignore: cast_nullable_to_non_nullable
              as bool?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$EventImplCopyWith<$Res> implements $EventCopyWith<$Res> {
  factory _$$EventImplCopyWith(
          _$EventImpl value, $Res Function(_$EventImpl) then) =
      __$$EventImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String? title,
      @HiveField(2) @JsonKey(name: 'date_from') String? dateFrom,
      @HiveField(3) @JsonKey(name: 'date_to') String? dateTo,
      @HiveField(4) String? time,
      @HiveField(5) String? location,
      @HiveField(6) @JsonKey(name: 'responsible_name') String? responsibleName,
      @HiveField(7)
      @JsonKey(name: 'responsible_email')
      String? responsibleEmail,
      @HiveField(8) @JsonKey(name: 'event_type') EventType eventType,
      @HiveField(9) String? description,
      @HiveField(10) @JsonKey(name: 'created_at') String? createdAt,
      @HiveField(11) @JsonKey(name: 'updated_at') String? updatedAt,
      @HiveField(12) String? link,
      @HiveField(13) @JsonKey(name: 'is_public') bool? isPublic});
}

/// @nodoc
class __$$EventImplCopyWithImpl<$Res>
    extends _$EventCopyWithImpl<$Res, _$EventImpl>
    implements _$$EventImplCopyWith<$Res> {
  __$$EventImplCopyWithImpl(
      _$EventImpl _value, $Res Function(_$EventImpl) _then)
      : super(_value, _then);

  /// Create a copy of Event
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = freezed,
    Object? dateFrom = freezed,
    Object? dateTo = freezed,
    Object? time = freezed,
    Object? location = freezed,
    Object? responsibleName = freezed,
    Object? responsibleEmail = freezed,
    Object? eventType = null,
    Object? description = freezed,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
    Object? link = freezed,
    Object? isPublic = freezed,
  }) {
    return _then(_$EventImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: freezed == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String?,
      dateFrom: freezed == dateFrom
          ? _value.dateFrom
          : dateFrom // ignore: cast_nullable_to_non_nullable
              as String?,
      dateTo: freezed == dateTo
          ? _value.dateTo
          : dateTo // ignore: cast_nullable_to_non_nullable
              as String?,
      time: freezed == time
          ? _value.time
          : time // ignore: cast_nullable_to_non_nullable
              as String?,
      location: freezed == location
          ? _value.location
          : location // ignore: cast_nullable_to_non_nullable
              as String?,
      responsibleName: freezed == responsibleName
          ? _value.responsibleName
          : responsibleName // ignore: cast_nullable_to_non_nullable
              as String?,
      responsibleEmail: freezed == responsibleEmail
          ? _value.responsibleEmail
          : responsibleEmail // ignore: cast_nullable_to_non_nullable
              as String?,
      eventType: null == eventType
          ? _value.eventType
          : eventType // ignore: cast_nullable_to_non_nullable
              as EventType,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
      link: freezed == link
          ? _value.link
          : link // ignore: cast_nullable_to_non_nullable
              as String?,
      isPublic: freezed == isPublic
          ? _value.isPublic
          : isPublic // ignore: cast_nullable_to_non_nullable
              as bool?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$EventImpl implements _Event {
  const _$EventImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) this.title,
      @HiveField(2) @JsonKey(name: 'date_from') this.dateFrom,
      @HiveField(3) @JsonKey(name: 'date_to') this.dateTo,
      @HiveField(4) this.time,
      @HiveField(5) this.location,
      @HiveField(6) @JsonKey(name: 'responsible_name') this.responsibleName,
      @HiveField(7) @JsonKey(name: 'responsible_email') this.responsibleEmail,
      @HiveField(8) @JsonKey(name: 'event_type') required this.eventType,
      @HiveField(9) this.description,
      @HiveField(10) @JsonKey(name: 'created_at') this.createdAt,
      @HiveField(11) @JsonKey(name: 'updated_at') this.updatedAt,
      @HiveField(12) this.link,
      @HiveField(13) @JsonKey(name: 'is_public') this.isPublic});

  factory _$EventImpl.fromJson(Map<String, dynamic> json) =>
      _$$EventImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String? title;
  @override
  @HiveField(2)
  @JsonKey(name: 'date_from')
  final String? dateFrom;
  @override
  @HiveField(3)
  @JsonKey(name: 'date_to')
  final String? dateTo;
  @override
  @HiveField(4)
  final String? time;
  @override
  @HiveField(5)
  final String? location;
  @override
  @HiveField(6)
  @JsonKey(name: 'responsible_name')
  final String? responsibleName;
  @override
  @HiveField(7)
  @JsonKey(name: 'responsible_email')
  final String? responsibleEmail;
  @override
  @HiveField(8)
  @JsonKey(name: 'event_type')
  final EventType eventType;
  @override
  @HiveField(9)
  final String? description;
  @override
  @HiveField(10)
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @override
  @HiveField(11)
  @JsonKey(name: 'updated_at')
  final String? updatedAt;
  @override
  @HiveField(12)
  final String? link;
  @override
  @HiveField(13)
  @JsonKey(name: 'is_public')
  final bool? isPublic;

  @override
  String toString() {
    return 'Event(id: $id, title: $title, dateFrom: $dateFrom, dateTo: $dateTo, time: $time, location: $location, responsibleName: $responsibleName, responsibleEmail: $responsibleEmail, eventType: $eventType, description: $description, createdAt: $createdAt, updatedAt: $updatedAt, link: $link, isPublic: $isPublic)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$EventImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.dateFrom, dateFrom) ||
                other.dateFrom == dateFrom) &&
            (identical(other.dateTo, dateTo) || other.dateTo == dateTo) &&
            (identical(other.time, time) || other.time == time) &&
            (identical(other.location, location) ||
                other.location == location) &&
            (identical(other.responsibleName, responsibleName) ||
                other.responsibleName == responsibleName) &&
            (identical(other.responsibleEmail, responsibleEmail) ||
                other.responsibleEmail == responsibleEmail) &&
            (identical(other.eventType, eventType) ||
                other.eventType == eventType) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt) &&
            (identical(other.link, link) || other.link == link) &&
            (identical(other.isPublic, isPublic) ||
                other.isPublic == isPublic));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      id,
      title,
      dateFrom,
      dateTo,
      time,
      location,
      responsibleName,
      responsibleEmail,
      eventType,
      description,
      createdAt,
      updatedAt,
      link,
      isPublic);

  /// Create a copy of Event
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$EventImplCopyWith<_$EventImpl> get copyWith =>
      __$$EventImplCopyWithImpl<_$EventImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$EventImplToJson(
      this,
    );
  }
}

abstract class _Event implements Event {
  const factory _Event(
          {@HiveField(0) required final String id,
          @HiveField(1) final String? title,
          @HiveField(2) @JsonKey(name: 'date_from') final String? dateFrom,
          @HiveField(3) @JsonKey(name: 'date_to') final String? dateTo,
          @HiveField(4) final String? time,
          @HiveField(5) final String? location,
          @HiveField(6)
          @JsonKey(name: 'responsible_name')
          final String? responsibleName,
          @HiveField(7)
          @JsonKey(name: 'responsible_email')
          final String? responsibleEmail,
          @HiveField(8)
          @JsonKey(name: 'event_type')
          required final EventType eventType,
          @HiveField(9) final String? description,
          @HiveField(10) @JsonKey(name: 'created_at') final String? createdAt,
          @HiveField(11) @JsonKey(name: 'updated_at') final String? updatedAt,
          @HiveField(12) final String? link,
          @HiveField(13) @JsonKey(name: 'is_public') final bool? isPublic}) =
      _$EventImpl;

  factory _Event.fromJson(Map<String, dynamic> json) = _$EventImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String? get title;
  @override
  @HiveField(2)
  @JsonKey(name: 'date_from')
  String? get dateFrom;
  @override
  @HiveField(3)
  @JsonKey(name: 'date_to')
  String? get dateTo;
  @override
  @HiveField(4)
  String? get time;
  @override
  @HiveField(5)
  String? get location;
  @override
  @HiveField(6)
  @JsonKey(name: 'responsible_name')
  String? get responsibleName;
  @override
  @HiveField(7)
  @JsonKey(name: 'responsible_email')
  String? get responsibleEmail;
  @override
  @HiveField(8)
  @JsonKey(name: 'event_type')
  EventType get eventType;
  @override
  @HiveField(9)
  String? get description;
  @override
  @HiveField(10)
  @JsonKey(name: 'created_at')
  String? get createdAt;
  @override
  @HiveField(11)
  @JsonKey(name: 'updated_at')
  String? get updatedAt;
  @override
  @HiveField(12)
  String? get link;
  @override
  @HiveField(13)
  @JsonKey(name: 'is_public')
  bool? get isPublic;

  /// Create a copy of Event
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$EventImplCopyWith<_$EventImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
