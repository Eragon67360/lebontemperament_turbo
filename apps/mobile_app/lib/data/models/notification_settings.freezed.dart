// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'notification_settings.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$NotificationSettings {

 bool get enabled; List<NotificationTime> get selectedTimes; bool get concertsEnabled; bool get rehearsalsEnabled; bool get realtimeEnabled;
/// Create a copy of NotificationSettings
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$NotificationSettingsCopyWith<NotificationSettings> get copyWith => _$NotificationSettingsCopyWithImpl<NotificationSettings>(this as NotificationSettings, _$identity);

  /// Serializes this NotificationSettings to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as NotificationSettings;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is NotificationSettings&&(identical(other.enabled, _this.enabled) || other.enabled == _this.enabled)&&const DeepCollectionEquality().equals(other.selectedTimes, _this.selectedTimes)&&(identical(other.concertsEnabled, _this.concertsEnabled) || other.concertsEnabled == _this.concertsEnabled)&&(identical(other.rehearsalsEnabled, _this.rehearsalsEnabled) || other.rehearsalsEnabled == _this.rehearsalsEnabled)&&(identical(other.realtimeEnabled, _this.realtimeEnabled) || other.realtimeEnabled == _this.realtimeEnabled));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as NotificationSettings;
  return Object.hash(runtimeType,_this.enabled,const DeepCollectionEquality().hash(_this.selectedTimes),_this.concertsEnabled,_this.rehearsalsEnabled,_this.realtimeEnabled);
}

@override
String toString() {
  final _this = this as NotificationSettings;
  return 'NotificationSettings(enabled: ${_this.enabled}, selectedTimes: ${_this.selectedTimes}, concertsEnabled: ${_this.concertsEnabled}, rehearsalsEnabled: ${_this.rehearsalsEnabled}, realtimeEnabled: ${_this.realtimeEnabled})';
}


}

