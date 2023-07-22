# Stream Video JS SDK

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=GetStream_stream-video-js&metric=alert_status&token=fdc1439303911957da9c7ff2ce505f94c3c14d36)](https://sonarcloud.io/summary/new_code?id=GetStream_stream-video-js)

## Dependencies

Before you can run this project locally, the backend services has to be set up. In order to do so,
clone them and follow their appropriate READMEs found in their root.

- [GetStream/video](https://github.com/GetStream/video) - Coordinator API
- [GetStream/video-sfu](https://github.com/GetStream/video-sfu) - SFU API
- [GetStream/video-proto](https://github.com/GetStream/video) - Proto files and client generation scripts

## Setup

1. Clone this repository `git clone https://github.com/GetStream/stream-video-js.git`
2. Install dependencies by running `yarn install` in the root of this repo
3. Build all packages `yarn clean:all && yarn build:all`

## Running the apps

### React Dogfood app (aka: Stream Calls)

1. Follow the setup procedure in [packages/react-dogfood](packages/react-dogfood/README.md)

### React Sample app

Run the application `yarn start:react:app` (make sure the server is already running)

1.  It could happen that the compiler emits compile error due to corrupted babel cache
2.  Run: `rm -rf packages/react-sample-app/node_modules/.cache`
3.  Re-run the app `yarn start:react:app`

If you want to connect to the SFU and the coordinator running locally, you have to change the URL in
[App.tsx](packages/react-sample-app/src/App.tsx). It should look something like this

Then recompile the app - step (3) in [Setup](#setup) section here and then `yarn start:react:app`.

### React Native

Run the application by following these [steps](https://github.com/GetStream/stream-video-js/blob/main/packages/react-native-dogfood/README.md)
