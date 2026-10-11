/// A file attached to an event in the admin (« Bulletin de réservation »,
/// programme…), from `public.event_documents`. The file itself is in the
/// public bucket `site-media`; the rules mirror
/// `packages/domain/src/utils/eventDocuments.ts`, which the website uses.
class EventDocument {
  const EventDocument({
    required this.id,
    required this.eventId,
    required this.label,
    required this.fileName,
    required this.storageKey,
    required this.mimeType,
    this.sizeBytes,
    this.sortOrder = 0,
    this.createdAt = '',
  });

  final String id;
  final String eventId;

  /// What members read, e.g. « Bulletin de réservation ».
  final String label;

  /// The clean name it downloads under, e.g. `Bulletin-de-reservation.pdf`.
  final String fileName;

  /// Object key in `site-media`, e.g. `events/<event id>/<uuid>-Bulletin.pdf`.
  final String storageKey;
  final String mimeType;
  final int? sizeBytes;
  final int sortOrder;
  final String createdAt;

  /// Parses a database row (or a cached one: [toJson] writes the same keys).
  /// Throws on a row missing a required column, so the caller can skip it.
  factory EventDocument.fromJson(Map<String, dynamic> json) {
    String text(String key) {
      final value = json[key];
      if (value is String && value.isNotEmpty) return value;
      throw FormatException('event_documents.$key is missing');
    }

    final size = json['size_bytes'];
    final order = json['sort_order'];
    final created = json['created_at'];
    return EventDocument(
      id: text('id'),
      eventId: text('event_id'),
      label: text('label'),
      fileName: text('file_name'),
      storageKey: text('storage_key'),
      mimeType: text('mime_type'),
      sizeBytes: size is num
          ? size.toInt()
          : size is String
          ? int.tryParse(size)
          : null,
      sortOrder: order is num ? order.toInt() : 0,
      createdAt: created is String ? created : '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'event_id': eventId,
    'label': label,
    'file_name': fileName,
    'storage_key': storageKey,
    'mime_type': mimeType,
    'size_bytes': sizeBytes,
    'sort_order': sortOrder,
    'created_at': createdAt,
  };

  EventDocumentKind get kind => eventDocumentKind(mimeType);

  /// « 120 ko », « 1,2 Mo »; null when the size is unknown.
  String? get sizeLabel => fileSizeLabel(sizeBytes);

  /// « PDF · 120 ko », or « PDF » when the size is unknown.
  String get details {
    final size = sizeLabel;
    return size == null ? kind.label : '${kind.label} · $size';
  }

  /// The address to open, from the file's plain public URL in the bucket: a
  /// PDF opens in the browser; Word and Excel files download under
  /// [fileName].
  String urlFrom(String publicUrl) {
    if (kind == EventDocumentKind.pdf) return publicUrl;
    final separator = publicUrl.contains('?') ? '&' : '?';
    return '$publicUrl${separator}download=${Uri.encodeComponent(fileName)}';
  }

  @override
  bool operator ==(Object other) =>
      other is EventDocument &&
      other.id == id &&
      other.eventId == eventId &&
      other.label == label &&
      other.fileName == fileName &&
      other.storageKey == storageKey &&
      other.mimeType == mimeType &&
      other.sizeBytes == sizeBytes &&
      other.sortOrder == sortOrder &&
      other.createdAt == createdAt;

  @override
  int get hashCode => Object.hash(
    id,
    eventId,
    label,
    fileName,
    storageKey,
    mimeType,
    sizeBytes,
    sortOrder,
    createdAt,
  );
}

enum EventDocumentKind {
  pdf('PDF'),
  word('Word'),
  excel('Excel');

  const EventDocumentKind(this.label);

  /// « PDF », « Word » or « Excel ».
  final String label;
}

const _wordTypes = {
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const _excelTypes = {
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/// The kind of a file from its MIME type; anything else counts as a PDF, as
/// on the website.
EventDocumentKind eventDocumentKind(String mimeType) {
  final type = mimeType.split(';').first.trim().toLowerCase();
  if (_wordTypes.contains(type)) return EventDocumentKind.word;
  if (_excelTypes.contains(type)) return EventDocumentKind.excel;
  return EventDocumentKind.pdf;
}

/// « 850 ko » under 1 Mo (at least 1 ko), else « 1,2 Mo »; null for an
/// unknown size. Same labels as the website and the admin.
String? fileSizeLabel(int? bytes) {
  if (bytes == null || bytes < 0) return null;
  const mb = 1024 * 1024;
  if (bytes < mb) {
    final ko = (bytes / 1024).round();
    return '${ko < 1 ? 1 : ko} ko';
  }
  return '${(bytes / mb).toStringAsFixed(1).replaceAll('.', ',')} Mo';
}

/// In the order the admin set, then oldest first.
List<EventDocument> sortEventDocuments(Iterable<EventDocument> documents) {
  return documents.toList()..sort((a, b) {
    final byOrder = a.sortOrder.compareTo(b.sortOrder);
    return byOrder != 0 ? byOrder : a.createdAt.compareTo(b.createdAt);
  });
}

/// Parses the `documents` of a cached event, skipping entries that don't
/// fit, so one bad entry never costs the whole offline copy.
List<EventDocument> eventDocumentsFromJson(Object? json) {
  if (json is! List) return const [];
  final documents = <EventDocument>[];
  for (final row in json) {
    if (row is! Map) continue;
    try {
      documents.add(EventDocument.fromJson(row.cast<String, dynamic>()));
    } catch (_) {}
  }
  return documents;
}

List<Map<String, dynamic>> eventDocumentsToJson(
  List<EventDocument> documents,
) => [for (final d in documents) d.toJson()];
