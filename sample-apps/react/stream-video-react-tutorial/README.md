# React Video Tutorial

## Steps to run the app

1. Populate the `main.tsx` file in the `src/` using credentials from your Stream account. You can find these on your dashboard.
2. Run `yarn` to install dependencies
3. Run `yarn build:react:deps` to build the dependent packages
4. Run `yarn dev` to launch the application

## URL overrides

Append `?call_id=<id>` to the page URL to join a specific call instead of a
fresh random one each load. Handy when you want two clients (e.g. desktop
Safari and the iOS WKWebView sample below) to meet in the same room:

```
https://<your-tunnel>.trycloudflare.com/?call_id=regression-repro-42
```

If the parameter is omitted, the tutorial auto-generates a call id and
**writes it back into the URL** via `history.replaceState`, so the address
bar always reflects the active call. Copy the URL from the address bar to
invite another client into the same room.

## Troubleshooting in an iOS WKWebView

A companion native iOS sample that embeds this tutorial inside a `WKWebView` lives at [`sample-apps/ios/ios-webview`](../../ios/ios-webview/). It pairs with a Cloudflare Quick Tunnel so the iPhone can reach your laptop's Vite server over HTTPS, and exposes a Scenarios menu (audio, lifecycle, permission tampering, network tampering, chaos playback) plus live WebRTC stats to help reproduce integration issues customers hit when the React Video SDK runs inside a webview.
