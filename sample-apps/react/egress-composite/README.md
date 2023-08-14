# Egress-Composite

A companion app in Call Recording process.

## Configuration

This application is meant to be used in a browser window running in a virtualized environment [xvfb](https://en.wikipedia.org/wiki/Xvfb).
As such, this application accepts certain configuration parameters to be provided via a query parameter:

| **Query Parameter**     | **Description**                                  |
|-------------------------|--------------------------------------------------|
| `call_type=<call-type>` | The type of the call. Defaults to `default`.     |
| `call_id=<call-id>`     | The ID of the call to join.                      |
| `api_key=<api-key>`     | The Stream API key.                              |
| `token=<token>`         | The user token.                                  |
| `ext_css=<URL>`         | The URL to load an additional CSS.               |
| `layout=<layout>`       | The layout to use as configured for the call.    |

## Run this locally

```shell
yarn
yarn build:react:deps
yarn start
```

You can test this easily by following these links: 

Composite app - http://localhost:5173/?api_key=hd8szvscpxvd&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZWdyZXNzLTUzYWU1MzlhLTRkNDYtNGRhNC1hMWJmLTlmOWRjMGNiOWIyZSJ9.sHv4SdWaQVPMhBcao1wZnVWQBIgbfhGTBpmWtGnbuck&ext_css=https://gist.githack.com/tbarbugli/a6d0a20691729ff56291486a54e4a599/raw/7ab4788d70ef6b8aa463b6fec4d2954dac51605d/video_example.css&call_id=922525994061&user_id=egress-53ae539a-4d46-4da4-a1bf-9f9dc0cb9b2e&layout=fullscreen
WebRTC call - https://stream-calls-dogfood.vercel.app/join/922525994061

## Token

The user_id claim in the token should include a magic suffix so that the egress user is not included in the participant list `-53ae539a-4d46-4da4-a1bf-9f9dc0cb9b2e`

## Layouts

| **Name**        | **Description**                                                                  |
|-----------------|----------------------------------------------------------------------------------|
| `fullscreen`    | Shows primary track in full screen (switches automatically when primary changes) |
| `sidebar_right` | Shows primary track in spotlight and rest of participants in the sidebar         |
| `sidebar_left`  | Shows primary track in spotlight and rest of participants in the sidebar         |
| `grid`          | Shows all participants in a equal grid                                           |

## External CSS

You can load an external CSS file to make more advanced customizations to the default composite recording layout

Note: due to a Vite bug make sure to add the `ext_css` query parameter not at the end of the URL otherwise the dev server breaks! 

You can inject a custom class name to the root div that contains all DOM elements for the call, see the `theme` param for that.

Important CSS selectors:

- #root
- .str-video__branding-logo
- .str-video__branding-footer
- .str-video__video-placeholder
- .str-video__participant-details
- .str-video__participant-details__name
- .str-video__video-placeholder__avatar
- .str-video__participant-view
- .str-video__participant-view--no-video
- .str-video__participant-view--no-audio
- .str-video__participant-view--no-audio
- .str-video__video-placeholder

- TODOS:

- Fullscreen layout working and tested
- Grid layout working and tested
- Sidebar layouts working and tested
- Make a complete list of relevant CSS classes
- Include a couple meaningful CSS examples
- Fullscreen layout must order participants with this priority order: pinned, dominant speaker, has video, speaking
- All layouts must order participants with this priority order: pinned, dominant speaker, has video, speaking
- Sidebar layout (left/right)
- React SDK needs to expose more CSS classes for the participant component
- `str-video__participant-view--pinned`
- `str-video__participant-view--dominant-speaker`


## Build your own layout

- You can use this code as a starting point
- Make sure to host the application on a reliable production infrastructure, if possible use a fully static webapp
- Make sure to add `span#egress-ready-for-capture` to the DOM when the layout is ready. Recording/broadcasting will only start when that element is present (see `EgressReadyNotificationProvider` in this codebase)
