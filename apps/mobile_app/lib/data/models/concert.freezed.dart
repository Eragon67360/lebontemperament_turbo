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
  @HiveField(0)
  String get id => throw _privateConstructorUsedError;
  @HiveField(1)
  String? get createdAt => throw _privateConstructorUsedError;
  @HiveField(2)
  String? get updatedAt => throw _privateConstructorUsedError;
  @HiveField(3)
  String get place => throw _privateConstructorUsedError;
  @HiveField(4)
  String get date => throw _privateConstructorUsedError;
  @HiveField(5)
  String get time => throw _privateConstructorUsedError;
  @HiveField(6)
  Context get context => throw _privateConstructorUsedError;
  @HiveField(7)
  String? get additionalInformations => throw _privateConstructorUsedError;
  @HiveField(8)
  String? get name => throw _privateConstructorUsedError;
  @HiveField(9)
  String? get createdBy => throw _privateConstructorUsedError;
  @HiveField(10)
  String? get affiche => throw _privateConstructorUsedError;

  /// Serializes this Concert to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Concert
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $ConcertCopyWith<Concert> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ConcertCopyWith<$Res> {
  factory $ConcertCopyWith(Concert value, $Res Function(Concert) then) =
      _$ConcertCopyWithImpl<$Res, Concert>;
  @useResult
  $Res call(
      {@HiveField(0) String id,
      @HiveField(1) String? createdAt,
      @HiveField(2) String? updatedAt,
      @HiveField(3) String place,
      @HiveField(4) String date,
      @HiveField(5) String time,
      @HiveField(6) Context context,
      @HiveField(7) String? additionalInformations,
      @HiveField(8) String? name,
      @HiveField(9) String? createdBy,
      @HiveField(10) String? affiche});
}

/// @nodoc
class _$ConcertCopyWithImpl<$Res, $Val extends Concert>
    implements $ConcertCopyWith<$Res> {
  _$ConcertCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Concert
  /// with the given fields replaced by the non-null parameter values.
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
      {@HiveField(0) String id,
      @HiveField(1) String? createdAt,
      @HiveField(2) String? updatedAt,
      @HiveField(3) String place,
      @HiveField(4) String date,
      @HiveField(5) String time,
      @HiveField(6) Context context,
      @HiveField(7) String? additionalInformations,
      @HiveField(8) String? name,
      @HiveField(9) String? createdBy,
      @HiveField(10) String? affiche});
}

/// @nodoc
class __$$ConcertImplCopyWithImpl<$Res>
    extends _$ConcertCopyWithImpl<$Res, _$ConcertImpl>
    implements _$$ConcertImplCopyWith<$Res> {
  __$$ConcertImplCopyWithImpl(
      _$ConcertImpl _value, $Res Function(_$ConcertImpl) _then)
      : super(_value, _then);

  /// Create a copy of Concert
  /// with the given fields replaced by the non-null parameter values.
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
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$ConcertImpl implements _Concert {
  const _$ConcertImpl(
      {@HiveField(0) required this.id,
      @HiveField(1) this.createdAt,
      @HiveField(2) this.updatedAt,
      @HiveField(3) required this.place,
      @HiveField(4) required this.date,
      @HiveField(5) required this.time,
      @HiveField(6) required this.context,
      @HiveField(7) this.additionalInformations,
      @HiveField(8) this.name,
      @HiveField(9) this.createdBy,
      @HiveField(10) this.affiche});

  factory _$ConcertImpl.fromJson(Map<String, dynamic> json) =>
      _$$ConcertImplFromJson(json);

  @override
  @HiveField(0)
  final String id;
  @override
  @HiveField(1)
  final String? createdAt;
  @override
  @HiveField(2)
  final String? updatedAt;
  @override
  @HiveField(3)
  final String place;
  @override
  @HiveField(4)
  final String date;
  @override
  @HiveField(5)
  final String time;
  @override
  @HiveField(6)
  final Context context;
  @override
  @HiveField(7)
  final String? additionalInformations;
  @override
  @HiveField(8)
  final String? name;
  @override
  @HiveField(9)
  final String? createdBy;
  @override
  @HiveField(10)
  final String? affiche;

  @override
  String toString() {
    return 'Concert(id: $id, createdAt: $createdAt, updatedAt: $updatedAt, place: $place, date: $date, time: $time, context: $context, additionalInformations: $additionalInformations, name: $name, createdBy: $createdBy, affiche: $affiche)';
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
            (identical(other.affiche, affiche) || other.affiche == affiche));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, id, createdAt, updatedAt, place,
      date, time, context, additionalInformations, name, createdBy, affiche);

  /// Create a copy of Concert
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
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
      {@HiveField(0) required final String id,
      @HiveField(1) final String? createdAt,
      @HiveField(2) final String? updatedAt,
      @HiveField(3) required final String place,
      @HiveField(4) required final String date,
      @HiveField(5) required final String time,
      @HiveField(6) required final Context context,
      @HiveField(7) final String? additionalInformations,
      @HiveField(8) final String? name,
      @HiveField(9) final String? createdBy,
      @HiveField(10) final String? affiche}) = _$ConcertImpl;

  factory _Concert.fromJson(Map<String, dynamic> json) = _$ConcertImpl.fromJson;

  @override
  @HiveField(0)
  String get id;
  @override
  @HiveField(1)
  String? get createdAt;
  @override
  @HiveField(2)
  String? get updatedAt;
  @override
  @HiveField(3)
  String get place;
  @override
  @HiveField(4)
  String get date;
  @override
  @HiveField(5)
  String get time;
  @override
  @HiveField(6)
  Context get context;
  @override
  @HiveField(7)
  String? get additionalInformations;
  @override
  @HiveField(8)
  String? get name;
  @override
  @HiveField(9)
  String? get createdBy;
  @override
  @HiveField(10)
  String? get affiche;

  /// Create a copy of Concert
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$ConcertImplCopyWith<_$ConcertImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
