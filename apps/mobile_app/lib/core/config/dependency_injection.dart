import 'package:get_it/get_it.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:logger/logger.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supabase;

import '../../data/models/models.dart';
import '../../data/services/api_service.dart';
import '../../data/services/storage_service.dart';
import '../../features/auth/data/services/auth_service.dart';

final GetIt getIt = GetIt.instance;

class DependencyInjection {
  static Future<void> initialize() async {
    // Initialize Hive
    await Hive.initFlutter();

    // Register Hive adapters
    Hive.registerAdapter(EventTypeAdapter());
    Hive.registerAdapter(EventAdapter());
    Hive.registerAdapter(AnnouncementAdapter());
    Hive.registerAdapter(UserAdapter());

    // Initialize Hive boxes
    await Hive.openBox<Event>('events');
    await Hive.openBox<Announcement>('announcements');
    await Hive.openBox<User>('users');

    // Register services
    _registerServices();

    // Register repositories
    _registerRepositories();
  }

  static void _registerServices() {
    // Logger
    getIt.registerLazySingleton<Logger>(
      () => Logger(
        printer: PrettyPrinter(
          methodCount: 2,
          errorMethodCount: 8,
          lineLength: 120,
          colors: true,
          printEmojis: true,
          printTime: true,
        ),
      ),
    );

    // Supabase client
    getIt.registerLazySingleton<supabase.SupabaseClient>(
      () => supabase.Supabase.instance.client,
    );

    // API Service
    getIt.registerLazySingleton<ApiService>(
      () => ApiService(
        supabaseClient: getIt<supabase.SupabaseClient>(),
        logger: getIt<Logger>(),
      ),
    );

    // Auth Service (singleton)
    getIt.registerLazySingleton<AuthService>(() => AuthService());

    // Storage Service
    getIt.registerLazySingleton<StorageService>(
      () => StorageService(logger: getIt<Logger>()),
    );

    // Initialize storage service
    getIt<StorageService>().initialize();
  }

  static void _registerRepositories() {
    // TODO: Register repositories when they are created
    // getIt.registerLazySingleton<EventRepository>(() => EventRepository(
    //   apiService: getIt<ApiService>(),
    //   storageService: getIt<StorageService>(),
    // ));
  }

  static Future<void> dispose() async {
    await Hive.close();
    await getIt.reset();
  }
}
