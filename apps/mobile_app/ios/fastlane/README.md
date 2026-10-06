# App Store Connect and TestFlight from the repository

The iPhone app is built, signed and uploaded to TestFlight by fastlane, from
the **iOS TestFlight** GitHub workflow (`.github/workflows/ios-testflight.yml`).
Nothing reaches Apple without the owner's approval.

| What                        | Where                                                          | How it reaches Apple                                 |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| App build                   | built on a GitHub macOS runner from `main`                     | **iOS TestFlight** workflow, after approval          |
| « À tester » (What to Test) | `testflight/what_to_test.txt`                                  | with the build                                       |
| Push notifications          | `Runner/Runner.entitlements` (Firebase Cloud Messaging, APNs)  | with the build; the APNs key is uploaded to Firebase |
| App Store page texts        | `metadata/fr-FR/*.txt`, `metadata/*.txt` (copyright, category) | **Update the App Store page**, after approval        |
| App Store screenshots       | `screenshots/fr-FR` (iPhone 6.9" and iPad 13")                 | **Update the App Store page**, after approval        |
| Age rating answers          | `age_rating.json` (4+: none of Apple's content questions)      | **Update the App Store page**, after approval        |

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

Internal testers (App Store Connect users) get every build: each upload is
also added to the internal groups that don't take new builds automatically,
and the log lists every internal group with its number of testers. Members are
external testers in the « BT - Testeurs » group, which they join through its public
link. A build reaches them only when the owner sends it, like a Play
promotion: Actions → **iOS TestFlight** → Run workflow → **Send the latest
build to members** (`fastlane ios members`). That run sets the TestFlight
test information (description, feedback email, privacy policy URL, reviewer
notes), adds the newest build to « BT - Testeurs » and submits it for Apple's beta
review; members are notified once Apple approves it. The reviewer's contact
details and sign-in account are typed by the owner in App Store Connect
(TestFlight → Test Information → Beta App Review Information) and are never
stored in this repository.

## The App Store page

Actions → **iOS TestFlight** → Run workflow → **Update the App Store page**
(`fastlane ios store`) fills the App Store version being prepared: the texts
in `metadata/`, the screenshots in `screenshots/` (rendered by
`store/screenshots_test.dart` with demo data, see the Android README), the
age rating, the newest valid build (its version becomes the page's version),
and the App Review details: the contact and sign-in account are copied from
the beta review information the owner typed in TestFlight, without being
printed or stored here. It never submits the version: the owner presses
**Add for Review** in App Store Connect.

Not reachable with the API key, so set by hand in App Store Connect: App
Privacy (the data the app collects), Pricing and Availability, the content
rights declaration, and the EU trader status (Business).

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

4. Register at least one iPhone or iPad under Certificates, Identifiers &
   Profiles › Devices: automatic signing needs one to create its profiles
   (done, 2026-10-06).
5. Push notifications: developer.apple.com → Keys → a key with **Apple Push
   Notifications service (APNs)**, then upload that `.p8` to Firebase
   (Project settings → Cloud Messaging → Apple app configuration).
