/// Represents a file or folder from the Drive API.
class DriveFile {
  const DriveFile({
    this.id,
    required this.name,
    required this.type,
    required this.mimeType,
  });

  final String? id;
  final String name;
  final String type; // 'file' | 'folder'
  final String mimeType;

  bool get isFolder => type == 'folder';

  factory DriveFile.fromJson(Map<String, dynamic> json) {
    return DriveFile(
      id: json['id'] as String?,
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'file',
      mimeType: json['mimeType'] as String? ?? '',
    );
  }
}

/// Google types the website exports as PDF (packages/domain driveDownload.ts),
/// so the app can open them in its PDF viewer.
const kPdfExportableMimeTypes = {
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.drawing',
};

/// Orders Drive names the way a member reads them: case and accents ignored
/// (« Été » with the E's, « ave » before « Zarzuela ») and numbers by value
/// (« 2 - … » before « 10 - … »).
int compareDriveNames(DriveFile a, DriveFile b) {
  final x = _sortKey(a.name), y = _sortKey(b.name);
  final digits = RegExp(r'\d+|\D+');
  final xs = digits.allMatches(x).map((m) => m[0]!).toList();
  final ys = digits.allMatches(y).map((m) => m[0]!).toList();
  for (var i = 0; i < xs.length && i < ys.length; i++) {
    final nx = int.tryParse(xs[i]), ny = int.tryParse(ys[i]);
    final c = nx != null && ny != null
        ? nx.compareTo(ny)
        : xs[i].compareTo(ys[i]);
    if (c != 0) return c;
  }
  final c = xs.length.compareTo(ys.length);
  return c != 0 ? c : a.name.compareTo(b.name);
}

String _sortKey(String name) {
  const from = 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ';
  const to = 'aaaaaaceeeeiiiinooooouuuuyyoa';
  final lower = name.toLowerCase();
  final out = StringBuffer();
  for (final ch in lower.split('')) {
    final i = from.indexOf(ch);
    out.write(i >= 0 ? to[i] : ch);
  }
  return out.toString();
}
