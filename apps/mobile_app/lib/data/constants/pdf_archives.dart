/// PDF archive entries for AG, Gazettes, and Pêle-Mêle.
/// Sourced from website public/json/ - PDFs are served at kWebsiteBaseUrl/pdf/{context}/{name}
class PdfArchiveEntry {
  const PdfArchiveEntry({required this.name, required this.date, this.title});

  final String name;

  /// `dd-MM-yyyy`, a year, or an issue number (Pêle-Mêle).
  final String date;

  /// A label of its own for an entry the date alone doesn't describe
  /// (a supplement, a special issue); the screen derives one from [date]
  /// otherwise.
  final String? title;
}

/// Newest first; [date] is compared on its `yyyy-MM-dd` form, so years and
/// issue numbers sort too. The source order breaks ties (a gazette stays
/// ahead of its supplement).
List<PdfArchiveEntry> sortedByDateDesc(List<PdfArchiveEntry> entries) {
  final indexed = entries.indexed.toList();
  indexed.sort((a, b) {
    final byDate = _sortKey(b.$2.date).compareTo(_sortKey(a.$2.date));
    return byDate != 0 ? byDate : a.$1.compareTo(b.$1);
  });
  return [for (final (_, e) in indexed) e];
}

String _sortKey(String date) {
  final parts = date.split('-');
  if (parts.length == 3) return '${parts[2]}-${parts[1]}-${parts[0]}';
  return date.padLeft(4, '0');
}

const List<PdfArchiveEntry> kAgPdfs = [
  PdfArchiveEntry(
    name: 'Compte-Rendu Assemblée Générale Ordinaire 2024.pdf',
    date: '2024',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu Assemblée Générale Ordinaire 2022.pdf',
    date: '2022',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu Assemblée Générale Ordinaire 2021.pdf',
    date: '2021',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu Assemblée Générale Ordinaire 2020.pdf',
    date: '2020',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu_Assemblée_Générale_Ordinaire_2019.pdf',
    date: '2019',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu_Assemblée_Générale_Ordinaire_2018.pdf',
    date: '2018',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu_Assemblée_Générale_Ordinaire_2017.pdf',
    date: '2017',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu_Assemblée_Générale_Ordinaire_2016.pdf',
    date: '2016',
  ),
  PdfArchiveEntry(
    name: 'Compte-Rendu_Assemblée_Générale_Ordinaire_2015.pdf',
    date: '2015',
  ),
];

const List<PdfArchiveEntry> kGazettesPdfs = [
  PdfArchiveEntry(name: 'gazette_2025_06_21.pdf', date: '21-06-2025'),
  // « Hors série : dimanche 18 août 2024 » (the PDF's own heading).
  PdfArchiveEntry(
    name: 'gazette_2024_08.pdf',
    date: '18-08-2024',
    title: 'Gazette hors-série 18/08/2024',
  ),
  PdfArchiveEntry(name: 'gazette_2023_02_05.pdf', date: '05-02-2023'),
  // Supplement to the 05/02/2023 gazette (same file name, « -supp »).
  PdfArchiveEntry(
    name: 'gazette_2023_02_05-supp.pdf',
    date: '05-02-2023',
    title: 'Supplément gazette 05/02/2023',
  ),
  PdfArchiveEntry(name: 'gazette19_06_30.pdf', date: '30-06-2019'),
  PdfArchiveEntry(name: 'gazette19_06_14.pdf', date: '14-06-2019'),
  PdfArchiveEntry(name: 'gazette19_05_26.pdf', date: '26-05-2019'),
  PdfArchiveEntry(name: 'gazette19_04_07.pdf', date: '07-04-2019'),
  PdfArchiveEntry(name: 'gazette19_03_16.pdf', date: '16-03-2019'),
  PdfArchiveEntry(name: 'gazette19_02_03.pdf', date: '03-02-2019'),
  PdfArchiveEntry(name: 'gazette19_01_13.pdf', date: '13-01-2019'),
  PdfArchiveEntry(name: 'gazette18_12_02.pdf', date: '02-12-2018'),
  PdfArchiveEntry(name: 'gazette18_11_04.pdf', date: '04-11-2018'),
  PdfArchiveEntry(name: 'gazette18_10_14.pdf', date: '14-10-2018'),
];

const List<PdfArchiveEntry> kPmPdfs = [
  PdfArchiveEntry(name: 'pm_2.pdf', date: '2'),
  PdfArchiveEntry(name: 'pm_1.pdf', date: '1'),
];
