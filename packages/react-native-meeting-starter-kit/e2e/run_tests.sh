#!/bin/bash

IOS_APP_ID=org.reactjs.native.example.StreamReactNativeMeetingStarterKit
ANDROID_APP_ID=com.streamreactnativemeetingstarterkit
PREFERRED_OS=$1


# Install dependencies
cd ../../
yarn install
yarn build:react-native:deps
cd packages/react-native-meeting-starter-kit
npx pod-install

echo "Stream video buddy authenticating..."
stream-video-buddy auth

echo "Starting node CLI helper server..."
node ./e2e/js/server.js &

# Start metro bundler
yarn start &
# Wait for metro bundler to start
sleep 5

# Run tests for iOS when preferred OS is not specified or when it is iOS
if [ -z "$PREFERRED_OS" ] || [ "$PREFERRED_OS" = "--ios" ]
then
  echo "Building iOS app"
  yarn ios

  echo "Running tests for iOS"
  maestro test -e APP_ID=$IOS_APP_ID ./e2e/flow.yaml
  echo "iOS E2E tests completed successfully!"
fi

# Run tests for Android when preferred OS is not specified or when it is Android
if [ -z "$PREFERRED_OS" ] || [ "$PREFERRED_OS" = "--android" ]
then
  echo "Building Android app"
  yarn android

  echo "Running tests for Android"
  maestro test -e APP_ID=$ANDROID_APP_ID ./e2e/flow.yaml
  echo "Android E2E tests completed successfully!"
fi


echo "Killing metro bundler and node CLI helper server..."
JOB_IDS=$(lsof -t -i tcp:8081)\\n$(lsof -t -i tcp:7654)
JOB_IDS=(${JOB_IDS//\\n/ })

for JOB_ID in "${JOB_IDS[@]}"
do
  echo "Killing job $JOB_ID"
  kill -9 $JOB_ID
done
