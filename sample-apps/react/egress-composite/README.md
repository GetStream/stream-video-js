# Egress-Composite

A companion app in Call Recording process.

## Config

This application is meant to be used in a browser window running in a virtualized environment [xvfb](https://en.wikipedia.org/wiki/Xvfb).
As such, this application accepts certain configuration parameters to be provided via JSONP (`window.setupLayout`). List of supported options (marked with ✅) can be found in the [`ConfigurationContext.tsx`](./src/ConfigurationContext.tsx). To test your custom options see the commented-out script at the bottom of the [`main.tsx`](./src/main.tsx) file.

### Required configuration options

| **Parameter** | **Description**                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `call_id`     | The ID of the call to join.                                                                                                          |
| `api_key`     | The Stream API key (if not provided, the application will try to load it from the environment variable `VITE_STREAM_API_KEY`).       |
| `token`       | The access user token (if not provided, the application will try to load it from the environment variable `VITE_STREAM_USER_TOKEN`). |
| `call_type`   | The type of the call. Defaults to `default`.                                                                                         |

## To create and test your custom configuration

- clone repository and run `yarn install` in the root folder (`stream-video-js/`)
- navigate to `sample-apps/react/egress-composite` folder
- run `yarn start`
- open browser
- uncomment and tweak the setup script at the bottom of the [`main.tsx`](./src/main.tsx) file to your likings

## To update the Playwright test baseline screenshots

- in the root of the repo, edit `docker-compose.yml` and provide the API Key and User Token
- run `docker compose up generate-screenshots`
- check the generated screenshots in `./tests/__screenshots__/`
- push the changes to the repo
