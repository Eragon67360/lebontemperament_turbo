import 'dart:io';

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/drive_file.dart';
import '../../core/config/app_config.dart';

/// Returns the current Supabase access token, or null when signed out.
typedef AccessTokenProvider = String? Function();

/// Refreshes the session once; true when a new access token is available.
typedef SessionRefresher = Future<bool> Function();

/// Bytes received so far and the total announced by the server (-1 when it
/// did not say, e.g. a Google Doc exported on the fly).
typedef DriveProgress = void Function(int received, int total);

/// Response header the website sets when a folder has more items than the
/// listing could return (see `apps/website/app/api/drive/files/route.ts`).
const kDriveTruncatedHeader = 'x-drive-truncated';

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

/// Fetches Drive folder contents via the website API.
///
/// The website only serves `/api/drive/*` to a signed-in member: the browser
/// sends cookies, the app sends `Authorization: Bearer <access token>` (the
/// same scheme as `/api/contact/mobile`).
class DriveService {
  DriveService({
    Logger? logger,
    Dio? dio,
    AccessTokenProvider? accessToken,
    SessionRefresher? refreshSession,
  }) : _logger = logger ?? Logger(),
       _dio =
           dio ??
           Dio(
             BaseOptions(
               connectTimeout: const Duration(seconds: 15),
               receiveTimeout: const Duration(seconds: 15),
             ),
           ),
       _accessToken = accessToken ?? _supabaseAccessToken,
       _refreshSession = refreshSession ?? _refreshSupabaseSession;

  final Logger _logger;
  final Dio _dio;
  final AccessTokenProvider _accessToken;
  final SessionRefresher _refreshSession;

  /// Sends [request] with [authHeaders]; on a 401 (an access token that
  /// expired while the app slept, before supabase_flutter refreshed it)
  /// refreshes the session once and retries.
  Future<Response<T>> _authorized<T>(
    Future<Response<T>> Function(Map<String, String> headers) request,
  ) async {
    try {
      return await request(authHeaders);
    } on DioException catch (e) {
      if (e.response?.statusCode != 401 || !await _refreshSession()) rethrow;
      return request(authHeaders);
    }
  }

  /// Headers that authenticate the member against the website API; empty
  /// when there is no session (the API then answers 401, as it should).
  Map<String, String> get authHeaders {
    final token = _accessToken();
    if (token == null || token.isEmpty) return const {};
    return {'Authorization': 'Bearer $token'};
  }

  /// URL of the website proxy that streams a Drive file (needs [authHeaders]).
  /// With [download], the proxy answers an attachment named like the Drive
  /// file (Google Docs and Sheets exported as PDF).
  static String fileProxyUrl(String fileId, {bool download = false}) =>
      '${AppConfig.siteUrl}/api/drive/file?fileId=${Uri.encodeComponent(fileId)}'
      '${download ? '&download=1' : ''}';

