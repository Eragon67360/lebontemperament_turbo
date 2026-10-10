import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show Supabase;

import '../../../core/config/app_config.dart';
import '../../../data/services/drive_service.dart'
    show AccessTokenProvider, SessionRefresher;

/// A photo change that did not go through; [message] is shown as is.
class ProfilePhotoException implements Exception {
  const ProfilePhotoException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// The image type of [bytes] from their first bytes, for the types the
/// website accepts; null for anything else (HEIC, SVG, not an image).
String? sniffImageType(Uint8List bytes) {
  bool at(int offset, List<int> signature) {
    if (bytes.length < offset + signature.length) return false;
    for (var i = 0; i < signature.length; i++) {
      if (bytes[offset + i] != signature[i]) return false;
    }
    return true;
  }

  List<int> ascii(String text) => text.codeUnits;

  if (at(0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }
  if (at(0, ascii('RIFF')) && at(8, ascii('WEBP'))) return 'image/webp';
  if (at(0, ascii('GIF87a')) || at(0, ascii('GIF89a'))) return 'image/gif';
  return null;
}

String? _supabaseAccessToken() =>
    Supabase.instance.client.auth.currentSession?.accessToken;

Future<bool> _refreshSupabaseSession() async {
  try {
    final result = await Supabase.instance.client.auth.refreshSession();
    return result.session != null;
  } catch (_) {
    return false;
  }
}

/// Profil › Photo de profil: the member's own photo, through the website's
/// `/api/profile/photo` (members can't write their profile or the photo
/// bucket themselves; the website checks the image and who is asking, and
/// changes only the photo, never the name).
class ProfilePhotoService {
  ProfilePhotoService({
    Dio? dio,
    AccessTokenProvider? accessToken,
    SessionRefresher? refreshSession,
    Logger? logger,
  }) : _dio =
           dio ??
           Dio(
             BaseOptions(
               connectTimeout: const Duration(seconds: 15),
               sendTimeout: const Duration(seconds: 60),
               receiveTimeout: const Duration(seconds: 30),
             ),
           ),
       _accessToken = accessToken ?? _supabaseAccessToken,
       _refreshSession = refreshSession ?? _refreshSupabaseSession,
       _logger = logger ?? Logger();

  final Dio _dio;
  final AccessTokenProvider _accessToken;
  final SessionRefresher _refreshSession;
  final Logger _logger;

  static String get endpoint => '${AppConfig.siteUrl}/api/profile/photo';

  /// Saves [bytes] as the member's photo; returns its new URL.
  Future<String> upload(Uint8List bytes) async {
    final type = sniffImageType(bytes);
    if (type == null) {
      throw const ProfilePhotoException(
        'Ce format de photo n’est pas pris en charge. '
        'Choisissez une photo JPEG ou PNG.',
      );
    }
    final response = await _send(
      (headers) => _dio.post<dynamic>(
        endpoint,
        // A new FormData per attempt: Dio can't send one twice.
        data: FormData.fromMap({
          'file': MultipartFile.fromBytes(
            bytes,
            filename: 'photo.${type.split('/').last}',
            contentType: DioMediaType.parse(type),
          ),
        }),
        options: Options(headers: headers),
      ),
    );
    final url = _body(response)['url'];
    if (url is! String || url.isEmpty) throw _unexpected;
    return url;
  }

  /// Removes the member's photo (their initials show instead).
  Future<void> remove() async {
    await _send(
      (headers) =>
          _dio.delete<dynamic>(endpoint, options: Options(headers: headers)),
    );
  }

  static const _unexpected = ProfilePhotoException(
    'Réponse inattendue du serveur. Réessayez plus tard.',
  );

  Map<String, dynamic> _body(Response<dynamic> response) {
    final data = response.data;
    return data is Map<String, dynamic> ? data : const {};
  }

  /// Sends [request] with the member's token; on a 401 (a token that expired
  /// while the app slept) refreshes the session once and retries.
  Future<Response<dynamic>> _send(
    Future<Response<dynamic>> Function(Map<String, String> headers) request,
  ) async {
    Map<String, String> headers() {
      final token = _accessToken();
      return token == null || token.isEmpty
          ? const {}
          : {'Authorization': 'Bearer $token'};
    }

    try {
      try {
        return await request(headers());
      } on DioException catch (e) {
        if (e.response?.statusCode != 401 || !await _refreshSession()) rethrow;
        return await request(headers());
      }
    } on DioException catch (e) {
      _logger.w(
        'ProfilePhotoService failed: ${e.type} ${e.response?.statusCode}',
      );
      final status = e.response?.statusCode;
      if (status == null) {
        throw const ProfilePhotoException(
          'Pas de connexion. Vérifiez votre réseau et réessayez.',
        );
      }
      if (status == 401) {
        throw const ProfilePhotoException(
          'Session expirée. Veuillez vous reconnecter.',
        );
      }
      final error = e.response?.data is Map
          ? (e.response!.data as Map)['error']
          : null;
      if (error is String && error.isNotEmpty && status < 500) {
        throw ProfilePhotoException(error);
      }
      throw const ProfilePhotoException(
        'La photo n’a pas pu être enregistrée. Réessayez plus tard.',
      );
    }
  }
}

final profilePhotoServiceProvider = Provider<ProfilePhotoService>(
  (ref) => ProfilePhotoService(),
);
