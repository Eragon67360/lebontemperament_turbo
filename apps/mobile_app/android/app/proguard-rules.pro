# Flutter specific rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Supabase real-time rules
-keep class io.supabase.** { *; }
-keep class io.supabase.realtime.** { *; }
-keep class io.supabase.postgrest.** { *; }
-keep class io.supabase.gotrue.** { *; }
-keep class io.supabase.storage.** { *; }

# WebSocket and real-time connection rules
-keep class org.java_websocket.** { *; }
-keep class com.squareup.okhttp.** { *; }
-keep class okhttp3.** { *; }
-keep class retrofit2.** { *; }

# Notification service rules
-keep class com.dexterous.** { *; }
-keep class androidx.core.app.** { *; }

# Hive database rules
-keep class * extends com.google.protobuf.GeneratedMessageLite { *; }
-keep class * implements androidx.sqlite.db.SupportSQLiteOpenHelper { *; }
-keep class * implements androidx.sqlite.db.SupportSQLiteDatabase { *; }

# Keep all model classes
-keep class com.example.mobile_app.** { *; }
-keep class **.models.** { *; }
-keep class **.data.models.** { *; }

# Keep all enum classes
-keep enum ** { *; }

# Keep all service classes
-keep class **.services.** { *; }

# Keep all provider classes
-keep class **.providers.** { *; }

# Keep all generated classes
-keep class **.g.dart { *; }
-keep class **.freezed.dart { *; }

# General rules for real-time functionality
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keepattributes InnerClasses

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep serialization methods
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep JSON serialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep all methods that might be called via reflection
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep all classes that might be used in notifications
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep all classes that might be used in real-time callbacks
-keepclassmembers class * {
    void onRehearsalAdded(...);
    void onRehearsalUpdated(...);
    void onRehearsalDeleted(...);
    void onEventAdded(...);
    void onEventUpdated(...);
    void onEventDeleted(...);
    void onConcertAdded(...);
    void onConcertUpdated(...);
    void onConcertDeleted(...);
} 