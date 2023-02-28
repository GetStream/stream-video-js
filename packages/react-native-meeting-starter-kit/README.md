## React Native Meeting Starter Kit

The application is made as a starter kit to the meeting flow of the new Stream Video React Native SDK.

### Configuring the Environment Variables

Configure the environment variables by adding the following environment variables to a `.env` file on the root of the project:

```
STREAM_API_KEY="<Stream API key"

STREAM_TOKEN_SARA="<User token with user id sara>"
STREAM_TOKEN_MICHAEL="<User token with user id michael>"
STREAM_TOKEN_BRIAN="<User token with user id brian>"
STREAM_TOKEN_EVELYN="<User token with user id evelyn>"
STREAM_TOKEN_TINA="<User token with user id tina>"
STREAM_TOKEN_JACK="<User token with user id jack>"

```

### Installation steps

The following are the installation steps to run the application:

- Clone the [repository](https://github.com/GetStream/stream-video-js).
- Install the dependencies by doing `yarn install` or `npm install`.
- Run `yarn build:all`. This will build the client and the other packages required for the application to work.
- Move to `cd packages/react-native-meeting-starter-kit`.
- Pod install for iOS using `npx pod-install` or `cd ios && pod install`.
- Run `yarn start` and `yarn run android` to run the application on Android, and, `yarn run ios` to run it on iOS.
