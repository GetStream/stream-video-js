#!/bin/bash

IOS_APP_ID=org.reactjs.native.example.StreamReactNativeMeetingStarterKit
ANDROID_APP_ID=com.streamreactnativemeetingstarterkit

# Start metro bundler
yarn start &

# Build apps
yarn ios
yarn android

echo "Stream video buddy authenticating..."
stream-video-buddy auth

echo "Starting node server..."
node ./js/server.js &


echo "Running tests for iOS"
maestro test -e APP_ID=$IOS_APP_ID flow.yaml
echo "Running tests for Android"
maestro test -e APP_ID=$ANDROID_APP_ID flow.yaml

echo "E2E tests completed successfully!"

echo "Killing node server..."
kill -9 "$(lsof -t -i tcp:7654)"

