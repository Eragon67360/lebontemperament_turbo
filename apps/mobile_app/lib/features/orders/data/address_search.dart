import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logger/logger.dart';

// Address suggestions for the buyers of « Commandes », from the national
// address base (BAN) through IGN's Géoplateforme geocoder: free, no key.
// Picking one gives « 31a Rue des Vignes 67520 Wangen », the form the
// delivery round's map finds. Same rules as the admin's
// packages/domain/src/utils/addressSearch.ts.

const kAddressSearchUrl = 'https://data.geopf.fr/geocodage/search';
const kAddressQueryMin = 3;
const kAddressQueryMax = 200;
const kAddressSuggestionsMax = 5;

class AddressSuggestion {
  const AddressSuggestion({required this.label, this.context});

  /// « 31a Rue des Vignes 67520 Wangen »: what goes in the field.
  final String label;

  /// « 67, Bas-Rhin, Grand Est »: helps tell two Wangen apart.
  final String? context;

  @override
  bool operator ==(Object other) =>
      other is AddressSuggestion &&
      other.label == label &&
      other.context == context;

  @override
  int get hashCode => Object.hash(label, context);
}

/// The query as sent, or null when it is too short or too long to search.
String? addressQuery(String input) {
  final q = input.replaceAll(RegExp(r'\s+'), ' ').trim();
  if (q.length < kAddressQueryMin || q.length > kAddressQueryMax) return null;
  // The service wants a letter or a digit first.
  if (!RegExp(r'^[\p{L}\p{N}]', unicode: true).hasMatch(q)) return null;
  return q;
}

/// The suggestions in a geocoder answer (GeoJSON), unknown shapes skipped.
List<AddressSuggestion> parseAddressSuggestions(Object? json) {
  final features = json is Map ? json['features'] : null;
  if (features is! List) return const [];
  final seen = <String>{};
  final out = <AddressSuggestion>[];
  for (final feature in features) {
    final p = feature is Map ? feature['properties'] : null;
    final label = p is Map && p['label'] is String
        ? (p['label'] as String).trim()
        : '';
    if (label.isEmpty || !seen.add(label)) continue;
    final context = p is Map && p['context'] is String
        ? (p['context'] as String).trim()
        : '';
    out.add(
      AddressSuggestion(
        label: label,
        context: context.isEmpty ? null : context,
      ),
    );
    if (out.length == kAddressSuggestionsMax) break;
  }
  return out;
}

class AddressSearchService {
  AddressSearchService({Dio? dio, Logger? logger})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              connectTimeout: const Duration(seconds: 4),
              receiveTimeout: const Duration(seconds: 4),
            ),
          ),
      _logger = logger ?? Logger();

  final Dio _dio;
  final Logger _logger;

  /// Suggestions for what was typed; none when it is too short or the
  /// geocoder can't be reached (the field then stays plain text).
  Future<List<AddressSuggestion>> search(
    String input, {
    CancelToken? cancelToken,
  }) async {
    final q = addressQuery(input);
    if (q == null) return const [];
    try {
      final response = await _dio.get<dynamic>(
        kAddressSearchUrl,
        queryParameters: {
          'q': q,
          'index': 'address',
          'autocomplete': '1',
          'limit': '$kAddressSuggestionsMax',
        },
        cancelToken: cancelToken,
      );
      return parseAddressSuggestions(response.data);
    } on DioException catch (e) {
      // Never log the query: it is a buyer's address.
      if (!CancelToken.isCancel(e)) {
        _logger.w('Address search failed: ${e.type}');
      }
      return const [];
    }
  }
}

final addressSearchServiceProvider = Provider<AddressSearchService>(
  (ref) => AddressSearchService(),
);
