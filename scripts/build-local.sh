#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Adjust these paths if your project structure is different
MOBILE_APP_DIR="apps/mobile_app"
BUMP_SCRIPT_PATH="scripts/bump-mobile-version.js"
ROOT_ENV_FILE=".env.local" # We'll read secrets from this file at the project root

# --- Pretty Colors for Output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Script Logic ---

# 1. Determine Build Type (dev or prod)
BUMP_TYPE="build" # Default to 'dev' style build number bump
if [[ "$1" == "prod" ]]; then
  BUMP_TYPE="patch" # If 'prod' is passed as an argument, do a 'main' style patch version bump
fi
echo -e "${YELLOW}Starting local build for type: ${BUMP_TYPE}${NC}"

# 2. Check for root .env file
if [ ! -f "$ROOT_ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: Root environment file ($ROOT_ENV_FILE) not found.${NC}"
    echo "The script will continue, but the .env file for the app might be incomplete."
    echo "Please create a '$ROOT_ENV_FILE' file in the project root with your secrets."
fi

# 3. Bump the version using your existing Node.js script
echo "Bumping version..."
NEW_VERSION=$(node ${BUMP_SCRIPT_PATH} ${BUMP_TYPE} | tail -1)
echo -e "Version updated to: ${GREEN}${NEW_VERSION}${NC}"

# 4. Create the .env file for the Flutter app
echo "Creating .env file for Flutter app..."
# Source the root .env file to load variables, but check if it exists first
if [ -f "$ROOT_ENV_FILE" ]; then
    export $(grep -v '^#' $ROOT_ENV_FILE | xargs)
fi

# Determine SITE_URL based on build type
SITE_URL=$([ "$BUMP_TYPE" == "patch" ] && echo "$SITE_URL_PROD" || echo "$SITE_URL_DEV")

# Write the config to the app's .env file
cat > "${MOBILE_APP_DIR}/.env" <<- EOM
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Public website URL (for driver tracking share link)
SITE_URL=${SITE_URL}
EOM
echo ".env file created at ${MOBILE_APP_DIR}/.env"

# 5. Build the Flutter App
echo "Installing Flutter dependencies..."
cd ${MOBILE_APP_DIR}
flutter pub get

echo "Building release APK... (This may take a few minutes)"
flutter build apk --release
cd ../.. # Go back to the project root

# 6. Rename the APK for distribution
echo "Renaming APK..."
OLD_PATH="${MOBILE_APP_DIR}/build/app/outputs/flutter-apk/app-release.apk"
NEW_PATH="${MOBILE_APP_DIR}/build/app/outputs/flutter-apk/BT-App-v${NEW_VERSION}.apk"

mv $OLD_PATH $NEW_PATH

# 7. All Done!
echo -e "✅ ${GREEN}Build complete!${NC}"
echo "Your APK is ready at:"
echo -e "${GREEN}${NEW_PATH}${NC}"
