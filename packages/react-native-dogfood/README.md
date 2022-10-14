# React Native Video Example

## Steps to run the app

1. Clone the repo
2. Run `yarn` to install dependencies
3. Run `npx pod-install` to install pods (ios only)
4. Run `yarn start` to start the metro bundler
5. Run `yarn ios` or `yarn android` to run the app

## Start a call

1. Choose a user
2. Click the "Join Call" button

## CLI command to deploy the app

### iOS

```
bundle exec fastlane ios deploy_to_testflight_qa
```

### Android

```
bundle exec fastlane android deploy_to_firebase
```

## Invite links to install app on devices

- Android: <https://appdistribution.firebase.dev/i/d95ca5c1430d6574>
- iOS: TODO - Waiting for apple review to complete
