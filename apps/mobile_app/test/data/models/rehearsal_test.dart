import 'package:flutter_test/flutter_test.dart';
import 'package:lebontemperament/data/models/rehearsal.dart';

Rehearsal _r({String? place, String? address, String? room}) => Rehearsal(
  id: 'rehearsal-test',
  place: place,
  address: address,
  room: room,
  groupType: GroupType.orchestre,
);

void main() {
  test('address and room are read from the row, and old rows still parse', () {
    final withBoth = Rehearsal.fromJson({
      'id': 'a',
      'place': 'Conservatoire de Strasbourg',
      'address': '1 place Dauphine, 67000 Strasbourg',
      'room': 'Salle 12',
      'group_type': 'Orchestre',
    });
    expect(withBoth.address, '1 place Dauphine, 67000 Strasbourg');
    expect(withBoth.room, 'Salle 12');
    expect(withBoth.toJson()['room'], 'Salle 12');

    // A row from before the columns existed.
    final old = Rehearsal.fromJson({
      'id': 'b',
      'place': 'Nordheim',
      'group_type': 'Femmes',
    });
    expect(old.address, isNull);
    expect(old.room, isNull);
  });

  test('« Itinéraire » searches the address, else the place, never the room', () {
    expect(
      _r(
        place: 'Conservatoire de Strasbourg',
        address: ' 1 place Dauphine, 67000 Strasbourg ',
        room: 'Salle 12',
      ).directionsQuery,
      '1 place Dauphine, 67000 Strasbourg',
    );
    expect(
      _r(place: 'Nordheim', room: 'Salle 12').directionsQuery,
      'Nordheim',
    );
    expect(_r(place: 'Nordheim', address: '  ').directionsQuery, 'Nordheim');
    expect(_r(room: 'Salle 12').directionsQuery, isNull);
    expect(_r().directionsQuery, isNull);
  });

  test('the room is shown next to the place', () {
    expect(
      _r(place: 'Conservatoire de Strasbourg', room: 'Salle 12').placeWithRoom,
      'Conservatoire de Strasbourg · Salle 12',
    );
    expect(_r(place: 'Nordheim').placeWithRoom, 'Nordheim');
    expect(_r(place: 'Nordheim', room: ' ').placeWithRoom, 'Nordheim');
    expect(_r(room: 'Salle 12').placeWithRoom, 'Salle 12');
    expect(_r().placeWithRoom, isNull);
  });
}
