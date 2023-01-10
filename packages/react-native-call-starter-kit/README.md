## React Native Call Starter Kit

The application is made as a start kit to the call flow of the new Stream Video React Native SDK.

### Configuring the Environment Variables

For testing, use the following environment variables:

```
STREAM_API_KEY=5mxvmc2t4qys
STREAM_API_SECRET=u54nds9v328s4b6g56juvsmj5j9nevetdqjszwdt2qr5ubfkswh5rjhmzuw9rvd4
```

### Installation steps

The following are the installation steps to run the application:

- Clone the [repository](https://github.com/GetStream/stream-video-js).
- Install the dependencies by doing `yarn install` or `npm install`.
- Run `yarn build:all`. This will build the client and the other packages required for the application to work.
- Move to `cd packages/react-native-call-starter-kit`.
- Pod install for iOS using `npx pod-install` or `cd ios && pod install`.
- Run `yarn start` and `yarn run android` to run the application on Android, and, `yarn run ios` to run it on iOS.
