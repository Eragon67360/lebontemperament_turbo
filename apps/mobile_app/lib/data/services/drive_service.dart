import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/drive_file.dart';
import '../../core/config/app_config.dart';

/// Returns the current Supabase access token, or null when signed out.
typedef AccessTokenProvider = String? Function();

String? _supabaseAccessToken() =>
    Supabase.instance.client.auth.currentSession?.accessToken;

/// Fetches Drive folder contents via the website API.
///
/// The website only serves `/api/drive/*` to a signed-in member: the browser
/// sends cookies, the app sends `Authorization: Bearer <access token>` (the
/// same scheme as `/api/contact/mobile`).
class DriveService {
  DriveService({Logger? logger, Dio? dio, AccessTokenProvider? accessToken})
    : _logger = logger ?? Logger(),
      _dio =
          dio ??
          Dio(
            BaseOptions(
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 15),
            ),
          ),
      _accessToken = accessToken ?? _supabaseAccessToken;

  final Logger _logger;
  final Dio _dio;
  final AccessTokenProvider _accessToken;

  /// Headers that authenticate the member against the website API; empty
  /// when there is no session (the API then answers 401, as it should).
  Map<String, String> get authHeaders {
    final token = _accessToken();
    if (token == null || token.isEmpty) return const {};
    return {'Authorization': 'Bearer $token'};
  }

  /// URL of the website proxy that streams a Drive file (needs [authHeaders]).
  static String fileProxyUrl(String fileId) =>
      '${AppConfig.siteUrl}/api/drive/file?fileId=${Uri.encodeComponent(fileId)}';

  /// Fetches files and folders for the given folder ID.
  Future<List<DriveFile>> getFolderContents(String folderId) async {
    final url =
        '${AppConfig.siteUrl}/api/drive/files?folderID=${Uri.encodeComponent(folderId)}';

    try {
      final response = await _dio.get<List<dynamic>>(
        url,
        options: Options(headers: authHeaders),
      );

      if (response.data == null) {
        throw DriveServiceException('Réponse vide');
      }

      final list = response.data!;
      return list
          .map((e) => DriveFile.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      _logger.e('DriveService getFolderContents failed: $e');
      final status = e.response?.statusCode;
      if (status != null) {
        if (status == 401) {
          throw DriveServiceException(
            'Session expirée. Veuillez vous reconnecter.',
          );
        }
        if (status == 403) {
          throw DriveServiceException(
            'Ce dossier n\'est pas accessible depuis l\'application.',
          );
        }
        final data = e.response?.data;
        final msg = data is Map && data['error'] != null
            ? data['error'].toString()
            : 'Erreur $status';
        throw DriveServiceException(msg);
      }
      throw DriveServiceException(
        e.message ?? 'Impossible de charger les fichiers',
      );
    }
  }

  /// Downloads a Drive file through the website proxy, authenticated.
  Future<List<int>> downloadFile(String fileId) async {
    try {
      final response = await _dio.get<List<int>>(
        fileProxyUrl(fileId),
        options: Options(
          headers: authHeaders,
          responseType: ResponseType.bytes,
        ),
      );
      final bytes = response.data;
      if (bytes == null || bytes.isEmpty) {
        throw DriveServiceException('Fichier vide');
      }
      return bytes;
    } on DioException catch (e) {
      _logger.e('DriveService downloadFile failed: $e');
      final status = e.response?.statusCode;
      if (status == 401) {
        throw DriveServiceException(
          'Session expirée. Veuillez vous reconnecter.',
        );
      }
      if (status == 403) {
        throw DriveServiceException('Ce fichier n\'est pas accessible.');
      }
      throw DriveServiceException(
        e.message ?? 'Impossible de télécharger le fichier',
      );
    }
  }
}

class DriveServiceException implements Exception {
  DriveServiceException(this.message);
  final String message;
  @override
  String toString() => message;
}
