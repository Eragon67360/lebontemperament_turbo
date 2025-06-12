// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_settings.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$NotificationSettingsImpl _$$NotificationSettingsImplFromJson(
        Map<String, dynamic> json) =>
    _$NotificationSettingsImpl(
      enabled: json['enabled'] as bool? ?? true,
      selectedTimes: (json['selectedTimes'] as List<dynamic>?)
              ?.map((e) => $enumDecode(_$NotificationTimeEnumMap, e))
              .toList() ??
          const [NotificationTime.oneDay, NotificationTime.fifteenMinutes],
      concertsEnabled: json['concertsEnabled'] as bool? ?? true,
      rehearsalsEnabled: json['rehearsalsEnabled'] as bool? ?? true,
    );

Map<String, dynamic> _$$NotificationSettingsImplToJson(
        _$NotificationSettingsImpl instance) =>
    <String, dynamic>{
      'enabled': instance.enabled,
      'selectedTimes': instance.selectedTimes
          .map((e) => _$NotificationTimeEnumMap[e]!)
          .toList(),
      'concertsEnabled': instance.concertsEnabled,
      'rehearsalsEnabled': instance.rehearsalsEnabled,
    };

const _$NotificationTimeEnumMap = {
  NotificationTime.twoDays: '2_days',
  NotificationTime.oneDay: '1_day',
  NotificationTime.twoHours: '2_hours',
  NotificationTime.oneHour: '1_hour',
  NotificationTime.thirtyMinutes: '30_minutes',
  NotificationTime.fifteenMinutes: '15_minutes',
};
