// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notification_settings.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

NotificationSettings _$NotificationSettingsFromJson(Map<String, dynamic> json) {
  return _NotificationSettings.fromJson(json);
}

/// @nodoc
mixin _$NotificationSettings {
  bool get enabled => throw _privateConstructorUsedError;
  List<NotificationTime> get selectedTimes =>
      throw _privateConstructorUsedError;
  bool get concertsEnabled => throw _privateConstructorUsedError;
  bool get rehearsalsEnabled => throw _privateConstructorUsedError;
  bool get realtimeEnabled => throw _privateConstructorUsedError;

  /// Serializes this NotificationSettings to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of NotificationSettings
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $NotificationSettingsCopyWith<NotificationSettings> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $NotificationSettingsCopyWith<$Res> {
  factory $NotificationSettingsCopyWith(NotificationSettings value,
          $Res Function(NotificationSettings) then) =
      _$NotificationSettingsCopyWithImpl<$Res, NotificationSettings>;
  @useResult
  $Res call(
      {bool enabled,
      List<NotificationTime> selectedTimes,
      bool concertsEnabled,
      bool rehearsalsEnabled,
      bool realtimeEnabled});
}

/// @nodoc
class _$NotificationSettingsCopyWithImpl<$Res,
        $Val extends NotificationSettings>
    implements $NotificationSettingsCopyWith<$Res> {
  _$NotificationSettingsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of NotificationSettings
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? enabled = null,
    Object? selectedTimes = null,
    Object? concertsEnabled = null,
    Object? rehearsalsEnabled = null,
    Object? realtimeEnabled = null,
  }) {
    return _then(_value.copyWith(
      enabled: null == enabled
          ? _value.enabled
          : enabled // ignore: cast_nullable_to_non_nullable
              as bool,
      selectedTimes: null == selectedTimes
          ? _value.selectedTimes
          : selectedTimes // ignore: cast_nullable_to_non_nullable
              as List<NotificationTime>,
      concertsEnabled: null == concertsEnabled
          ? _value.concertsEnabled
          : concertsEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      rehearsalsEnabled: null == rehearsalsEnabled
          ? _value.rehearsalsEnabled
          : rehearsalsEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      realtimeEnabled: null == realtimeEnabled
          ? _value.realtimeEnabled
          : realtimeEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$NotificationSettingsImplCopyWith<$Res>
    implements $NotificationSettingsCopyWith<$Res> {
  factory _$$NotificationSettingsImplCopyWith(_$NotificationSettingsImpl value,
          $Res Function(_$NotificationSettingsImpl) then) =
      __$$NotificationSettingsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {bool enabled,
      List<NotificationTime> selectedTimes,
      bool concertsEnabled,
      bool rehearsalsEnabled,
      bool realtimeEnabled});
}

/// @nodoc
class __$$NotificationSettingsImplCopyWithImpl<$Res>
    extends _$NotificationSettingsCopyWithImpl<$Res, _$NotificationSettingsImpl>
    implements _$$NotificationSettingsImplCopyWith<$Res> {
  __$$NotificationSettingsImplCopyWithImpl(_$NotificationSettingsImpl _value,
      $Res Function(_$NotificationSettingsImpl) _then)
      : super(_value, _then);

  /// Create a copy of NotificationSettings
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? enabled = null,
    Object? selectedTimes = null,
    Object? concertsEnabled = null,
    Object? rehearsalsEnabled = null,
    Object? realtimeEnabled = null,
  }) {
    return _then(_$NotificationSettingsImpl(
      enabled: null == enabled
          ? _value.enabled
          : enabled // ignore: cast_nullable_to_non_nullable
              as bool,
      selectedTimes: null == selectedTimes
          ? _value._selectedTimes
          : selectedTimes // ignore: cast_nullable_to_non_nullable
              as List<NotificationTime>,
      concertsEnabled: null == concertsEnabled
          ? _value.concertsEnabled
          : concertsEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      rehearsalsEnabled: null == rehearsalsEnabled
          ? _value.rehearsalsEnabled
          : rehearsalsEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
      realtimeEnabled: null == realtimeEnabled
          ? _value.realtimeEnabled
          : realtimeEnabled // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$NotificationSettingsImpl implements _NotificationSettings {
  const _$NotificationSettingsImpl(
      {this.enabled = true,
      final List<NotificationTime> selectedTimes = const [
        NotificationTime.oneDay,
        NotificationTime.fifteenMinutes
      ],
      this.concertsEnabled = true,
      this.rehearsalsEnabled = true,
      this.realtimeEnabled = false})
      : _selectedTimes = selectedTimes;

  factory _$NotificationSettingsImpl.fromJson(Map<String, dynamic> json) =>
      _$$NotificationSettingsImplFromJson(json);

  @override
  @JsonKey()
  final bool enabled;
  final List<NotificationTime> _selectedTimes;
  @override
  @JsonKey()
  List<NotificationTime> get selectedTimes {
    if (_selectedTimes is EqualUnmodifiableListView) return _selectedTimes;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_selectedTimes);
  }

  @override
  @JsonKey()
  final bool concertsEnabled;
  @override
  @JsonKey()
  final bool rehearsalsEnabled;
  @override
  @JsonKey()
  final bool realtimeEnabled;

  @override
  String toString() {
    return 'NotificationSettings(enabled: $enabled, selectedTimes: $selectedTimes, concertsEnabled: $concertsEnabled, rehearsalsEnabled: $rehearsalsEnabled, realtimeEnabled: $realtimeEnabled)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$NotificationSettingsImpl &&
            (identical(other.enabled, enabled) || other.enabled == enabled) &&
            const DeepCollectionEquality()
                .equals(other._selectedTimes, _selectedTimes) &&
            (identical(other.concertsEnabled, concertsEnabled) ||
                other.concertsEnabled == concertsEnabled) &&
            (identical(other.rehearsalsEnabled, rehearsalsEnabled) ||
                other.rehearsalsEnabled == rehearsalsEnabled) &&
            (identical(other.realtimeEnabled, realtimeEnabled) ||
                other.realtimeEnabled == realtimeEnabled));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
      runtimeType,
      enabled,
      const DeepCollectionEquality().hash(_selectedTimes),
      concertsEnabled,
      rehearsalsEnabled,
      realtimeEnabled);

  /// Create a copy of NotificationSettings
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$NotificationSettingsImplCopyWith<_$NotificationSettingsImpl>
      get copyWith =>
          __$$NotificationSettingsImplCopyWithImpl<_$NotificationSettingsImpl>(
              this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$NotificationSettingsImplToJson(
      this,
    );
  }
}

abstract class _NotificationSettings implements NotificationSettings {
  const factory _NotificationSettings(
      {final bool enabled,
      final List<NotificationTime> selectedTimes,
      final bool concertsEnabled,
      final bool rehearsalsEnabled,
      final bool realtimeEnabled}) = _$NotificationSettingsImpl;

  factory _NotificationSettings.fromJson(Map<String, dynamic> json) =
      _$NotificationSettingsImpl.fromJson;

  @override
  bool get enabled;
  @override
  List<NotificationTime> get selectedTimes;
  @override
  bool get concertsEnabled;
  @override
  bool get rehearsalsEnabled;
  @override
  bool get realtimeEnabled;

  /// Create a copy of NotificationSettings
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$NotificationSettingsImplCopyWith<_$NotificationSettingsImpl>
      get copyWith => throw _privateConstructorUsedError;
}
