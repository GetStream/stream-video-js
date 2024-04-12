# Stream Calls - https://getstream.io/video/demos

## Configure and Run
1. Clone the repo and install the dependencies - `yarn install`
2. Create local environment configuration - `cp .env.example .env.local`
3. Set the secrets (STREAM_API_KEY, STREAM_SECRET_KEY, etc...) in `.env.local`
4. Build the dependencies - `yarn build:react:deps`
5. Run the app in development mode - `yarn dev`
   1. For better development experience, run the following packages in "watch mode"
      1. `yarn start:client`
      2. `yarn start:styling`
      3. `yarn start:react:sdk`
