#!/bin/sh
# Publish the app to Expo's servers (EAS Update) on the staging branch, pointed at the
# staging API. Open it in Expo Go: expo.dev → trimmy-mobile → Updates → staging.
#
#   npm run publish:staging                      # message = latest commit title
#   npm run publish:staging -- "Fix login screen"  # your own message
#
# Android and iOS go separately: `--platform all` would also try a web build, which
# this app doesn't have.
set -e
cd "$(dirname "$0")/.."

MESSAGE="${1:-$(git log -1 --pretty=%s)}"
for platform in android ios; do
  echo "=== Publishing $platform: $MESSAGE"
  CI=1 EXPO_PUBLIC_API_BASE_URL=https://trimmy-staging.pesagrid.co.ke \
    npx eas-cli update --branch staging --environment preview --platform "$platform" \
    --non-interactive --message "$MESSAGE"
done
