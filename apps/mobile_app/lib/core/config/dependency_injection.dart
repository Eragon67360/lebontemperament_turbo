import 'package:get_it/get_it.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../data/services/api_service.dart';
import '../../data/services/storage_service.dart';
import '../../features/auth/data/services/auth_service.dart';
import '../../data/models/announcement.dart';
import '../../data/models/user.dart' as app_user;
import '../../data/models/event.dart';
import '../../data/models/concert.dart';
import '../../data/models/rehearsal.dart';
import '../../data/models/event_type_adapter.dart';
import '../../data/models/group_type_adapter.dart';
import '../../data/models/context_adapter.dart';

class DependencyInjection {
  static final GetIt _getIt = GetIt.instance;

  static GetIt get getIt => _getIt;

  static Future<void> init() async {
    // Initialize Hive
    await Hive.initFlutter();

    // Register Hive adapters
    Hive.registerAdapter(AnnouncementAdapter());
    Hive.registerAdapter(app_user.UserAdapter());
    Hive.registerAdapter(EventAdapter());
    Hive.registerAdapter(ConcertAdapter());
    Hive.registerAdapter(RehearsalAdapter());

    // Register enum adapters
    Hive.registerAdapter(EventTypeAdapter());
    Hive.registerAdapter(GroupTypeAdapter());
    Hive.registerAdapter(ContextAdapter());

    // Open Hive boxes
    await Hive.openBox<Announcement>('announcements');
    await Hive.openBox<app_user.User>('users');
    await Hive.openBox<Event>('events');
    await Hive.openBox<Concert>('concerts');
    await Hive.openBox<Rehearsal>('rehearsals');

    // Initialize Logger
    _getIt.registerSingleton<Logger>(
      Logger(
        printer: PrettyPrinter(
          methodCount: 2,
          errorMethodCount: 8,
          lineLength: 120,
          colors: true,
          printEmojis: true,
        ),
      ),
    );

    // Initialize Auth Service
    _getIt.registerSingleton<AuthService>(AuthService());

    // Initialize Date Formatters
    _getIt.registerSingleton<DateFormat>(
      DateFormat('dd/MM/yyyy'),
      instanceName: 'dateFormatter',
    );

    _getIt.registerSingleton<DateFormat>(
      DateFormat('HH:mm'),
      instanceName: 'timeFormatter',
    );

    _getIt.registerSingleton<DateFormat>(
      DateFormat('dd/MM/yyyy HH:mm'),
      instanceName: 'dateTimeFormatter',
    );

    // Register services
    _registerServices();

    // Register repositories
    _registerRepositories();
  }

  static void _registerServices() {
    // Supabase client
    _getIt.registerLazySingleton<SupabaseClient>(
      () => Supabase.instance.client,
    );

    // API Service
    _getIt.registerLazySingleton<ApiService>(
      () => ApiService(
        supabaseClient: _getIt<SupabaseClient>(),
        logger: _getIt<Logger>(),
      ),
    );

    // Storage Service
    _getIt.registerLazySingleton<StorageService>(
      () => StorageService(logger: _getIt<Logger>()),
    );

    // Initialize storage service
    _getIt<StorageService>().initialize();
  }

  static void _registerRepositories() {
    // TODO: Register repositories when they are created
    // _getIt.registerLazySingleton<EventRepository>(() => EventRepository(
    //   apiService: _getIt<ApiService>(),
    //   storageService: _getIt<StorageService>(),
    // ));
  }

  static Future<void> dispose() async {
    await Hive.close();
    await _getIt.reset();
  }
}
