# Mobile App

A Flutter mobile application for Le Bon Tempérament choir management.

## Features

- **Real-time Notifications**: Get instant notifications when new rehearsals are added to the database
- **Event Reminders**: Scheduled notifications for upcoming concerts and rehearsals
- **User Authentication**: Secure login with Supabase
- **Theme Support**: Light, dark, and system theme modes
- **Localization**: French and English support

## Real-time Notifications

The app now supports real-time notifications for rehearsals! When a new rehearsal is added to the database, users will receive an immediate notification with the rehearsal details.

### How it works:

1. **Automatic Setup**: Real-time notifications are automatically initialized when the app starts
2. **User Control**: Users can enable/disable real-time notifications in the notification settings
3. **Smart Lifecycle Management**: Notifications are paused when the app goes to background and resumed when it comes to foreground
4. **Permission Handling**: The app automatically requests notification permissions when needed

### Supabase Configuration

To enable real-time notifications, make sure your Supabase project has:

1. **Real-time enabled** for the `rehearsals` table
2. **Row Level Security (RLS)** policies configured appropriately
3. **Database triggers** (optional) for additional functionality

### Testing Real-time Notifications

To test the feature:

1. Open the app and ensure notifications are enabled
2. Add a new rehearsal through your admin interface or database
3. You should receive an immediate notification with the rehearsal details

## Development

### Prerequisites

- Flutter SDK 3.8.1+
- Dart SDK
- Supabase project with real-time enabled

### Setup

1. Clone the repository
2. Install dependencies: `flutter pub get`
3. Configure your `.env` file with Supabase credentials
4. Run the app: `flutter run`

### Environment Variables

Create a `.env` file in the root directory:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture

The app follows a clean architecture pattern with:

- **Features**: Organized by domain (auth, notifications, rehearsals, etc.)
- **Data Layer**: Services, models, and repositories
- **Presentation Layer**: Screens, widgets, and providers
- **Core**: Configuration, themes, and utilities

## Dependencies

- **State Management**: Riverpod
- **Navigation**: Go Router
- **Database**: Supabase Flutter
- **Notifications**: Flutter Local Notifications
- **Storage**: Hive
- **Code Generation**: Freezed, JSON Serializable
