/// Parses database rows one by one, skipping (and reporting) the rows that
/// don't fit the model, so one unexpected value (a new concert context, a
/// missing column) hides that row instead of failing the whole list and
/// sending the member to the offline cache.
List<T> parseRows<T>(
  Iterable<Map<String, dynamic>> rows,
  T Function(Map<String, dynamic> json) fromJson, {
  void Function(Object error, Map<String, dynamic> row)? onSkip,
}) {
  final parsed = <T>[];
  for (final row in rows) {
    try {
      parsed.add(fromJson(row));
    } catch (e) {
      onSkip?.call(e, row);
    }
  }
  return parsed;
}
