# Egress-Composite

A companion app in Call Recording process.

## Config

This application is meant to be used in a browser window running in a virtualized environment [xvfb](https://en.wikipedia.org/wiki/Xvfb).
As such, this application accepts certain configuration parameters to be provided via a query parameter:

| **Query Parameter**      | **Description**                                        |
| ------------------------ | ------------------------------------------------------ |
| `?call_id=<call-id>`     | The ID of the call to join. Defaults to `egress-test`. |
| `?call_type=<call-type>` | The type of the call. Defaults to `default`.           |
| `?api_key=<api-key>`     | The Stream API key.                                    |
| `?token=<token>`         | The access user token.                                 |
| `?base_url=<base-url>`   | The base URL of the Stream Coordinator API.            |
| `?layout=<layout>`       | The layout to use. Defaults to `dominant-speaker`.     |

## Run

- `yarn start`
- open browser
