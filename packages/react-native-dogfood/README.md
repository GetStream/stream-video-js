# React Native Video Example

## Steps to run the app

1. Move to the root folder of the repo
2. Run `yarn` to install dependencies
3. Run `yarn build:all` to build the dependent packages
4. Move to `cd packages/react-native-dogfood/`
5. Run `npx pod-install` to install pods (ios only)
6. Follow [this guide](https://www.notion.so/stream-wiki/Video-dogfood-app-8fd4b72b2ac9495eb55872f5a70b5f6d) and setup Sentry error tracking (or: `SENTRY_RN_AUTH_TOKEN=<your-token> ./scripts/create-sentry-properties.sh`)
8. Run `yarn ios` and/or `yarn android` to run the app

## Invite links to install app on devices

- Android: <https://appdistribution.firebase.dev/i/d95ca5c1430d6574>
- iOS: <https://testflight.apple.com/join/p4Gy0JSM> 
