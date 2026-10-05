# Google Play from the repository

Everything Google Play shows about the app lives here, next to the code, and
reaches the store through fastlane ([supply](https://docs.fastlane.tools/actions/supply/)).
Claude edits these files in pull requests; nothing reaches the store without
the owner's go.

| What                       | Where                                                                               | How it reaches Google Play                         |
| -------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| App bundle                 | built by `.github/workflows/android-build-release.yml` on `main`                    | automatically, internal track, released to testers |
| Release notes (Nouveautés) | `metadata/android/fr-FR/changelogs/default.txt` (≤ 500 characters)                  | with the bundle above                              |
| Title, short and full text | `metadata/android/fr-FR/title.txt`, `short_description.txt`, `full_description.txt` | **Play Store** workflow, `publish-listing`         |
| Phone screenshots          | `metadata/android/fr-FR/images/phoneScreenshots/*.png` (1080 × 1920)                | **Play Store** workflow, `publish-listing`         |
| Promotion to production    | the build number (versionCode)                                                      | **Play Store** workflow, `promote`                 |

A test (`test/store/store_listing_test.dart`) checks Google's length limits on
every pull request.

## The Play Store workflow

Actions → **Play Store** → Run workflow, then pick a task:

- `download-listing`: reads the live listing (texts, images, screenshots) and
  attaches it to the run as an artifact. Read-only; use it to compare with the
  repository before a first publish.
- `validate-listing`: sends the repository's listing to Google for checking,
  then discards it. Changes nothing.
- `publish-listing`: publishes the texts and screenshots. Images whose content
  didn't change are not sent again. Files absent here (icon, feature
  graphic) stay as they are on Google Play.
- `promote`: moves a build from the internal track to production. Give the
  build number, and a share for a staged rollout (`0.2` = 20 %; empty =
  everyone). Tick `validate_only` to let Google check it first.

`publish-listing` and `promote` run in the `play-store` GitHub environment and
wait for the owner's approval there.

### One-time setup (owner)

1. GitHub → Settings → Environments → **New environment** `play-store`, with
   **Required reviewers**: yourself. Optionally restrict it to the `main` and
   `dev` branches.
2. The workflow uses the existing `ANDROID_SERVICE_ACCOUNT_JSON` secret (the
   one the build already uploads with). In Play Console → Users and
   permissions, that service account needs, for this app: _View app
   information_, _Release to production…_ (for `promote`) and _Manage store
   presence_ (for `publish-listing`).
3. The workflow can only be started once this file is on `main` (GitHub's
   rule for manual workflows); it can then run on any branch.

## Screenshots

They are rendered from the real screens with demo data (no member, nothing
from the database), framed in the brand teal with a caption:

```sh
cd apps/mobile_app
flutter test store/screenshots_test.dart --update-goldens
```

Captions, demo data and the list of screens are in
`store/screenshots_test.dart`. Run it again after any visual change and commit
the images.

## Running fastlane locally

Only with a service account key you hold yourself, never committed:

```sh
cd apps/mobile_app/android
bundle install
PLAY_STORE_JSON_KEY="$(cat /path/to/key.json)" bundle exec fastlane android validate_listing
```
