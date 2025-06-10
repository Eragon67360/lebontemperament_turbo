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

class DependencyInjection {
  static final GetIt _getIt = GetIt.instance;

  static GetIt get getIt => _getIt;

  static Future<void> init() async {
    // Initialize Hive
    await Hive.initFlutter();

    // Register Hive adapters
    Hive.registerAdapter(AnnouncementAdapter());
    Hive.registerAdapter(app_user.UserAdapter());

    // Open Hive boxes
    await Hive.openBox<Announcement>('announcements');
    await Hive.openBox<app_user.User>('users');

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
