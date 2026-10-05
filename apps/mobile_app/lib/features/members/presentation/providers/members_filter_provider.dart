import 'package:flutter_riverpod/legacy.dart';

import '../../../../data/models/member.dart';

/// The search field and the voice filter of the members screen. They die
/// with the screen, so coming back never shows an empty field over a
/// filtered list.
final membersSearchProvider = StateProvider.autoDispose<String>((ref) => '');
final membersVoiceFilterProvider = StateProvider.autoDispose<String>(
  (ref) => '',
);

const _accents = {
  'à': 'a', 'á': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a', 'æ': 'ae', //
  'ç': 'c', 'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e', 'ì': 'i', 'í': 'i', //
  'î': 'i', 'ï': 'i', 'ñ': 'n', 'ò': 'o', 'ó': 'o', 'ô': 'o', 'ö': 'o', //
  'õ': 'o', 'ø': 'o', 'œ': 'oe', 'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u', //
  'ý': 'y', 'ÿ': 'y', 'ß': 'ss', '’': '\'',
};

/// Lower case without accents, so « helene » finds « Hélène » and the list
/// sorts « Émile » with the E's.
String foldForSearch(String text) {
  final lower = text.toLowerCase().trim();
  final out = StringBuffer();
  for (final rune in lower.runes) {
    final ch = String.fromCharCode(rune);
    out.write(_accents[ch] ?? ch);
  }
  return out.toString();
}

/// The members matching [searchTerm] (name, e-mail, voice, phones, address,
/// accents ignored) and [selectedVoice], sorted by folded name.
List<Member> filterMembers(
  List<Member> members,
  String searchTerm,
  String selectedVoice,
) {
  final term = foldForSearch(searchTerm);
  final voice = foldForSearch(selectedVoice);
  final filtered = members.where((m) {
    final matchesSearch =
        term.isEmpty ||
        foldForSearch(m.displayName).contains(term) ||
        foldForSearch(m.email).contains(term) ||
        foldForSearch(m.voice ?? '').contains(term) ||
        (m.mobilePhone ?? '').contains(searchTerm.trim()) ||
        (m.homePhone ?? '').contains(searchTerm.trim()) ||
        foldForSearch(m.address ?? '').contains(term);

    final matchesVoice =
        voice.isEmpty || foldForSearch(m.voice ?? '').contains(voice);

    return matchesSearch && matchesVoice;
  }).toList();
  filtered.sort(
    (a, b) =>
        foldForSearch(a.displayName).compareTo(foldForSearch(b.displayName)),
  );
  return filtered;
}
