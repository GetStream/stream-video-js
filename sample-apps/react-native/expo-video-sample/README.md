# React Native Expo Video Sample app

The Expo Video Sample app is a minimal app that uses the Stream Video React Native Video SDK.

## Steps to run the app

1. Clone the `stream-video-js` repository

```bash
git clone https://github.com/GetStream/stream-video-js.git

# Step in the directory
cd stream-video-js
```

2. Install and build dependencies

```bash
# Install the dependencies
yarn;

# build the packages
yarn build:all
```

3. Install pods and setup permissions

```bash
cd sample-apps/react-native/expo-video-sample
```

4. Run the app

Currently the app supports development builds for expo, hence we use the following commands to run the app:

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```
