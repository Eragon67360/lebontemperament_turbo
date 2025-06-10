// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'rehearsal.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

Rehearsal _$RehearsalFromJson(Map<String, dynamic> json) {
  return _Rehearsal.fromJson(json);
}

/// @nodoc
mixin _$Rehearsal {
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String? get name => throw _privateConstructorUsedError;
  @HiveField(2)
  String? get place => throw _privateConstructorUsedError;
  @HiveField(3)
  String? get date => throw _privateConstructorUsedError;
  @HiveField(4)
  @JsonKey(name: 'start_time')
  String? get startTime => throw _privateConstructorUsedError;
  @HiveField(5)
  @JsonKey(name: 'end_time')
  String? get endTime => throw _privateConstructorUsedError;
  @HiveField(6)
  @JsonKey(name: 'group_type')
  GroupType get groupType => throw _privateConstructorUsedError;
  @HiveField(7)
  @JsonKey(name: 'created_at')
  String? get createdAt => throw _privateConstructorUsedError;
  @HiveField(8)
  @JsonKey(name: 'updated_at')
  String? get updatedAt => throw _privateConstructorUsedError;

  /// Serializes this Rehearsal to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Rehearsal
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RehearsalCopyWith<Rehearsal> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RehearsalCopyWith<$Res> {
  factory $RehearsalCopyWith(Rehearsal value, $Res Function(Rehearsal) then) =
      _$RehearsalCopyWithImpl<$Res, Rehearsal>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String? name,
      @HiveField(2) String? place,
      @HiveField(3) String? date,
      @HiveField(4) @JsonKey(name: 'start_time') String? startTime,
      @HiveField(5) @JsonKey(name: 'end_time') String? endTime,
      @HiveField(6) @JsonKey(name: 'group_type') GroupType groupType,
      @HiveField(7) @JsonKey(name: 'created_at') String? createdAt,
      @HiveField(8) @JsonKey(name: 'updated_at') String? updatedAt});
}

/// @nodoc
class _$RehearsalCopyWithImpl<$Res, $Val extends Rehearsal>
    implements $RehearsalCopyWith<$Res> {
  _$RehearsalCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Rehearsal
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = freezed,
    Object? place = freezed,
    Object? date = freezed,
    Object? startTime = freezed,
    Object? endTime = freezed,
    Object? groupType = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      place: freezed == place
          ? _value.place
          : place // ignore: cast_nullable_to_non_nullable
              as String?,
      date: freezed == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String?,
      startTime: freezed == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as String?,
      endTime: freezed == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as String?,
      groupType: null == groupType
          ? _value.groupType
          : groupType // ignore: cast_nullable_to_non_nullable
              as GroupType,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$RehearsalImplCopyWith<$Res>
    implements $RehearsalCopyWith<$Res> {
  factory _$$RehearsalImplCopyWith(
          _$RehearsalImpl value, $Res Function(_$RehearsalImpl) then) =
      __$$RehearsalImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String? name,
      @HiveField(2) String? place,
      @HiveField(3) String? date,
      @HiveField(4) @JsonKey(name: 'start_time') String? startTime,
      @HiveField(5) @JsonKey(name: 'end_time') String? endTime,
      @HiveField(6) @JsonKey(name: 'group_type') GroupType groupType,
      @HiveField(7) @JsonKey(name: 'created_at') String? createdAt,
      @HiveField(8) @JsonKey(name: 'updated_at') String? updatedAt});
}

