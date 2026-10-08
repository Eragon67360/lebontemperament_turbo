/// What the public part of the app says (#593): the same facts as the
/// website, so a visitor reads one answer wherever they ask.
///
/// The joining facts mirror `apps/website/lib/joining.ts` (owner, #334);
/// change both together.
library;

import '../../../core/constants/ui_constants.dart';

/// The association's HelloAsso campaign, the website's « Faire un don »
/// button. Opened in the browser, never inside the app: both stores require
/// donations to an association to be collected outside the app (Apple
/// 3.2.2, Google Play's payments policy).
const String kHelloAssoUrl =
    'https://www.helloasso.com/associations/le-bon-temperament/formulaires/2';

const String kLegalNoticeUrl = '$kWebsiteBaseUrl/mentions-legales';
const String kContactFormUrl = '$kWebsiteBaseUrl/contact';
const String kJoinPageUrl = '$kWebsiteBaseUrl/rejoindre';

/// One line under the name, on the public home.
const String kPublicTagline =
    'Ensemble vocal et instrumental associatif, fondé en 1987 à Saverne.';

/// The « À propos » presentation, from the website's « Découvrir ».
const List<String> kPublicPresentation = [
  'Le Bon Tempérament est un ensemble vocal et instrumental dirigé par '
      'Simone Duclos depuis sa création en 1987. Basé à Saverne, en Alsace, '
      'il se distingue par le mélange des générations, la diversité des '
      'parcours et l’esprit de convivialité qui l’anime.',
  'Notre répertoire va de la Renaissance à nos jours : œuvres sacrées et '
      'profanes, opéra baroque, pièces populaires et folkloriques.',
  'Chœurs d’adultes, de jeunes et d’enfants, et depuis 2023 un orchestre '
      'symphonique dirigé par Charlotte Lienhard, qui se produit seul ou avec '
      'la chorale.',
];

/// A photo shown in « À propos » (no gallery: three pictures at most).
class PublicPhoto {
  const PublicPhoto({required this.publicId, required this.caption});

  /// The Cloudinary public id the website's « Découvrir » page uses.
  final String publicId;
  final String caption;

  /// The same rendition the website asks for, [width] pixels wide at most.
  String url({int width = 1080}) {
    final id = Uri.encodeFull(publicId).replaceAll(',', '%2C');
    return 'https://res.cloudinary.com/dlt2j3dld/image/upload/'
        'c_limit,w_$width/f_auto/q_auto/v1/$id';
  }
}

const List<PublicPhoto> kPublicPhotos = [
  PublicPhoto(
    publicId: 'Site/découvrir/choeurs/choeur',
    caption: 'Le chœur en concert',
  ),
  PublicPhoto(
    publicId: 'Site/découvrir/orchestre/orchestre',
    caption: 'L’orchestre',
  ),
  PublicPhoto(publicId: 'Site/découvrir/histoire', caption: 'Notre histoire'),
];

/// One rehearsal slot of the adult choir or the orchestra.
class RehearsalSlot {
  const RehearsalSlot({
    required this.group,
    required this.when,
    required this.place,
    required this.rhythm,
  });

  final String group;
  final String when;
  final String place;
  final String rhythm;
}

const List<RehearsalSlot> kRehearsalSlots = [
  RehearsalSlot(
    group: 'Pupitres de femmes',
    when: 'Mercredi, 20 h 30 – 22 h',
    place: 'à Nordheim',
    rhythm: 'toutes les deux semaines',
  ),
  RehearsalSlot(
    group: 'Pupitres d’hommes',
    when: 'Samedi, 10 h – 11 h 30',
    place: 'à Wangen',
    rhythm: 'toutes les deux semaines',
  ),
  RehearsalSlot(
    group: 'Chœur complet',
    when: 'Dimanche, 9 h 30 – 16 h',
    place: 'à Wangen',
    rhythm: 'environ une fois par mois',
  ),
  RehearsalSlot(
    group: 'Orchestre',
    when: 'Jeudi, 19 h 45 – 21 h 45',
    place: 'au Conservatoire de Strasbourg',
    rhythm: 'selon le calendrier de l’orchestre',
  ),
];

/// A short answer on the « Nous rejoindre » screen.
class JoiningFact {
  const JoiningFact({required this.title, required this.text});
  final String title;
  final String text;
}

const List<JoiningFact> kJoiningFacts = [
  JoiningFact(
    title: 'Sans audition',
    text:
        'Vous venez à une répétition d’essai, puis c’est vous qui décidez '
        'si vous restez.',
  ),
  JoiningFact(
    title: 'Pas besoin de lire la musique',
    text: 'L’important est l’envie de chanter ensemble.',
  ),
  JoiningFact(
    title: 'Tous les âges',
    text:
        'Chœur des tout-jeunes, chœur de jeunes, chœur d’adultes et '
        'orchestre : les générations se mélangent.',
  ),
  JoiningFact(
    title: 'Environ 40 € par an',
    text:
        'Pour un adulte qui travaille, partitions comprises. Une commission '
        'de solidarité aide les membres qui en ont besoin.',
  ),
  JoiningFact(
    title: 'À tout moment de l’année',
    text: 'Il n’y a pas de date limite d’inscription.',
  ),
];
