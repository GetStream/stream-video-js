# React Livestream App

## Live preview

- https://video-react-livestream-app.vercel.app/

## Steps to run the app

1. Populate the `.env` file in the root of `livestream-app/` using the variables listed in `.env-example`
2. Move to the root folder of the repo (`stream-video-js/`)
3. Run `yarn` to install dependencies
4. Run `yarn build:react:deps` to build the dependent packages
5. Run `yarn sample:react:livestream-app` to launch the application

## Query param configuration

- `api_key: string` - The API key, defaults to `mmhfdzb5evj2`
- `token: string` - The token. If not present, the app will fetch one.
- `user_id: string` - The user ID. If not present, the app will pick a random one.
- `user_name: string;` - The user name. If not present, the app will pick a random one.
- `type: string` - The call type. Defaults to `livestream`.
