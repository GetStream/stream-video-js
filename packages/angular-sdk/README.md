# AngularSdk

Angular workspace for the `@stream-io/video-angular-sdk` package and for the sample app to test the package with.

## Running

Run the application `yarn start:angular` - this will start the SDK package in watch mode, and run the sample application also in watch mode (you can call this from the repositorty root (`../`))

You can override the default config params in `projects/sample-app/src/environments/environment.ts`

Navigate to `localhost:4200?callid=<call-id>` to join an existing call

Backend proxy settings: `projects/sample-app/proxy.conf.json`

## Styling

Stylesheets of `@stream-io/video-angular-sdk` live in a separate package, located in `../styling`. This is a shared package with the `react-sdk` so make sure that your changes are also compatible with that package.

## Tests

Not yet

## Linting

`yarn lint`
