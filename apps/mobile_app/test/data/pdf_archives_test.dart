import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/constants/pdf_archives.dart';

void main() {
  test('every gazette carries a real date', () {
    for (final e in kGazettesPdfs) {
      expect(e.date, isNot(contains('0001')), reason: e.name);
      expect(RegExp(r'^\d{2}-\d{2}-\d{4}$').hasMatch(e.date), isTrue);
    }
  });

  test(
    'sortedByDateDesc puts the newest first, a supplement after its gazette',
    () {
      const unordered = [
        PdfArchiveEntry(name: 'b.pdf', date: '05-02-2023'),
        PdfArchiveEntry(name: 'a.pdf', date: '21-06-2025'),
        PdfArchiveEntry(name: 'b-supp.pdf', date: '05-02-2023', title: 'Supp.'),
        PdfArchiveEntry(name: 'c.pdf', date: '14-10-2018'),
      ];
      expect(sortedByDateDesc(unordered).map((e) => e.name), [
        'a.pdf',
        'b.pdf',
        'b-supp.pdf',
        'c.pdf',
      ]);
    },
  );

  test('years and issue numbers sort too', () {
    expect(
      sortedByDateDesc(kAgPdfs).map((e) => e.date).toList(),
      kAgPdfs.map((e) => e.date).toList(),
    );
    expect(sortedByDateDesc(kPmPdfs).first.date, '2');
  });
}
