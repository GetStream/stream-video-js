# React Native Video Example

## Steps to run the app

1. Move to the root folder of the repo
2. Run `yarn` to install dependencies
3. Make sure you have a `.env` file in `sample-apps/react-native/dogfood` with the following keys: `STREAM_API_KEY`
   and `STREAM_API_SECRET`
4. Run `yarn build:all` to build the dependent packages
5. Move to `cd sample-apps/react-native/dogfood/`
6. Run `npx react-native setup-ios-permissions` to setup permissions (ios only)
7. Run `npx pod-install` to install pods (ios only)
8. Follow [this guide](https://www.notion.so/stream-wiki/Video-dogfood-app-8fd4b72b2ac9495eb55872f5a70b5f6d) and setup
   Sentry error tracking (or: `SENTRY_RN_AUTH_TOKEN=<your-token> ./scripts/create-sentry-properties.sh`)
9. Run the app 
   - On simulator: Run `yarn ios` and/or `yarn android` to run the app 
   - On device: Run `npm install -g ios-deploy` then `yarn ios --device`

## Invite links to install app on devices

- Android: <https://appdistribution.firebase.dev/i/d95ca5c1430d6574>
- iOS: <https://testflight.apple.com/join/p4Gy0JSM>

## Running the E2E tests

The following are the steps to run the E2E tests:

- Install [maestro](https://github.com/mobile-dev-inc/maestro) CLI tool
- Install [stream-video-buddy](https://github.com/GetStream/stream-video-buddy) CLI tool
- Launch the simulator and install the test app by following the instructions above
- Start the test flow by running `yarn test-e2e` from the root of this project. This will run the tests either on a device of choice
