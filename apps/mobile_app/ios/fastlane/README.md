# App Store Connect and TestFlight from the repository

The iPhone app is built, signed and uploaded to TestFlight by fastlane, from
the **iOS TestFlight** GitHub workflow (`.github/workflows/ios-testflight.yml`).
Nothing reaches Apple without the owner's approval.

| What                        | Where                                                         | How it reaches Apple                                 |
| --------------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| App build                   | built on a GitHub macOS runner from `main`                    | **iOS TestFlight** workflow, after approval          |
| « À tester » (What to Test) | `testflight/what_to_test.txt`                                 | with the build                                       |
| Push notifications          | `Runner/Runner.entitlements` (Firebase Cloud Messaging, APNs) | with the build; the APNs key is uploaded to Firebase |

The bundle ID is `com.lebontemperament.app`, the same as on Android.

## The workflow

It runs on each push to `main` that touches the app (like the Android build)
and by hand (Actions → **iOS TestFlight** → Run workflow; manual runs need the
file on `main`, GitHub's rule). Each run waits for approval on the
`app-store` environment, then:

1. builds the Flutter app without signing (`flutter build ios --no-codesign`);
2. archives and signs it for the App Store (`fastlane ios beta`). Signing is
   automatic: Xcode uses the API key to create or reuse the distribution
   certificate and the provisioning profile in the developer account;
3. uploads it to TestFlight and sets the « À tester » text.

Internal testers (App Store Connect users) get every build. Members are
external testers: they need a TestFlight group and Apple's beta review, to be
set up separately.

The build number is the one in `pubspec.yaml` (`version: x.y.z+N`), the same
as the Android build; TestFlight refuses a number it already has.

## One-time setup (owner)

1. GitHub → Settings → Environments → **New environment** `app-store`, with
   **Required reviewers**: yourself. Optionally restrict it to `main`.
2. App Store Connect → Users and Access → Integrations → **App Store Connect
   API** → generate a team key with the **Admin** role (automatic signing
   in CI needs Admin). Download the `.p8` file (Apple allows it once).
3. Add four secrets to the `app-store` environment:
   - `ASC_KEY_ID`: the key's ID;
   - `ASC_ISSUER_ID`: the issuer ID shown above the keys;
   - `ASC_KEY_P8`: the whole content of the `.p8` file;
   - `APPLE_TEAM_ID`: the team ID (developer.apple.com → Membership).

   The workflow writes the key to the runner's temporary folder for the run
   only. Never commit it or paste it anywhere else.

4. Push notifications: developer.apple.com → Keys → a key with **Apple Push
   Notifications service (APNs)**, then upload that `.p8` to Firebase
   (Project settings → Cloud Messaging → Apple app configuration).
