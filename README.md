# stream-video-react

## Setup
1. Clone this repository `git clone --recursive https://github.com/GetStream/stream-video-react.git`
2. Install dependencies by running `yarn install` in the root of the repo
3. Generate the client `cd packages/client && ./generate-client.sh && yarn build`
4. Run the application `yarn start:app` (make sure the server is already running)

## Notes
This repository contains a submodule link to [GetStream/video](https://github.com/GetStream/video).
This link is then used for sourcing the .proto files during protobuf code generation process.
