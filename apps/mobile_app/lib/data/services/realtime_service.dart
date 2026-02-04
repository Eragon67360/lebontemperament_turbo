import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:logger/logger.dart';
import '../models/rehearsal.dart';
import '../models/event.dart';
import '../models/concert.dart';

class RealtimeService {
  static final RealtimeService _instance = RealtimeService._internal();
  factory RealtimeService() => _instance;
  RealtimeService._internal();

  final SupabaseClient _supabase = Supabase.instance.client;
  final Logger _logger = Logger();

  RealtimeChannel? _rehearsalsChannel;
  RealtimeChannel? _eventsChannel;
  RealtimeChannel? _concertsChannel;
  bool _isRehearsalsSubscribed = false;
  bool _isEventsSubscribed = false;
  bool _isConcertsSubscribed = false;

  // Connection retry mechanism
  int _retryCount = 0;
  static const int _maxRetries = 3;
  static const Duration _retryDelay = Duration(seconds: 5);

  /// Subscribe to real-time changes on the rehearsals table
  void subscribeToRehearsals({
    required Function(Rehearsal) onRehearsalAdded,
    required Function(Rehearsal old, Rehearsal updated) onRehearsalUpdated,
    required Function(Rehearsal) onRehearsalDeleted,
  }) {
    if (_isRehearsalsSubscribed) {
      _logger.w('Already subscribed to rehearsals channel');
      return;
    }

    try {
      _logger.i('Setting up rehearsals subscription...');

      _rehearsalsChannel = _supabase
          .channel('rehearsals-db-changes')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'rehearsals',
            callback: (payload) {
              _logger.i(
                '[Realtime] Rehearsals INSERT received: id=${payload.newRecord['id']}, '
                'name=${payload.newRecord['name']}',
              );
              try {
                final rehearsal = Rehearsal.fromJson(payload.newRecord);
                onRehearsalAdded(rehearsal);
              } catch (e) {
                _logger.e('[Realtime] Error parsing new rehearsal: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'rehearsals',
            callback: (payload) {
              _logger.i(
                '[Realtime] Rehearsals UPDATE received: id=${payload.newRecord['id']}, '
                'name=${payload.newRecord['name']}',
              );
              try {
                final oldRehearsal = Rehearsal.fromJson(payload.oldRecord);
                final updatedRehearsal = Rehearsal.fromJson(payload.newRecord);
                onRehearsalUpdated(oldRehearsal, updatedRehearsal);
              } catch (e) {
                _logger.e('[Realtime] Error parsing updated rehearsal: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.delete,
            schema: 'public',
            table: 'rehearsals',
            callback: (payload) {
              _logger.i(
                '[Realtime] Rehearsals DELETE received: id=${payload.oldRecord['id']}, '
                'name=${payload.oldRecord['name']}',
              );
              try {
                final rehearsal = Rehearsal.fromJson(payload.oldRecord);
                onRehearsalDeleted(rehearsal);
              } catch (e) {
                _logger.e('[Realtime] Error parsing deleted rehearsal: $e');
              }
            },
          );

      _rehearsalsChannel!.subscribe((status, [error]) {
        if (error != null) {
          _logger.e('Error subscribing to rehearsals channel: $error');
          _isRehearsalsSubscribed = false;
          _handleSubscriptionError('rehearsals', error);
        } else {
          _isRehearsalsSubscribed = true;
          _retryCount = 0; // Reset retry count on success
          _logger.i(
            'Successfully subscribed to rehearsals channel. Status: $status',
          );
        }
      });
    } catch (e) {
      _logger.e('Error setting up rehearsals subscription: $e');
      _isRehearsalsSubscribed = false;
    }
  }

  /// Subscribe to real-time changes on the events table
  void subscribeToEvents({
    required Function(Event) onEventAdded,
    required Function(Event old, Event updated) onEventUpdated,
    required Function(Event) onEventDeleted,
  }) {
    if (_isEventsSubscribed) {
      _logger.w('Already subscribed to events channel');
      return;
    }

    try {
      _logger.i('Setting up events subscription...');

      _eventsChannel = _supabase
          .channel('events-db-changes')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'events',
            callback: (payload) {
              _logger.i('New event added: ${payload.newRecord}');
              try {
                final event = Event.fromJson(payload.newRecord);
                onEventAdded(event);
              } catch (e) {
                _logger.e('Error parsing new event: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'events',
            callback: (payload) {
              _logger.i('Event updated: ${payload.newRecord}');
              try {
                final oldEvent = Event.fromJson(payload.oldRecord);
                final updatedEvent = Event.fromJson(payload.newRecord);
                onEventUpdated(oldEvent, updatedEvent);
              } catch (e) {
                _logger.e('Error parsing updated event: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.delete,
            schema: 'public',
            table: 'events',
            callback: (payload) {
              _logger.i('Event deleted: ${payload.oldRecord}');
              try {
                final event = Event.fromJson(payload.oldRecord);
                onEventDeleted(event);
              } catch (e) {
                _logger.e('Error parsing deleted event: $e');
              }
            },
          );

      _eventsChannel!.subscribe((status, [error]) {
        if (error != null) {
          _logger.e('Error subscribing to events channel: $error');
          _isEventsSubscribed = false;
          _handleSubscriptionError('events', error);
        } else {
          _isEventsSubscribed = true;
          _retryCount = 0; // Reset retry count on success
          _logger.i(
            'Successfully subscribed to events channel. Status: $status',
          );
        }
      });
    } catch (e) {
      _logger.e('Error setting up events subscription: $e');
      _isEventsSubscribed = false;
    }
  }

  /// Subscribe to real-time changes on the concerts table
  void subscribeToConcerts({
    required Function(Concert) onConcertAdded,
    required Function(Concert old, Concert updated) onConcertUpdated,
    required Function(Concert) onConcertDeleted,
  }) {
    if (_isConcertsSubscribed) {
      _logger.w('Already subscribed to concerts channel');
      return;
    }

    try {
      _logger.i('Setting up concerts subscription...');

      _concertsChannel = _supabase
          .channel('concerts-db-changes')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'concerts',
            callback: (payload) {
              _logger.i('New concert added: ${payload.newRecord}');
              try {
                final concert = Concert.fromJson(payload.newRecord);
                onConcertAdded(concert);
              } catch (e) {
                _logger.e('Error parsing new concert: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.update,
            schema: 'public',
            table: 'concerts',
            callback: (payload) {
              _logger.i('Concert updated: ${payload.newRecord}');
              try {
                final oldConcert = Concert.fromJson(payload.oldRecord);
                final updatedConcert = Concert.fromJson(payload.newRecord);
                onConcertUpdated(oldConcert, updatedConcert);
              } catch (e) {
                _logger.e('Error parsing updated concert: $e');
              }
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.delete,
            schema: 'public',
            table: 'concerts',
            callback: (payload) {
              _logger.i('Concert deleted: ${payload.oldRecord}');
              try {
                final concert = Concert.fromJson(payload.oldRecord);
                onConcertDeleted(concert);
              } catch (e) {
                _logger.e('Error parsing deleted concert: $e');
              }
            },
          );

      _concertsChannel!.subscribe((status, [error]) {
        if (error != null) {
          _logger.e('Error subscribing to concerts channel: $error');
          _isConcertsSubscribed = false;
          _handleSubscriptionError('concerts', error);
        } else {
          _isConcertsSubscribed = true;
          _retryCount = 0; // Reset retry count on success
          _logger.i(
            'Successfully subscribed to concerts channel. Status: $status',
          );
        }
      });
    } catch (e) {
      _logger.e('Error setting up concerts subscription: $e');
      _isConcertsSubscribed = false;
    }
  }

  /// Handle subscription errors with retry mechanism
  void _handleSubscriptionError(String channelName, dynamic error) {
    _logger.w('Handling subscription error for $channelName: $error');

    if (_retryCount < _maxRetries) {
      _retryCount++;
      _logger.i(
        'Retrying subscription for $channelName in ${_retryDelay.inSeconds} seconds (attempt $_retryCount/$_maxRetries)',
      );

      Future.delayed(_retryDelay, () {
        // Reset subscription state and retry
        _isRehearsalsSubscribed = false;
        _isEventsSubscribed = false;
        _isConcertsSubscribed = false;

        // Note: The actual retry should be handled by the calling service
        _logger.i('Retry delay completed for $channelName');
      });
    } else {
      _logger.e(
        'Max retries reached for $channelName subscription. Giving up.',
      );
    }
  }

  /// Unsubscribe from rehearsals changes
  void unsubscribeFromRehearsals() {
    if (_rehearsalsChannel != null) {
      _rehearsalsChannel!.unsubscribe();
      _rehearsalsChannel = null;
      _isRehearsalsSubscribed = false;
      _logger.i('Unsubscribed from rehearsals channel');
    }
  }

  /// Unsubscribe from events changes
  void unsubscribeFromEvents() {
    if (_eventsChannel != null) {
      _eventsChannel!.unsubscribe();
      _eventsChannel = null;
      _isEventsSubscribed = false;
      _logger.i('Unsubscribed from events channel');
    }
  }

  /// Unsubscribe from concerts changes
  void unsubscribeFromConcerts() {
    if (_concertsChannel != null) {
      _concertsChannel!.unsubscribe();
      _concertsChannel = null;
      _isConcertsSubscribed = false;
      _logger.i('Unsubscribed from concerts channel');
    }
  }

  /// Get subscription status
  bool get isRehearsalsSubscribed => _isRehearsalsSubscribed;
  bool get isEventsSubscribed => _isEventsSubscribed;
  bool get isConcertsSubscribed => _isConcertsSubscribed;

  /// Dispose all resources
  void dispose() {
    unsubscribeFromRehearsals();
    unsubscribeFromEvents();
    unsubscribeFromConcerts();
    _logger.i('RealtimeService disposed');
  }
}