  /// Fetches files and folders for the given folder ID.
  Future<DriveListing> getFolderContents(String folderId) async {
    final url =
        '${AppConfig.siteUrl}/api/drive/files?folderID=${Uri.encodeComponent(folderId)}';

    try {
      final response = await _authorized(
        (headers) => _dio.get<dynamic>(url, options: Options(headers: headers)),
      );

      final data = response.data;
      // Anything but a JSON array (a captive-portal page, a proxy error
      // page) is a failure the screen must show, not a crash.
      if (data is! List) {
        throw DriveServiceException('Réponse inattendue du serveur');
      }
      return DriveListing(
        items: data
            .whereType<Map<String, dynamic>>()
            .map(DriveFile.fromJson)
            .toList(),
        truncated:
            response.headers.value(kDriveTruncatedHeader)?.toLowerCase() ==
            'true',
      );
    } on DriveServiceException {
      rethrow;
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
        // The website's 5xx bodies are English ("Failed to retrieve
        // files"): members get a French sentence instead.
        throw DriveServiceException(
          status >= 500
              ? 'Le serveur des partitions ne répond pas. Réessayez dans un instant.'
              : 'Impossible de charger les fichiers (erreur $status).',
        );
      }
      throw DriveServiceException(
        _networkMessage(e) ?? 'Impossible de charger les fichiers',
      );
    } catch (e) {
      _logger.e('DriveService getFolderContents failed: $e');
      throw DriveServiceException('Impossible de charger les fichiers');
    }
  }

  /// Streams a Drive file through the website proxy, authenticated, into
  /// [savePath] (never whole in memory: recordings run to tens of MB).
  /// [onProgress] reports the bytes received; cancelling [cancelToken]
  /// stops the transfer, deletes the partial file and throws
  /// [DriveDownloadCancelled].
  ///
  /// With [attachment], the proxy names the file like the Drive file
  /// (Google Docs exported as PDF) and the name comes back in
  /// [DriveDownload.fileName].
  Future<DriveDownload> downloadToFile(
    String fileId, {
    required String savePath,
    bool attachment = false,
    DriveProgress? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _authorized(
        (headers) => _dio.download(
          fileProxyUrl(fileId, download: attachment),
          savePath,
          options: Options(headers: headers),
          onReceiveProgress: onProgress,
          cancelToken: cancelToken,
        ),
      );
      final file = File(savePath);
      if (!await file.exists() || await file.length() == 0) {
        throw DriveServiceException('Fichier vide');
      }
      return DriveDownload(
        file: file,
        fileName: fileNameFromContentDisposition(
          response.headers.value('content-disposition'),
        ),
        contentType: response.headers.value('content-type'),
      );
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) throw DriveDownloadCancelled();
      _logger.e('DriveService downloadToFile failed: $e');
      final status = e.response?.statusCode;
      if (status == 401) {
        throw DriveServiceException(
          'Session expirée. Veuillez vous reconnecter.',
        );
      }
      if (status == 403) {
        throw DriveServiceException('Ce fichier n\'est pas accessible.');
      }
      if (status == 415) {
        throw DriveServiceException(
          'Ce type de document ne peut pas être téléchargé.',
        );
      }
      throw DriveServiceException(
        _networkMessage(e) ?? 'Impossible de télécharger le fichier',
      );
    }
  }
}

/// French wording for failures that never reached the server (Dio's own
/// messages are English and technical).
String? _networkMessage(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionError:
      return 'Connexion impossible. Vérifiez votre réseau.';
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
      return 'Le serveur met trop de temps à répondre. Réessayez.';
    default:
      return null;
  }
}

/// A folder's items, and whether the website could list them all.
class DriveListing {
  const DriveListing({required this.items, this.truncated = false});

  final List<DriveFile> items;

  /// True when the folder holds more than the listing returned.
  final bool truncated;
}

/// A file fetched through the proxy, with what the response said about it.
class DriveDownload {
  const DriveDownload({required this.file, this.fileName, this.contentType});

  /// Where the bytes were written (the caller's [downloadToFile] savePath).
  final File file;

  /// Name from the `Content-Disposition` header, or null without one.
  final String? fileName;

  /// `Content-Type` of the bytes (a Google Doc comes back as a PDF).
  final String? contentType;
}

/// The member (or the screen going away) stopped a download: nothing to
/// tell them.
class DriveDownloadCancelled implements Exception {
  @override
  String toString() => 'Téléchargement annulé';
}

final _extendedFileName = RegExp(
  r'''filename\*\s*=\s*(?:utf-8|iso-8859-1)'[^']*'([^;]+)''',
  caseSensitive: false,
);
final _quotedFileName = RegExp(r'filename\s*=\s*"((?:[^"\\]|\\.)*)"');
final _bareFileName = RegExp(r'filename\s*=\s*([^;\s]+)');

/// The file name a `Content-Disposition` header carries: the RFC 8187
/// `filename*` (UTF-8, accents intact) first, then the plain `filename`.
/// Path separators are dropped so the name can't escape a directory.
String? fileNameFromContentDisposition(String? header) {
  if (header == null || header.isEmpty) return null;

  String? name;
  final extended = _extendedFileName.firstMatch(header);
  if (extended != null) {
    try {
      name = Uri.decodeComponent(extended.group(1)!.trim());
    } on ArgumentError {
      name = null;
    }
  }
  name ??= _quotedFileName
      .firstMatch(header)
      ?.group(1)
      ?.replaceAllMapped(RegExp(r'\\(.)'), (m) => m.group(1)!);
  name ??= _bareFileName.firstMatch(header)?.group(1);
  if (name == null) return null;

  final cleaned = name.replaceAll(RegExp(r'[/\\]'), '_').trim();
  return cleaned.isEmpty ? null : cleaned;
}

class DriveServiceException implements Exception {
  DriveServiceException(this.message);
  final String message;
  @override
  String toString() => message;
}
