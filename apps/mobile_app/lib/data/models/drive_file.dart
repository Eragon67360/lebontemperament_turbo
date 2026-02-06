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
