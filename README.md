# Stream Video React SDK

## Dependencies

Before you can run this project locally, the backend services has to be set up. In order to do so,
clone them and follow their appropriate READMEs found in their root.

- [GetStream/video](https://github.com/GetStream/video) - Coordinator API
- [GetStream/video-sfu](https://github.com/GetStream/video-sfu) - SFU API
- [GetStream/video-proto](https://github.com/GetStream/video) - Proto files and client generation scripts

## Setup

1. Clone this repository `git clone https://github.com/GetStream/stream-video-react.git`
2. Install dependencies by running `yarn install` in the root of this repo
3. Build all packages `yarn clean:all && yarn build:all`

## Running the apps

### React

Run the application `yarn start:app` (make sure the server is already running)

1.  It could happen that the compiler emits compile error due to corrupted babel cache
2.  Run: `rm -rf packages/app/node_modules/.cache`
3.  Re-run the app `yarn start:app`

### Angular

Run the application `yarn start:angular-sample-app` (make sure the server is already running)

Navigate to `localhost:4200?callid=<call-id>` to join an existing call
