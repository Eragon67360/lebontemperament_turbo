import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/drive_file.dart';
import '../../core/config/app_config.dart';

/// Fetches Drive folder contents via the website API.
class DriveService {
  DriveService({Logger? logger}) : _logger = logger ?? Logger();

  final Logger _logger;
  final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
  ));

  /// Fetches files and folders for the given folder ID.
  Future<List<DriveFile>> getFolderContents(String folderId) async {
    final url =
        '${AppConfig.siteUrl}/api/drive/files?folderID=${Uri.encodeComponent(folderId)}';

    try {
      final response = await _dio.get<List<dynamic>>(url);

      if (response.data == null) {
        throw DriveServiceException('Réponse vide');
      }

      final list = response.data!;
      return list
          .map((e) => DriveFile.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      _logger.e('DriveService getFolderContents failed: $e');
      if (e.response?.statusCode != null) {
        final data = e.response?.data;
        final msg = data is Map && data['error'] != null
            ? data['error'].toString()
            : 'Erreur ${e.response?.statusCode}';
        throw DriveServiceException(msg);
      }
      throw DriveServiceException(
        e.message ?? 'Impossible de charger les fichiers',
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
