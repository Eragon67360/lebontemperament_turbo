/// A list served by a data service, with where it came from.
///
/// The services keep an offline copy of every list they fetch, and fall back to it
/// when the network call fails. Before #361 that fallback was invisible: a
/// member in a tunnel saw last week's rehearsals as if they were fresh, and a
/// member with an empty cache saw "no rehearsals" instead of an error. The
/// screens now get the provenance with the rows and say so.
class ListResult<T> {
  final List<T> items;

  /// True when the server could not be reached and [items] are the cached
  /// rows (possibly none).
  final bool fromCache;

  /// The server error when [fromCache]; null for a fresh result.
  final Object? error;

  const ListResult.fresh(this.items) : fromCache = false, error = null;

  const ListResult.cached(this.items, {required this.error}) : fromCache = true;

  /// The server failed and nothing is cached: the screen shows an error, not
  /// an empty list.
  bool get isUnavailable => fromCache && items.isEmpty;

  /// Same provenance, other rows (filtering, sorting).
  ListResult<T> map(List<T> Function(List<T> items) transform) {
    final next = transform(items);
    return fromCache
        ? ListResult<T>.cached(next, error: error)
        : ListResult<T>.fresh(next);
  }
}
