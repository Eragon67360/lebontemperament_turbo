import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../../../core/config/app_config.dart';
import 'public_content.dart';

/// Reads the usual rehearsal times from the website's public
/// `GET /api/joining` (`apps/website/app/api/joining/route.ts`), the ones
/// admins edit under Concerts et site public › « Rejoindre et FAQ ».
class RehearsalSlotsService {
  RehearsalSlotsService({Dio? dio, Logger? logger, String? siteUrl})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              connectTimeout: const Duration(seconds: 10),
              receiveTimeout: const Duration(seconds: 10),
            ),
          ),
      _logger = logger ?? Logger(),
      _siteUrl = siteUrl ?? AppConfig.siteUrl;

  final Dio _dio;
  final Logger _logger;
  final String _siteUrl;

  /// The published times, or [kRehearsalSlots] when the website can't be
  /// reached or has none.
  Future<List<RehearsalSlot>> getSlots() async {
    try {
      final response = await _dio.get<dynamic>('$_siteUrl/api/joining');
      final slots = parseRehearsalSlots(response.data);
      return slots == null || slots.isEmpty ? kRehearsalSlots : slots;
    } catch (e) {
      _logger.w('Rehearsal times unavailable, showing the built-in ones: $e');
      return kRehearsalSlots;
    }
  }
}

/// Parses `{ slots: [{ group, day, time, place, rhythm }] }` (the day in
/// lower case, « mercredi »); null when [data] isn't that shape.
List<RehearsalSlot>? parseRehearsalSlots(Object? data) {
  if (data is! Map || data['slots'] is! List) return null;
  return [
    for (final s in data['slots'] as List)
      if (s is Map &&
          s['group'] is String &&
          s['day'] is String &&
          s['time'] is String &&
          s['place'] is String &&
          s['rhythm'] is String &&
          (s['rhythm'] as String).isNotEmpty)
        RehearsalSlot(
          group: s['group'] as String,
          when: '${_capitalized(s['day'] as String)}, ${s['time']}',
          place: s['place'] as String,
          rhythm: s['rhythm'] as String,
        ),
  ];
}

String _capitalized(String text) =>
    text.isEmpty ? text : text[0].toUpperCase() + text.substring(1);
