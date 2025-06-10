import 'package:hive/hive.dart';
import 'concert.dart';

class ContextAdapter extends TypeAdapter<Context> {
  @override
  final int typeId = 12; // Unique type ID

  @override
  Context read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return Context.orchestre;
      case 1:
        return Context.choeur;
      case 2:
        return Context.orchestreEtChoeur;
      case 3:
        return Context.autre;
      default:
        return Context.autre;
    }
  }

  @override
  void write(BinaryWriter writer, Context obj) {
    switch (obj) {
      case Context.orchestre:
        writer.writeByte(0);
        break;
      case Context.choeur:
        writer.writeByte(1);
        break;
      case Context.orchestreEtChoeur:
        writer.writeByte(2);
        break;
      case Context.autre:
        writer.writeByte(3);
        break;
    }
  }
}
