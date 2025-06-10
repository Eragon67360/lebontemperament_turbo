import 'package:hive/hive.dart';
import 'event.dart';

class EventTypeAdapter extends TypeAdapter<EventType> {
  @override
  final int typeId = 10; // Unique type ID

  @override
  EventType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return EventType.concert;
      case 1:
        return EventType.vente;
      case 2:
        return EventType.repetition;
      case 3:
        return EventType.autre;
      default:
        return EventType.autre;
    }
  }

  @override
  void write(BinaryWriter writer, EventType obj) {
    switch (obj) {
      case EventType.concert:
        writer.writeByte(0);
        break;
      case EventType.vente:
        writer.writeByte(1);
        break;
      case EventType.repetition:
        writer.writeByte(2);
        break;
      case EventType.autre:
        writer.writeByte(3);
        break;
    }
  }
}
