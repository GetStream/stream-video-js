# Stream Video React SDK

## Notes

This repository contains a Git sub-module link to [GetStream/video](https://github.com/GetStream/video).
This link is then used for sourcing the `.proto` files during protobuf code generation process.

## Setup

1. Clone this repository `git clone --recursive https://github.com/GetStream/stream-video-react.git`
2. Follow the instructions in `/video/README.md` and start the linked server
3. Install dependencies by running `yarn install` in the root of this repo
4. Generate the client `cd packages/client && ./generate-client.sh && yarn build`
5. Build all packages `yarn clean:all && yarn build:all`
6. Run the application `yarn start:app` (make sure the server is already running)
   1. It could happen that the compiler emits compile error due to corrupted babel cache
   2. Run: `rm -rf packages/app/node_modules/.cache`
   3. Re-run the app `yarn start:app`
