# Android Release Signing

Release builds must be signed with a **consistent keystore** so users can update the app without uninstalling. Debug and release builds use different keys, so installing a release APK over a debug build causes a "package conflict" error.

## One-time setup

### 1. Generate a keystore (local only, never commit)

```bash
cd apps/mobile_app/android
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

You will be prompted for:

- Keystore password
- Key password (can be the same)
- Your name, organization, etc.

**Keep this keystore and passwords safe.** You need them for every future release. If you lose them, you cannot update the app on Play Store.

### 2. Configure local release builds

```bash
cd apps/mobile_app/android
cp key.properties.example key.properties
```

Edit `key.properties` with your values:

```properties
storePassword=your-keystore-password
keyPassword=your-key-password
keyAlias=upload
storeFile=upload-keystore.jks
```

`key.properties` and `*.jks` are gitignored. Never commit them.

### 3. Configure GitHub Actions (CI)

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret                      | Description                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | Base64-encoded keystore file. Generate with: `base64 -i upload-keystore.jks \| pbcopy` (macOS) or `base64 -w 0 upload-keystore.jks` (Linux) |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password                                                                                                                           |
| `ANDROID_KEY_PASSWORD`      | Key password                                                                                                                                |

Until these secrets are set, CI builds will use the debug keystore (different per run). After adding them, all release builds will use the same signature.

## Building locally

```bash
# Release APK (uses key.properties if present, else debug)
flutter build apk --release
```

The APK is at `build/app/outputs/flutter-apk/app-release.apk`.

## Troubleshooting

**"Package conflicts with existing package"**

- Uninstall the existing app, then install the new one (one-time fix).
- Ensure you use the same keystore for all release builds (local and CI).

**CI build fails with signing error**

- Verify all three secrets are set correctly.
- Ensure the base64 encoding has no line breaks (use `base64 -w 0` on Linux).
