# Background Notifications Guide

## Status: FCM Implemented

The app now uses **Firebase Cloud Messaging (FCM)** for server-sent push notifications when the app is closed or in background. Local scheduled reminders (concerts/rehearsals) still use `flutter_local_notifications`; Realtime (Supabase) still drives in-app updates and optional local notifications when the app is running.

---

## 🎯 The Problem: App Closed = No Real-time Notifications

When you **completely close** a Flutter app (not just minimize it), all real-time listeners stop working because:

- ❌ **Dart code stops executing**
- ❌ **WebSocket connections are terminated**
- ❌ **No background processing occurs**
- ❌ **Real-time subscriptions are lost**

**Solution:** FCM delivers push notifications from the server (Supabase Edge Function) even when the app is killed.

---

## 🔧 Implementation: Firebase Cloud Messaging (FCM)

### **How it works:**

1. **Supabase Database Trigger** → **Supabase Edge Function** (`send-push-notification`) → **Firebase Cloud Messaging** → **Device Notification**

#### **Implementation Steps:**

##### **1. Add Firebase to your project**

```bash
flutter pub add firebase_core firebase_messaging
```

##### **2. Create Supabase Edge Function**

```typescript
// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { record, table } = await req.json();

    // Send to Firebase Cloud Messaging
    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        Authorization: `key=${Deno.env.get("FIREBASE_SERVER_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "/topics/all_users", // or specific user tokens
        notification: {
          title: getNotificationTitle(table, record),
          body: getNotificationBody(table, record),
        },
        data: {
          type: table,
          id: record.id,
          payload: JSON.stringify(record),
        },
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getNotificationTitle(table: string, record: any): string {
  switch (table) {
    case "events":
      return "Nouvel événement ajouté";
    case "concerts":
      return "Nouveau concert ajouté";
    case "rehearsals":
      return "Nouvelle répétition ajoutée";
    default:
      return "Nouvelle notification";
  }
}

function getNotificationBody(table: string, record: any): string {
  switch (table) {
    case "events":
      return `${record.title || "Événement"} - ${record.date_from || ""}`;
    case "concerts":
      return `${record.name || "Concert"} - ${record.date || ""}`;
    case "rehearsals":
      return `${record.name || "Répétition"} - ${record.date || ""}`;
    default:
      return "Nouvelle notification";
  }
}
```

##### **3. Set up Database Triggers**

```sql
-- Trigger for events
CREATE OR REPLACE FUNCTION notify_new_event()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-notification',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}',
    body := json_build_object(
      'table', 'events',
      'record', NEW
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_notification_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_event();

-- Similar triggers for concerts and rehearsals
```

##### **4. Update Flutter App**

```dart
// lib/services/firebase_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class FirebaseService {
  static Future<void> initialize() async {
    // Request permission
    final settings = await FirebaseMessaging.instance.requestPermission();

    // Get FCM token
    final token = await FirebaseMessaging.instance.getToken();

    // Subscribe to topics
    await FirebaseMessaging.instance.subscribeToTopic('all_users');

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Handle foreground notification
    });

    // Handle notification tap
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      // Navigate to specific screen
    });
  }
}

// Must be top-level function
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // This runs even when app is closed
  print('Handling background message: ${message.messageId}');

  // Show notification
  await BackgroundNotificationService.handleBackgroundMessage(message);
}
```

### **Option 2: Supabase Database Webhooks**

#### **How it works:**

1. **Database Change** → **Supabase Webhook** → **External Service** → **Push Notification**

#### **Implementation:**

```sql
-- Enable webhooks in Supabase
-- Go to Database > Webhooks > Create new webhook
-- URL: https://your-external-service.com/webhook
-- Events: INSERT on events, concerts, rehearsals
```

### **Option 3: Periodic Background Sync (Limited)**

#### **How it works:**

1. **App periodically wakes up** → **Check for new data** → **Show notification**

#### **Limitations:**

- ❌ Not real-time (delayed by sync interval)
- ❌ Battery intensive
- ❌ Not reliable on all devices

## 🚀 Recommended Implementation: FCM

### **Why FCM is the best solution:**

✅ **Works when app is completely closed**  
✅ **Real-time notifications**  
✅ **Reliable delivery**  
✅ **Battery efficient**  
✅ **Cross-platform**  
✅ **Scalable**

### **Setup Steps:**

1. **Create Firebase project**
2. **Add FCM to Flutter app**
3. **Create Supabase Edge Function**
4. **Set up database triggers**
5. **Test with closed app**

## 🧪 Testing Background Notifications

### **Test Scenario:**

1. **Install app and grant notification permissions**
2. **Completely close the app** (swipe up and close, not just minimize)
3. **Add new event/concert/rehearsal in Supabase**
4. **Wait for notification** (should appear within seconds)

### **Expected Results:**

- ✅ **Notification appears even with app closed**
- ✅ **Tapping notification opens app**
- ✅ **App navigates to correct screen**
- ✅ **Data is up-to-date**

## 📱 Current Status vs Target

| Scenario       | Current (Real-time) | With FCM |
| -------------- | ------------------- | -------- |
| App Open       | ✅ Works            | ✅ Works |
| App Background | ✅ Works            | ✅ Works |
| App Closed     | ❌ No notifications | ✅ Works |
| Device Reboot  | ❌ No notifications | ✅ Works |

## 🔧 Quick Implementation

If you want to implement FCM quickly:

1. **Add Firebase to your project**
2. **I'll help you set up the Edge Function**
3. **Create the database triggers**
4. **Update your Flutter code**

### **Setup checklist (already done in code)**

- **Mobile app:** Firebase init, FCM handler (`FcmNotificationHandler`), topic `all_users`, tap navigation via GoRouter.
- **Supabase:** Edge Function `send-push-notification` (FCM HTTP v1), migration with triggers on `rehearsals`, `events`, `concerts`.
- **Secrets:** `FIREBASE_SERVICE_ACCOUNT_JSON` (Edge Function), vault `project_url` and `anon_key` (triggers).

### **Optional:** Store FCM tokens in Supabase for per-user targeting (currently using topic `all_users`).
