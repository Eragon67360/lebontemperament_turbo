import 'package:get_it/get_it.dart';
import 'package:intl/intl.dart';
import 'package:logger/logger.dart';

import '../../data/services/storage_service.dart';
import '../../features/auth/data/services/auth_service.dart';

class DependencyInjection {
  static final GetIt _getIt = GetIt.instance;

  static GetIt get getIt => _getIt;

  static Future<void> init() async {
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
    await _getIt.reset();
  }
}
