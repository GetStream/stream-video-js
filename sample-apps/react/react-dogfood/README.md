# Stream Calls - https://stream-calls-dogfood.vercel.app/

## Configure and Run
1. `cp .env.example .env.local`
2. Update the secrets in `.env.local` (by default, dogfood app will connect to the staging environment)
   1. Some secrets aren't available in the `.env.example`. Please look into [this document.](https://www.notion.so/stream-wiki/Stream-Calls-Dogfooding-App-271f55027d7944ae8fd576f4b7e66c9e)
3. Run the app in development mode `yarn dev`
   1. For better development experience, you might want to run the following packages in "watch mode"
      1. `yarn start:client`
      2. `yarn start:styling`
      3. `yarn start:react:sdk`
