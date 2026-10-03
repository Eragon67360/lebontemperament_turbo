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
SITE_URL=https://www.lebontemperament.com

# Fallback only: the Partitions tabs and the Drive link are read from the
# `drive_folders` table (editable from the admin); these IDs are used when
# that read fails. Leave them unset to use the compiled-in defaults.
DRIVE_FOLDER_MAIN=
DRIVE_FOLDER_ADULTES=
DRIVE_FOLDER_JEUNES=
DRIVE_FOLDER_ENFANTS=
DRIVE_FOLDER_ORCHESTRE=
DRIVE_FOLDER_CAHIER_30_ANS=
```

The Drive explorer and the file viewers call the website's `/api/drive/*` with the member's Supabase access token (`Authorization: Bearer`), the same way the support form calls `/api/contact/mobile`.

Push notifications follow the session: the device subscribes to the `all_users` topic when a member is signed in and unsubscribes, deletes its FCM token and clears the local cache on sign-out (`lib/data/services/session_notifications.dart`). Reminders use inexact Android alarms (no exact-alarm permission), and app data is excluded from Android backups and device transfers.

### Remote flags (kill switch)

At launch the app reads two rows of the `feature_flags` table (`lib/data/services/feature_flags_service.dart`); each one only adds a banner on the home screen, and a failed read (offline, RLS, missing rows) means "no flag", never a blocked app. Create the rows from the Supabase dashboard (SQL below is for reference; the owner runs it):

| `flag_key`           | Effect when `is_enabled`                                                                          | Where the value goes                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `mobile_maintenance` | "Maintenance en cours" banner on the home screen                                                  | `is_enabled` only                                                                |
| `mobile_min_version` | "Mise à jour recommandée" banner when the installed version is older than the value (never blocks) | the version string (`2.1.0`) in the `description` column; the table has no other text column |

```sql
insert into feature_flags (flag_key, flag_name, description, is_enabled) values
  ('mobile_maintenance', 'App mobile : maintenance', null, false),
  ('mobile_min_version', 'App mobile : version minimale', '2.0.0', false);
```

The rows must be readable by signed-in members (the same `select` policy the website uses with the anon key for `anniversary_40_years`).

### Offline states

The rehearsals, concerts and events lists are cached in Hive. When the server cannot be reached they show the cached rows under a "Données hors ligne" banner; with nothing cached they show an error with a retry (worded "Vous êtes hors ligne" when `connectivity_plus` reports no network), and a fresh empty list shows the empty state. The lists reload by themselves when the network comes back.

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
