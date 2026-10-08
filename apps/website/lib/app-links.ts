/**
 * The mobile app's identity, for the app-link files served from
 * `/.well-known/` (#593): iOS Universal Links read
 * `apple-app-site-association`, Android App Links read `assetlinks.json`.
 * Both let a tap on `https://www.lebontemperament.com/l/<code>` open the
 * installed app instead of the browser.
 *
 * The values below are public (they are served to anyone) but the routes
 * answer 404 while they are empty, so an incomplete file is never published.
 */

/** Android application ID and iOS bundle identifier (they are the same). */
export const APP_BUNDLE_ID = "com.lebontemperament.app";

/**
 * TODO(owner): the Apple Developer Team ID (10 characters, App Store Connect
 * › Membership details). Empty until it is known: the AASA route answers 404.
 */
export const APPLE_TEAM_ID = "";

/**
 * SHA-256 fingerprint of the certificate Google Play signs the app with
 * (Play App Signing), in the colon-separated uppercase form the Play Console
 * shows. Read by the « app-signing-certificate » task of play-store.yml
 * (2026-10-08, build 155). The upload key is left out: every installed copy
 * comes from Google Play.
 */
export const ANDROID_SHA256_FINGERPRINTS: readonly string[] = [
  "8C:B7:87:8D:97:51:EC:27:1B:20:57:60:4F:AE:D8:AA:EF:35:C9:16:8D:5A:04:4F:E6:A9:FA:62:D4:B3:6E:F2",
];

/** Where the app is downloaded from. */
export const APP_STORE_URL = "https://apps.apple.com/app/id6819682263";
export const GOOGLE_PLAY_URL = `https://play.google.com/store/apps/details?id=${APP_BUNDLE_ID}`;

/** The paths the app claims (`/l/<code>` delivery links only). */
export const APP_LINK_PATH_PATTERN = "/l/*";
