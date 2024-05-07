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

- clone the repository
- run `yarn install` in the root folder (`stream-video-js/`)
- run `yarn build:all` in the root folder (`stream-video-js/`)
- navigate to `sample-apps/react/egress-composite` folder
- check for `.env-example` file that show you how to create a local `.env` file for the given package to hold credentials
- uncomment and tweak the setup script at the bottom of the [`main.tsx`](./src/main.tsx) file (see below) to adjust the application UI to your likings and make sure the `call_id` configuration parameter is specified in the configuration object
- run `yarn start` to run the application
- open a browser

The IDE intellisense will hint the possible keys and values of the configuration object that is set with `window.setupLayout(config)` call.

```ts
import cssUrl from '../public/example/custom.css?url';

(() => {
  const v = document.createElement('script');
  v.innerHTML = `window.setupLayout(${JSON.stringify({
    call_id: '<call_id>', // <-- has to be specified
    layout: 'grid',
    screenshare_layout: 'spotlight',
    ext_css: cssUrl,
    options: {
      'title.text': 'Hey Streamers!',
      'logo.image_url': 'https://getstream.io/blog/images/stream-logo.png',
      'layout.background_color': 'red',
      'video.background_color': 'green',
      'video.scale_mode': 'fit',
      'video.screenshare_scale_mode': 'fit',
      'participant_label.border_color': '#fff',
      'participant_label.border_width': '3px',
      'participant_label.border_radius': '5px',
      'participant_label.background_color': '#ddd',
      'participant_label.text_color': 'darkblue',
    },
  } satisfies Partial<ConfigurationValue>)});`;
  document.head.appendChild(v);
})();
```

## To update the Playwright test baseline screenshots

- in the root of the repo, edit `docker-compose.yml` and provide the API Key and User Token
- run `docker compose up generate-screenshots`
- check the generated screenshots in `./tests/__screenshots__/`
- push the changes to the repo
