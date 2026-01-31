import 'package:hive/hive.dart';
import 'rehearsal.dart';

class GroupTypeAdapter extends TypeAdapter<GroupType> {
  @override
  final int typeId = 11; // Unique type ID

  @override
  GroupType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return GroupType.orchestre;
      case 1:
        return GroupType.hommes;
      case 2:
        return GroupType.femmes;
      case 3:
        return GroupType.jeunesEnfants;
      case 4:
        return GroupType.choeurComplet;
      case 5:
        return GroupType.tous;
      default:
        return GroupType.tous;
    }
  }

  @override
  void write(BinaryWriter writer, GroupType obj) {
    switch (obj) {
      case GroupType.orchestre:
        writer.writeByte(0);
        break;
      case GroupType.hommes:
        writer.writeByte(1);
        break;
      case GroupType.femmes:
        writer.writeByte(2);
        break;
      case GroupType.jeunesEnfants:
        writer.writeByte(3);
        break;
      case GroupType.choeurComplet:
        writer.writeByte(4);
        break;
      case GroupType.tous:
        writer.writeByte(5);
        break;
    }
  }
}
