import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/config/app_config.dart';
import '../../core/constants/ui_constants.dart';
import '../constants/pdf_archives.dart';

/// One document of « Documents de l'association » (managed in the admin).
class SiteDocument {
  const SiteDocument({required this.title, required this.url});

  final String title;

  /// Absolute address of the file on the website.
  final String url;
}

/// A collection of documents (AG, Gazettes, Pêle-Mêle…), newest first.
class SiteDocumentCollection {
  const SiteDocumentCollection({
    required this.slug,
    required this.label,
    required this.description,
    required this.documents,
  });

  final String slug;
  final String label;
  final String? description;
  final List<SiteDocument> documents;
}

/// Returns a valid access token, refreshing an expired session first; null
/// when signed out.
typedef FreshAccessToken = Future<String?> Function();

Future<String?> _supabaseFreshAccessToken() async {
  final auth = Supabase.instance.client.auth;
  var session = auth.currentSession;
  if (session != null && session.isExpired) {
    try {
      session = (await auth.refreshSession()).session;
    } catch (_) {
      return null;
    }
  }
  return session?.accessToken;
}

/// Reads the association documents from the website's `GET /api/documents`
/// (`apps/website/app/api/documents/route.ts`), as the member: with the
/// access token it lists members-only documents too. Without a token the
/// website would answer the public ones only, so there is no call then.
class SiteDocumentsService {
  SiteDocumentsService({
    Dio? dio,
    FreshAccessToken? accessToken,
    Logger? logger,
    String? siteUrl,
  }) : _dio =
           dio ??
           Dio(
             BaseOptions(
               connectTimeout: const Duration(seconds: 10),
               receiveTimeout: const Duration(seconds: 10),
             ),
           ),
       _accessToken = accessToken ?? _supabaseFreshAccessToken,
       _logger = logger ?? Logger(),
       _siteUrl = siteUrl ?? AppConfig.siteUrl;

  final Dio _dio;
  final FreshAccessToken _accessToken;
  final Logger _logger;
  final String _siteUrl;

  /// The collections the member may read, or the lists built into the app
  /// ([legacyDocumentCollections]) when the website can't be reached
  /// (offline, signed out, an unexpected answer).
  Future<List<SiteDocumentCollection>> getCollections() async {
    try {
      final token = await _accessToken();
      if (token == null || token.isEmpty) return legacyDocumentCollections();
      final response = await _dio.get<dynamic>(
        '$_siteUrl/api/documents',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      final collections = parseDocumentCollections(response.data, _siteUrl);
      return collections ?? legacyDocumentCollections();
    } catch (e) {
      _logger.w('Documents unavailable, showing the built-in lists: $e');
      return legacyDocumentCollections();
    }
  }
}

/// Parses `{ collections: [{ slug, label, description, documents: [{ title,
/// href }] }] }`; null when [data] isn't that shape. Links that don't stay
/// on the website are dropped.
List<SiteDocumentCollection>? parseDocumentCollections(
  Object? data,
  String siteUrl,
) {
  if (data is! Map || data['collections'] is! List) return null;
  final collections = <SiteDocumentCollection>[];
  for (final raw in data['collections'] as List) {
    if (raw is! Map) continue;
    final slug = raw['slug'];
    final label = raw['label'];
    final docs = raw['documents'];
    if (slug is! String || label is! String || docs is! List) continue;
    final documents = [
      for (final d in docs)
        if (d is Map &&
            d['title'] is String &&
            d['href'] is String &&
            (d['href'] as String).startsWith('/') &&
            !(d['href'] as String).startsWith('//'))
          SiteDocument(
            title: d['title'] as String,
            url: '$siteUrl${d['href']}',
          ),
    ];
    if (documents.isEmpty) continue;
    final description = raw['description'];
    collections.add(
      SiteDocumentCollection(
        slug: slug,
        label: label,
        description: description is String ? description : null,
        documents: documents,
      ),
    );
  }
  return collections;
}

/// The three lists the app showed before the admin managed them, from
/// [kAgPdfs], [kGazettesPdfs] and [kPmPdfs], at the same addresses.
List<SiteDocumentCollection> legacyDocumentCollections() {
  List<SiteDocument> documents(
    List<PdfArchiveEntry> entries,
    String folder,
    String Function(PdfArchiveEntry) title,
  ) => [
    for (final e in sortedByDateDesc(entries))
      SiteDocument(
        title: title(e),
        url: '$kWebsiteBaseUrl/pdf/$folder/${Uri.encodeComponent(e.name)}',
      ),
  ];

  return [
    SiteDocumentCollection(
      slug: 'ag',
      label: 'Comptes-rendus AG',
      description: 'Archives des assemblées générales',
      documents: documents(kAgPdfs, 'AG', (e) => 'AG ${_legacyDate(e.date)}'),
    ),
    SiteDocumentCollection(
      slug: 'gazettes',
      label: 'Gazettes',
      description: 'Archives des gazettes',
      documents: documents(
        kGazettesPdfs,
        'Gazettes',
        (e) => e.title ?? 'Gazette ${_legacyDate(e.date)}',
      ),
    ),
    SiteDocumentCollection(
      slug: 'pele-mele',
      label: 'Pêle-Mêle',
      description: 'Archives diverses',
      documents: documents(kPmPdfs, 'PM', (e) => 'N°${e.date}'),
    ),
  ];
}

/// `dd-MM-yyyy` as `dd/MM/yyyy`; a year or an issue number as is.
String _legacyDate(String date) {
  final parts = date.split('-');
  return parts.length == 3 ? parts.join('/') : date;
}
