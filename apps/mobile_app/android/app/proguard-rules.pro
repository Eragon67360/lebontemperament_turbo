# ----------------------------------------------------------
# FLUTTER & DART WRAPPERS
# ----------------------------------------------------------
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Keep methods that are called from Dart via JNI
-keepclasseswithmembernames class * {
    native <methods>;
}

# ----------------------------------------------------------
# GOOGLE PLAY CORE & DEFERRED COMPONENTS (THE FIX)
# ----------------------------------------------------------
# Flutter has logic for downloading app parts on demand. 
# Since you don't use this, the dependencies are missing. 
# We tell R8 to ignore these missing classes so the build passes.
-dontwarn com.google.android.play.core.splitcompat.**
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**
-dontwarn com.google.android.play.core.**

# ----------------------------------------------------------
# ANDROID & KOTLIN CORE
# ----------------------------------------------------------
-keep class kotlinx.coroutines.** { *; }
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
-keep class androidx.core.app.** { *; }
-keep class androidx.lifecycle.** { *; }

# ----------------------------------------------------------
# NETWORKING (Supabase, HTTP, WebSockets)
# ----------------------------------------------------------
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-keep class retrofit2.** { *; }
-keep class org.java_websocket.** { *; }

# Prevent warnings for OkHttp optional dependencies
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement

# ----------------------------------------------------------
# SPECIFIC PLUGIN RULES
# ----------------------------------------------------------
# Flutter Local Notifications
-keep class com.dexterous.** { *; }

# Hive / SQLite
-keep class * implements androidx.sqlite.db.SupportSQLiteOpenHelper { *; }
-keep class * implements androidx.sqlite.db.SupportSQLiteDatabase { *; }

# ----------------------------------------------------------
# CUSTOM NATIVE LOGIC
# ----------------------------------------------------------
-keep class com.lebontemperament.app.MainActivity { *; }

# Keep specific callbacks if they are implemented in Java/Kotlin
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
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