/// @nodoc
class __$$RehearsalImplCopyWithImpl<$Res>
    extends _$RehearsalCopyWithImpl<$Res, _$RehearsalImpl>
    implements _$$RehearsalImplCopyWith<$Res> {
  __$$RehearsalImplCopyWithImpl(
      _$RehearsalImpl _value, $Res Function(_$RehearsalImpl) _then)
      : super(_value, _then);

  /// Create a copy of Rehearsal
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? name = freezed,
    Object? place = freezed,
    Object? date = freezed,
    Object? startTime = freezed,
    Object? endTime = freezed,
    Object? groupType = null,
    Object? createdAt = freezed,
    Object? updatedAt = freezed,
  }) {
    return _then(_$RehearsalImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      name: freezed == name
          ? _value.name
          : name // ignore: cast_nullable_to_non_nullable
              as String?,
      place: freezed == place
          ? _value.place
          : place // ignore: cast_nullable_to_non_nullable
              as String?,
      date: freezed == date
          ? _value.date
          : date // ignore: cast_nullable_to_non_nullable
              as String?,
      startTime: freezed == startTime
          ? _value.startTime
          : startTime // ignore: cast_nullable_to_non_nullable
              as String?,
      endTime: freezed == endTime
          ? _value.endTime
          : endTime // ignore: cast_nullable_to_non_nullable
              as String?,
      groupType: null == groupType
          ? _value.groupType
          : groupType // ignore: cast_nullable_to_non_nullable
              as GroupType,
      createdAt: freezed == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as String?,
      updatedAt: freezed == updatedAt
          ? _value.updatedAt
          : updatedAt // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RehearsalImpl implements _Rehearsal {
  const _$RehearsalImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) this.name,
      @HiveField(2) this.place,
      @HiveField(3) this.date,
      @HiveField(4) @JsonKey(name: 'start_time') this.startTime,
      @HiveField(5) @JsonKey(name: 'end_time') this.endTime,
      @HiveField(6) @JsonKey(name: 'group_type') required this.groupType,
      @HiveField(7) @JsonKey(name: 'created_at') this.createdAt,
      @HiveField(8) @JsonKey(name: 'updated_at') this.updatedAt});

  factory _$RehearsalImpl.fromJson(Map<String, dynamic> json) =>
      _$$RehearsalImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String? name;
  @override
  @HiveField(2)
  final String? place;
  @override
  @HiveField(3)
  final String? date;
  @override
  @HiveField(4)
  @JsonKey(name: 'start_time')
  final String? startTime;
  @override
  @HiveField(5)
  @JsonKey(name: 'end_time')
  final String? endTime;
  @override
  @HiveField(6)
  @JsonKey(name: 'group_type')
  final GroupType groupType;
  @override
  @HiveField(7)
  @JsonKey(name: 'created_at')
  final String? createdAt;
  @override
  @HiveField(8)
  @JsonKey(name: 'updated_at')
  final String? updatedAt;

  @override
  String toString() {
    return 'Rehearsal(id: $id, name: $name, place: $place, date: $date, startTime: $startTime, endTime: $endTime, groupType: $groupType, createdAt: $createdAt, updatedAt: $updatedAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RehearsalImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.name, name) || other.name == name) &&
            (identical(other.place, place) || other.place == place) &&
            (identical(other.date, date) || other.date == date) &&
            (identical(other.startTime, startTime) ||
                other.startTime == startTime) &&
            (identical(other.endTime, endTime) || other.endTime == endTime) &&
            (identical(other.groupType, groupType) ||
                other.groupType == groupType) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.updatedAt, updatedAt) ||
                other.updatedAt == updatedAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, name, place, date, startTime,
      endTime, groupType, createdAt, updatedAt);

  /// Create a copy of Rehearsal
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RehearsalImplCopyWith<_$RehearsalImpl> get copyWith =>
      __$$RehearsalImplCopyWithImpl<_$RehearsalImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RehearsalImplToJson(
      this,
    );
  }
}

abstract class _Rehearsal implements Rehearsal {
  const factory _Rehearsal(
          {@HiveField(0) required final String id,
          @HiveField(1) final String? name,
          @HiveField(2) final String? place,
          @HiveField(3) final String? date,
          @HiveField(4) @JsonKey(name: 'start_time') final String? startTime,
          @HiveField(5) @JsonKey(name: 'end_time') final String? endTime,
          @HiveField(6)
          @JsonKey(name: 'group_type')
          required final GroupType groupType,
          @HiveField(7) @JsonKey(name: 'created_at') final String? createdAt,
          @HiveField(8) @JsonKey(name: 'updated_at') final String? updatedAt}) =
      _$RehearsalImpl;

  factory _Rehearsal.fromJson(Map<String, dynamic> json) =
      _$RehearsalImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String? get name;
  @override
  @HiveField(2)
  String? get place;
  @override
  @HiveField(3)
  String? get date;
  @override
  @HiveField(4)
  @JsonKey(name: 'start_time')
  String? get startTime;
  @override
  @HiveField(5)
  @JsonKey(name: 'end_time')
  String? get endTime;
  @override
  @HiveField(6)
  @JsonKey(name: 'group_type')
  GroupType get groupType;
  @override
  @HiveField(7)
  @JsonKey(name: 'created_at')
  String? get createdAt;
  @override
  @HiveField(8)
  @JsonKey(name: 'updated_at')
  String? get updatedAt;

  /// Create a copy of Rehearsal
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RehearsalImplCopyWith<_$RehearsalImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
