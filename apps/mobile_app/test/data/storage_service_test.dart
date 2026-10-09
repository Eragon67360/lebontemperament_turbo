import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/concert.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';
import 'package:lebontemperament/data/services/storage_service.dart';
import 'package:logger/logger.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// The offline copy the services fall back to without network (#361). It
/// moved from Hive to shared preferences in #362: same calls, same results.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  StorageService newStorage() =>
      StorageService(logger: Logger(level: Level.off));

  const concert = Concert(
    id: 'c1',
    place: 'Église Saint-Paul',
    date: '2026-12-13',
    time: '17:00',
    context: Context.orchestreEtChoeur,
    name: 'Stabat Mater',
    isFree: false,
    price: 15,
  );
  const rehearsal = Rehearsal(
    id: 'r1',
    date: '2026-10-11',
    startTime: '10:00',
    groupType: GroupType.choeurComplet,
  );

  test('reads nothing before it is initialized', () {
    final storage = newStorage();
    expect(storage.isInitialized, isFalse);
    expect(storage.getConcerts(), isEmpty);
    expect(storage.getConcert('c1'), isNull);
  });

  test('a saved list comes back whole, in order, across instances', () async {
    final second = concert.copyWith(id: 'c2', name: 'Noël');
    await newStorage().saveConcerts([concert, second]);

    final reader = newStorage();
    await reader.initialize();
    expect(reader.getConcerts(), [concert, second]);
    expect(reader.getConcert('c2'), second);
  });

  test('saving a list replaces the previous one', () async {
    final storage = newStorage();
    await storage.saveRehearsals([rehearsal]);
    final other = rehearsal.copyWith(id: 'r2', groupType: GroupType.femmes);
    await storage.saveRehearsals([other]);
    expect(storage.getRehearsals(), [other]);
  });

  test('one row can be added, updated and deleted', () async {
    final storage = newStorage();
    await storage.saveRehearsals([rehearsal]);
    final moved = rehearsal.copyWith(place: 'Wangen');
    await storage.saveRehearsal(moved);
    await storage.saveRehearsal(rehearsal.copyWith(id: 'r2'));
    expect(storage.getRehearsals().map((r) => r.id), ['r1', 'r2']);
    expect(storage.getRehearsal('r1'), moved);

    await storage.deleteRehearsal('r1');
    expect(storage.getRehearsals().map((r) => r.id), ['r2']);
    expect(storage.getStorageStats()['rehearsals'], 1);
  });

  test('signing out clears every list', () async {
    final storage = newStorage();
    await storage.saveConcerts([concert]);
    await storage.saveRehearsals([rehearsal]);
    await storage.clearAll();
    expect(storage.getConcerts(), isEmpty);
    expect(storage.getRehearsals(), isEmpty);
    expect(storage.getEvents(), isEmpty);
  });
}
