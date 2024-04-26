# React Native Video Example

## Setup the environment for React Native
​
First things first, make sure you have set up the development environment for React Native. You can find the official guide [here](https://reactnative.dev/docs/environment-setup).

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
yarn

# build the packages
yarn build:all
```

3. Navigate to the app directory

```bash
cd sample-apps/react-native/dogfood
```

4. Install iOS dependencies managed by CocoaPods.

```bash
npx pod-install
```

Optional: If you have trouble running the app with iOS, try to reinstall the iOS dependencies by running:

- `cd ios` to navigate to the ios folder.
- `bundle install` to install Bundler
- `bundle exec pod install` to install the iOS dependencies managed by CocoaPods.

5. Run the app

   1. `yarn start` to run the Metro development server
   2. `yarn android` or `yarn ios` to run on Android Emulator or iOS simulator respectively.
   3. Optional: To run on a physical device follow the guide [here](https://reactnative.dev/docs/running-on-device).

<!-- ## Running the E2E tests

The following are the steps to run the E2E tests:

- Install [maestro](https://github.com/mobile-dev-inc/maestro) CLI tool.
- Install [stream-video-buddy](https://github.com/GetStream/stream-video-buddy) CLI tool.
- Launch the simulator and install the test app by following the instructions above.
- Start the test flow by running `yarn test-e2e:ios or yarn test-e2e:android` from the root of this project(`/sample-apps/react-native/dogfood`) to run the tests for iOS and Android, respectively. This will run the tests on a device of your choice. -->
