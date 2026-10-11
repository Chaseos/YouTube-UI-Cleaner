#!/bin/sh
# Xcode build phase for the Mac app. Fails the build, and therefore any archive, when the
# version settings Xcode is using no longer match apple/configuration.json.
config="${1:?usage: check-apple-version.sh path/to/configuration.json}"
version=$(/usr/bin/plutil -extract version raw -o - "$config") || exit 1
build=$(/usr/bin/plutil -extract build raw -o - "$config") || exit 1
if [ "$MARKETING_VERSION" != "$version" ] || [ "$CURRENT_PROJECT_VERSION" != "$build" ]; then
  echo "error: Xcode is building version $MARKETING_VERSION ($CURRENT_PROJECT_VERSION), but apple/configuration.json is $version ($build). Run npm run build to regenerate Configurations/Generated/Apple.xcconfig, then build again."
  exit 1
fi
