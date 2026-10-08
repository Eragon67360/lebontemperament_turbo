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
 * TODO(owner): SHA-256 fingerprints of the Android signing certificates, in
 * the colon-separated uppercase form Google Play shows (Play Console › Setup
 * › App signing: the app signing key, plus the upload key for debug builds
 * if wanted). Empty until known: the assetlinks route answers 404.
 */
export const ANDROID_SHA256_FINGERPRINTS: readonly string[] = [];

/** Where the app is downloaded from. */
export const APP_STORE_URL = "https://apps.apple.com/app/id6819682263";
export const GOOGLE_PLAY_URL = `https://play.google.com/store/apps/details?id=${APP_BUNDLE_ID}`;

/** The paths the app claims (`/l/<code>` delivery links only). */
export const APP_LINK_PATH_PATTERN = "/l/*";
