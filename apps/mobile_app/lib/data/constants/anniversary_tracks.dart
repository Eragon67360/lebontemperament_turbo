/// Track metadata for the Concert Anniversaire (20 ans du BT) album.
class AnniversaryTrack {
  const AnniversaryTrack({
    required this.name,
    required this.duration,
  });

  final String name;
  final String duration;

  String get displayName {
    return name
        .replaceAll(RegExp(r'^\d+ - Le Bon Tempérament - '), '')
        .replaceAll(RegExp(r'\.mp3$'), '');
  }
}

/// Base URL for the album on the website.
const String _kAnniversaryAlbumBaseUrl =
    'https://www.lebontemperament.com/music/BT%20-%20Album';

/// Builds the stream URL for a track.
String anniversaryTrackUrl(String fileName) {
  return '$_kAnniversaryAlbumBaseUrl/${Uri.encodeComponent(fileName)}';
}

/// Album cover image URL.
const String kAnniversaryAlbumCoverUrl =
    'https://www.lebontemperament.com/music/BT%20-%20Album/bt_20ans_pochette.jpg';

/// Tracks from the 20 ans du BT live album.
const List<AnniversaryTrack> kAnniversaryTracks = [
  AnniversaryTrack(name: "01 - Le Bon Tempérament - 01. A l'enterrement d'une feuille morte. J. Prévert.mp3", duration: "02:48"),
  AnniversaryTrack(name: "02 - Le Bon Tempérament - 02. O fly not love. Th. Morley.mp3", duration: "02:20"),
  AnniversaryTrack(name: "03 - Le Bon Tempérament - 03. Rest sweet nymph. F. Pilkington.mp3", duration: "02:52"),
  AnniversaryTrack(name: "04 - Le Bon Tempérament - 04. Quand l'ennui fâcheux vous prend.G. Costeley.mp3", duration: "01:05"),
  AnniversaryTrack(name: "05 - Le Bon Tempérament - 05. La part à Dieu. Populaire français.mp3", duration: "01:53"),
  AnniversaryTrack(name: "06 - Le Bon Tempérament - 06. Chien perdu. F. Poulenc.mp3", duration: "02:38"),
  AnniversaryTrack(name: "07 - Le Bon Tempérament - 07. Le Hérisson. F. Poulenc.mp3", duration: "00:46"),
  AnniversaryTrack(name: "08 - Le Bon Tempérament - 08.Trois beaux oiseaux du Paradis.M. Ravel-.mp3", duration: "03:22"),
  AnniversaryTrack(name: "09 - Le Bon Tempérament - 09.Kougouroucoq. L. Daunais-.mp3", duration: "01:10"),
  AnniversaryTrack(name: "10 - Le Bon Tempérament - 10. Chanson jazz. Jérémie Husser.mp3", duration: "03:33"),
  AnniversaryTrack(name: "11 - Le Bon Tempérament - 11.Vous connaissez le chemin de la plage. J. Naty Boyer.mp3", duration: "01:50"),
  AnniversaryTrack(name: "12 - Le Bon Tempérament - 12. Billy Magee Magar. Ballade anglaise.mp3", duration: "03:02"),
  AnniversaryTrack(name: "13 - Le Bon Tempérament - 13. Le joli mois de Mai.R. Schumann.mp3", duration: "01:25"),
  AnniversaryTrack(name: "14 - Le Bon Tempérament - 14. Zigeuner Leben.R. Schumann.mp3", duration: "03:39"),
  AnniversaryTrack(name: "15 - Le Bon Tempérament - 15.Extraits -Christ lag in todes Banden. JS Bach.mp3", duration: "04:21"),
  AnniversaryTrack(name: "16 - Le Bon Tempérament - 16.Easy dances. Quintett à vent.mp3", duration: "01:48"),
  AnniversaryTrack(name: "17 - Le Bon Tempérament - 17. Concerto en fa. Scarlatti.mp3", duration: "08:26"),
  AnniversaryTrack(name: "18 - Le Bon Tempérament - 18.Papageno, Papgena. WA Mozart.mp3", duration: "03:30"),
  AnniversaryTrack(name: "19 - Le Bon Tempérament - 19. Hamisha Asar.-.mp3", duration: "02:46"),
  AnniversaryTrack(name: "20 - Le Bon Tempérament - 20.Purim Hayoum-.mp3", duration: "01:08"),
  AnniversaryTrack(name: "21 - Le Bon Tempérament - 21. Yeddid Nefesh.mp3", duration: "02:45"),
  AnniversaryTrack(name: "22 - Le Bon Tempérament - 22. Le tendre et dangereux visage de l'amour. J. Prévert.mp3", duration: "01:49"),
  AnniversaryTrack(name: "23 - Le Bon Tempérament - 23. Les feuilles mortes. J. Prévert.mp3", duration: "09:07"),
  AnniversaryTrack(name: "24 - Le Bon Tempérament - 24. L'opéra de la Lune. J. Prévert.mp3", duration: "02:09"),
  AnniversaryTrack(name: "25 - Le Bon Tempérament - 25. Barbara. Texte. J. Prévert.mp3", duration: "00:24"),
  AnniversaryTrack(name: "26 - Le Bon Tempérament - 26. Barbara. Chant. J. Prévert.mp3", duration: "04:03"),
  AnniversaryTrack(name: "27 - Le Bon Tempérament - 27. Le bonhomme de neige. J.Prévert.mp3", duration: "01:36"),
];
