/// CA (Conseil d'Administration) minute from the cas table.
class CaMinute {
  const CaMinute({
    required this.id,
    required this.title,
    required this.dateFrom,
    this.fileUrl,
  });

  final String id;
  final String title;
  final String dateFrom;
  final String? fileUrl;

  factory CaMinute.fromJson(Map<String, dynamic> json) {
    return CaMinute(
      id: json['id'] as String,
      title: (json['title'] ?? '').toString(),
      dateFrom: (json['date_from'] ?? '').toString(),
      fileUrl: json['file_url']?.toString(),
    );
  }
}
