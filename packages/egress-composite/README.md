# Egress-Composite

A companion app in Call Recording process.

## Config

This application is meant to be used in a browser window running in a virtualized environment (xvfb).
As such, this application accepts certain configuration parameters to be provided via a query parameter:

- `?call_id=<call-id>`: The ID of the call to join. Defaults to `egress-test`.
- `?mode="<speaker>|<shuffle>`: Defines which participant will be rendered on the screen. Defaults to `speaker`.
- `?api_key=<api-key>`: The Stream API key. Defaults to `key10`.
- `?token=<token>`: The egress user token. Defaults to `<see the source>`.
- `?coordinator_rpc_url=<url>`: The URL of the Coordinator API RPC endpoint. Defaults to `https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc`.
- `?coordinator_ws_url=<url>`: The URL of the Coordinator API WS endpoint. Defaults to: `wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect`.

## Run

- `yarn start`