/// @nodoc
abstract mixin class $NotificationSettingsCopyWith<$Res>  {
  factory $NotificationSettingsCopyWith(NotificationSettings value, $Res Function(NotificationSettings) _then) = _$NotificationSettingsCopyWithImpl;
@useResult
$Res call({
 bool enabled, List<NotificationTime> selectedTimes, bool concertsEnabled, bool rehearsalsEnabled, bool realtimeEnabled
});




}
/// @nodoc
class _$NotificationSettingsCopyWithImpl<$Res>
    implements $NotificationSettingsCopyWith<$Res> {
  _$NotificationSettingsCopyWithImpl(this._self, this._then);

  final NotificationSettings _self;
  final $Res Function(NotificationSettings) _then;

/// Create a copy of NotificationSettings
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? enabled = null,Object? selectedTimes = null,Object? concertsEnabled = null,Object? rehearsalsEnabled = null,Object? realtimeEnabled = null,}) {
  return _then(NotificationSettings(
enabled: null == enabled ? _self.enabled : enabled // ignore: cast_nullable_to_non_nullable
as bool,selectedTimes: null == selectedTimes ? _self.selectedTimes : selectedTimes // ignore: cast_nullable_to_non_nullable
as List<NotificationTime>,concertsEnabled: null == concertsEnabled ? _self.concertsEnabled : concertsEnabled // ignore: cast_nullable_to_non_nullable
as bool,rehearsalsEnabled: null == rehearsalsEnabled ? _self.rehearsalsEnabled : rehearsalsEnabled // ignore: cast_nullable_to_non_nullable
as bool,realtimeEnabled: null == realtimeEnabled ? _self.realtimeEnabled : realtimeEnabled // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}

}


/// Adds pattern-matching-related methods to [NotificationSettings].
extension NotificationSettingsPatterns on NotificationSettings {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _NotificationSettings value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _NotificationSettings() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _NotificationSettings value)  $default,){
final _that = this;
switch (_that) {
case _NotificationSettings():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _NotificationSettings value)?  $default,){
final _that = this;
switch (_that) {
case _NotificationSettings() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( bool enabled,  List<NotificationTime> selectedTimes,  bool concertsEnabled,  bool rehearsalsEnabled,  bool realtimeEnabled)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _NotificationSettings() when $default != null:
return $default(_that.enabled,_that.selectedTimes,_that.concertsEnabled,_that.rehearsalsEnabled,_that.realtimeEnabled);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( bool enabled,  List<NotificationTime> selectedTimes,  bool concertsEnabled,  bool rehearsalsEnabled,  bool realtimeEnabled)  $default,) {final _that = this;
switch (_that) {
case _NotificationSettings():
return $default(_that.enabled,_that.selectedTimes,_that.concertsEnabled,_that.rehearsalsEnabled,_that.realtimeEnabled);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( bool enabled,  List<NotificationTime> selectedTimes,  bool concertsEnabled,  bool rehearsalsEnabled,  bool realtimeEnabled)?  $default,) {final _that = this;
switch (_that) {
case _NotificationSettings() when $default != null:
return $default(_that.enabled,_that.selectedTimes,_that.concertsEnabled,_that.rehearsalsEnabled,_that.realtimeEnabled);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _NotificationSettings implements NotificationSettings {
  const _NotificationSettings({this.enabled = true,  List<NotificationTime> selectedTimes = const [NotificationTime.oneDay, NotificationTime.fifteenMinutes], this.concertsEnabled = true, this.rehearsalsEnabled = true, this.realtimeEnabled = false}): _selectedTimes = selectedTimes;
  factory _NotificationSettings.fromJson(Map<String, dynamic> json) => _$NotificationSettingsFromJson(json);

@override@JsonKey() final  bool enabled;
 final  List<NotificationTime> _selectedTimes;
@override@JsonKey() List<NotificationTime> get selectedTimes {
  if (_selectedTimes is EqualUnmodifiableListView) return _selectedTimes;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_selectedTimes);
}

@override@JsonKey() final  bool concertsEnabled;
@override@JsonKey() final  bool rehearsalsEnabled;
@override@JsonKey() final  bool realtimeEnabled;

/// Create a copy of NotificationSettings
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$NotificationSettingsCopyWith<_NotificationSettings> get copyWith => __$NotificationSettingsCopyWithImpl<_NotificationSettings>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$NotificationSettingsToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _NotificationSettings&&(identical(other.enabled, enabled) || other.enabled == enabled)&&const DeepCollectionEquality().equals(other.selectedTimes, _selectedTimes)&&(identical(other.concertsEnabled, concertsEnabled) || other.concertsEnabled == concertsEnabled)&&(identical(other.rehearsalsEnabled, rehearsalsEnabled) || other.rehearsalsEnabled == rehearsalsEnabled)&&(identical(other.realtimeEnabled, realtimeEnabled) || other.realtimeEnabled == realtimeEnabled));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,enabled,const DeepCollectionEquality().hash(_selectedTimes),concertsEnabled,rehearsalsEnabled,realtimeEnabled);
}

@override
String toString() {
    return 'NotificationSettings(enabled: $enabled, selectedTimes: $selectedTimes, concertsEnabled: $concertsEnabled, rehearsalsEnabled: $rehearsalsEnabled, realtimeEnabled: $realtimeEnabled)';
}


}

/// @nodoc
abstract mixin class _$NotificationSettingsCopyWith<$Res> implements $NotificationSettingsCopyWith<$Res> {
  factory _$NotificationSettingsCopyWith(_NotificationSettings value, $Res Function(_NotificationSettings) _then) = __$NotificationSettingsCopyWithImpl;
@override @useResult
$Res call({
 bool enabled, List<NotificationTime> selectedTimes, bool concertsEnabled, bool rehearsalsEnabled, bool realtimeEnabled
});




}
/// @nodoc
class __$NotificationSettingsCopyWithImpl<$Res>
    implements _$NotificationSettingsCopyWith<$Res> {
  __$NotificationSettingsCopyWithImpl(this._self, this._then);

  final _NotificationSettings _self;
  final $Res Function(_NotificationSettings) _then;

/// Create a copy of NotificationSettings
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? enabled = null,Object? selectedTimes = null,Object? concertsEnabled = null,Object? rehearsalsEnabled = null,Object? realtimeEnabled = null,}) {
  return _then(_NotificationSettings(
enabled: null == enabled ? _self.enabled : enabled // ignore: cast_nullable_to_non_nullable
as bool,selectedTimes: null == selectedTimes ? _self._selectedTimes : selectedTimes // ignore: cast_nullable_to_non_nullable
as List<NotificationTime>,concertsEnabled: null == concertsEnabled ? _self.concertsEnabled : concertsEnabled // ignore: cast_nullable_to_non_nullable
as bool,rehearsalsEnabled: null == rehearsalsEnabled ? _self.rehearsalsEnabled : rehearsalsEnabled // ignore: cast_nullable_to_non_nullable
as bool,realtimeEnabled: null == realtimeEnabled ? _self.realtimeEnabled : realtimeEnabled // ignore: cast_nullable_to_non_nullable
as bool,
  ));
}


}

// dart format on
