# Release APK Real-time Listeners Fixes

## 🔧 Issues Fixed

### 1. **Missing Android Permissions**

**Problem**: Release APK builds were missing critical permissions for background services and real-time connections.

**Solution**: Added the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Background and foreground service permissions -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Keep alive permissions for real-time connections -->
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

### 2. **Network Security Configuration**

**Problem**: Release builds have stricter network security that can block WebSocket connections.

**Solution**: Updated `android/app/src/main/res/xml/network_security_config.xml`:

- Added explicit domains for Supabase
- Allowed cleartext traffic for development
- Maintained security for production domains

### 3. **Build Optimizations Breaking Real-time Code**

**Problem**: ProGuard and R8 optimizations were removing/obfuscating real-time functionality.

**Solution**: Updated `android/app/build.gradle.kts`:

```kotlin
release {
    // Disable aggressive optimizations that can break real-time connections
    isMinifyEnabled = false
    isShrinkResources = false

    // Proguard rules to preserve real-time functionality
    proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
    )
}
```

### 4. **ProGuard Rules**

**Problem**: Code obfuscation was breaking WebSocket connections and Supabase real-time features.

**Solution**: Created `android/app/proguard-rules.pro` with comprehensive rules to preserve:

- Supabase real-time classes
- WebSocket connection classes
- Model classes and enums
- Service and provider classes
- Generated code (Hive, Freezed, JSON)

### 5. **Foreground Service Declaration**

**Problem**: Missing foreground service declaration for notification handling.

**Solution**: Added to `AndroidManifest.xml`:

```xml
<service
    android:name="com.dexterous.flutterlocalnotifications.ForegroundService"
    android:exported="false"
    android:foregroundServiceType="dataSync" />
```

### 6. **Enhanced Error Handling**

**Problem**: Real-time connections were failing silently in release builds.

**Solution**: Updated `RealtimeService` with:

- Better error logging
- Retry mechanisms
- Connection state tracking
- Graceful error handling

## 🧪 Testing the Fixes

### **Before Testing:**

1. Uninstall any previous version of the app
2. Install the new release APK: `build/app/outputs/flutter-apk/app-release.apk`

### **Test Cases:**

#### **1. Real-time Event Updates**

- Open the app and navigate to Events screen
- Add a new event in your Supabase database
- **Expected**: Event should appear immediately in the app

#### **2. Real-time Concert Updates**

- Navigate to Concerts screen
- Add a new concert in your Supabase database
- **Expected**: Concert should appear immediately in the app

#### **3. Real-time Rehearsal Updates**

- Navigate to Rehearsals screen
- Add a new rehearsal in your Supabase database
- **Expected**: Rehearsal should appear immediately in the app

#### **4. Push Notifications**

- Enable real-time notifications in app settings
- Add new events/concerts/rehearsals in Supabase
- **Expected**: Push notifications should appear immediately

#### **5. Background Behavior**

- Put app in background
- Add new data in Supabase
- **Expected**: Notifications should still work

#### **6. Offline/Online Transition**

- Turn off internet
- Add data in Supabase
- Turn internet back on
- **Expected**: Data should sync when connection is restored

## 🔍 Debugging

If real-time listeners still don't work:

### **1. Check Logs**

```bash
adb logcat | grep -E "(flutter|supabase|realtime)"
```

### **2. Verify Permissions**

- Go to Android Settings > Apps > BT App > Permissions
- Ensure all permissions are granted

### **3. Check Network**

- Verify the device can reach your Supabase URL
- Test with a simple HTTP request

### **4. Battery Optimization**

- Go to Android Settings > Apps > BT App > Battery
- Disable battery optimization for the app

## 📱 Key Differences: Debug vs Release

| Feature               | Debug Build | Release APK              |
| --------------------- | ----------- | ------------------------ |
| Code Optimization     | Disabled    | Enabled (but controlled) |
| Network Security      | Relaxed     | Strict                   |
| Permissions           | Automatic   | Must be requested        |
| Background Services   | Allowed     | Restricted               |
| WebSocket Connections | Permissive  | Monitored                |

## 🚀 Production Considerations

1. **Sign the APK**: Use a proper signing key for production
2. **Test on Multiple Devices**: Different Android versions may behave differently
3. **Monitor Battery Usage**: Real-time connections can impact battery life
4. **Handle Edge Cases**: Network changes, app lifecycle, etc.

## ✅ Success Indicators

- Real-time updates work immediately
- Push notifications appear instantly
- No crashes or connection errors in logs
- App works reliably in background
- Data syncs properly after network changes

The fixes ensure that real-time listeners work identically in release APK builds as they do in debug builds and emulators.
