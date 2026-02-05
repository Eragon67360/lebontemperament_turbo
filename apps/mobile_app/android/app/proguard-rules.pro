# ----------------------------------------------------------
# FLUTTER & DART WRAPPERS
# ----------------------------------------------------------
# Keep Flutter engine interactions
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Keep methods that are called from Dart via JNI (Method Channels)
-keepclasseswithmembernames class * {
    native <methods>;
}

# ----------------------------------------------------------
# ANDROID & KOTLIN CORE
# ----------------------------------------------------------
# Prevent R8 from breaking Kotlin Coroutines (used by many plugins)
-keep class kotlinx.coroutines.** { *; }
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# AndroidX and Support libraries
-keep class androidx.core.app.** { *; }
-keep class androidx.lifecycle.** { *; }

# ----------------------------------------------------------
# NETWORKING (Supabase, HTTP, WebSockets)
# ----------------------------------------------------------
# Supabase and Flutter Http plugins rely heavily on OkHttp. 
# If R8 strips these, real-time and auth will fail.
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class retrofit2.** { *; }
-keep class org.java_websocket.** { *; }

# Prevent 'missing class' warnings for OkHttp/Retrofit dependencies
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

# ----------------------------------------------------------
# SPECIFIC PLUGIN RULES
# ----------------------------------------------------------
# Flutter Local Notifications (com.dexterous)
-keep class com.dexterous.** { *; }

# Hive / SQLite (If used natively)
-keep class * implements androidx.sqlite.db.SupportSQLiteOpenHelper { *; }
-keep class * implements androidx.sqlite.db.SupportSQLiteDatabase { *; }

# ----------------------------------------------------------
# CUSTOM NATIVE LOGIC
# ----------------------------------------------------------
# If you have custom Java/Kotlin code in 'com.lebontemperament.app' that 
# is called from Dart, keep it. Otherwise, let R8 shrink it.
-keep class com.lebontemperament.app.MainActivity { *; }

# You listed specific callback methods. If these exist in your JAVA/KOTLIN 
# code (e.g. for a custom notification listener), we keep them. 
# If these are Dart methods, this rule is ignored.
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

# ----------------------------------------------------------
# DEBUGGING SUPPORT
# ----------------------------------------------------------
# Keep line numbers and source file names so Crashlytics/Play Console 
# can actually show you where the app crashed.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
