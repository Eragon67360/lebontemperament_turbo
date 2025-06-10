import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_settings.freezed.dart';
part 'notification_settings.g.dart';

enum NotificationTime {
  @JsonValue('2_days')
  twoDays,
  @JsonValue('1_day')
  oneDay,
  @JsonValue('2_hours')
  twoHours,
  @JsonValue('1_hour')
  oneHour,
  @JsonValue('30_minutes')
  thirtyMinutes,
  @JsonValue('15_minutes')
  fifteenMinutes,
}

@freezed
class NotificationSettings with _$NotificationSettings {
  const factory NotificationSettings({
    @Default(true) bool enabled,
    @Default([NotificationTime.oneDay, NotificationTime.fifteenMinutes])
    List<NotificationTime> selectedTimes,
    @Default(true) bool concertsEnabled,
    @Default(true) bool rehearsalsEnabled,
  }) = _NotificationSettings;

  factory NotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$NotificationSettingsFromJson(json);
}

extension NotificationTimeExtension on NotificationTime {
  String get displayName {
    switch (this) {
      case NotificationTime.twoDays:
        return '2 jours avant';
      case NotificationTime.oneDay:
        return '1 jour avant';
      case NotificationTime.twoHours:
        return '2 heures avant';
      case NotificationTime.oneHour:
        return '1 heure avant';
      case NotificationTime.thirtyMinutes:
        return '30 minutes avant';
      case NotificationTime.fifteenMinutes:
        return '15 minutes avant';
    }
  }

  Duration get duration {
    switch (this) {
      case NotificationTime.twoDays:
        return const Duration(days: 2);
      case NotificationTime.oneDay:
        return const Duration(days: 1);
      case NotificationTime.twoHours:
        return const Duration(hours: 2);
      case NotificationTime.oneHour:
        return const Duration(hours: 1);
      case NotificationTime.thirtyMinutes:
        return const Duration(minutes: 30);
      case NotificationTime.fifteenMinutes:
        return const Duration(minutes: 15);
    }
  }
}
