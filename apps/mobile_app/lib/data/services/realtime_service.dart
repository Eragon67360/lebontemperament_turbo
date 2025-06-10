import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';
import '../models/rehearsal.dart';

class RealtimeService {
  static final RealtimeService _instance = RealtimeService._internal();
  factory RealtimeService() => _instance;
  RealtimeService._internal();

  final SupabaseClient _supabase = Supabase.instance.client;
  final Logger _logger = Logger();

  RealtimeChannel? _rehearsalsChannel;
  bool _isSubscribed = false;

  /// Subscribe to real-time changes on the rehearsals table
  void subscribeToRehearsals({
    required Function(Rehearsal) onRehearsalAdded,
    required Function(Rehearsal) onRehearsalUpdated,
    required Function(String) onRehearsalDeleted,
  }) {
    if (_isSubscribed) {
      _logger.w('Already subscribed to rehearsals channel');
      return;
    }

    try {
      _rehearsalsChannel = _supabase
          .channel('rehearsals-db-changes')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'rehearsals',
            callback: (payload) {
              _logger.i('New rehearsal added: ${payload.newRecord}');
              try {
                final rehearsal = Rehearsal.fromJson(payload.newRecord);
                onRehearsalAdded(rehearsal);
              } catch (e) {
                _logger.e('Error parsing new rehearsal: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'rehearsals',
            callback: (payload) {
              _logger.i('Rehearsal updated: ${payload.newRecord}');
              try {
                final rehearsal = Rehearsal.fromJson(payload.newRecord);
                onRehearsalUpdated(rehearsal);
              } catch (e) {
                _logger.e('Error parsing updated rehearsal: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.delete,
            schema: 'public',
            table: 'rehearsals',
            callback: (payload) {
              _logger.i('Rehearsal deleted: ${payload.oldRecord}');
              try {
                final rehearsalId = payload.oldRecord['id'] as String;
                onRehearsalDeleted(rehearsalId);
              } catch (e) {
                _logger.e('Error parsing deleted rehearsal: $e');
              }
            },
          );

      _rehearsalsChannel!.subscribe((status, [error]) {
        if (error != null) {
          _logger.e('Error subscribing to rehearsals channel: $error');
        } else {
          _isSubscribed = true;
          _logger.i(
            'Successfully subscribed to rehearsals channel. Status: $status',
          );
        }
      });
    } catch (e) {
      _logger.e('Error setting up rehearsals subscription: $e');
    }
  }

  /// Unsubscribe from rehearsals channel
  void unsubscribeFromRehearsals() {
    if (_rehearsalsChannel != null) {
      _rehearsalsChannel!.unsubscribe();
      _rehearsalsChannel = null;
      _isSubscribed = false;
      _logger.i('Unsubscribed from rehearsals channel');
    }
  }

  /// Check if currently subscribed
  bool get isSubscribed => _isSubscribed;

  /// Dispose all subscriptions
  void dispose() {
    unsubscribeFromRehearsals();
    _logger.i('RealtimeService disposed');
  }
}
