## React Native Call Starter Kit

The application is made as a starter kit to the call flow of the new Stream Video React Native SDK.

### Configuring the Environment Variables

Configure the environment variables by adding the following environment variables to a `.env` file on the root of the project:

```
STREAM_API_KEY="<Stream API key>"

STREAM_TOKEN_ALICE="<User token with user id alice>"
STREAM_TOKEN_MARK="<User token with user id mark>"
STREAM_TOKEN_BOB="<User token with user id bob>"
STREAM_TOKEN_JANE="<User token with user id jane>"
STREAM_TOKEN_TAMARA="<User token with user id tamara>"
STREAM_TOKEN_JOHN="<User token with user id john>"
```

### Installation steps

The following are the installation steps to run the application:

- Clone the [repository](https://github.com/GetStream/stream-video-js).
- Install the dependencies by doing `yarn install` or `npm install`.
- Run `yarn build:all`. This will build the client and the other packages required for the application to work.
- Move to `cd packages/react-native-call-starter-kit`.
- Pod install for iOS using `npx pod-install` or `cd ios && pod install`.
- Run `yarn start` and `yarn run android` to run the application on Android, and, `yarn run ios` to run it on iOS.
