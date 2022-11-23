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

## Running the documentation

### Set up `stream-chat-docusaurus-cli`

Follow the instructions for setting up [`stream-chat-docusaurus-cli`](https://github.com/GetStream/stream-chat-docusaurus-cli#installation-and-using-the-cli)

### Init the docs

The documentation can be found in `docusaurus` folder.

Some (but not all) parts of the documentation is generated from the source code, run the `yarn run init-docs:angular` command to trigger documentation generation.

The command doesn't have a "watch" function, so you'll have to rerun the command whenever the relevant source code is changed and you want to generate the documentaiton.

### Run the docs

Start the docusaurus using the `stream-chat-docusaurus-cli` CLI interface, for example:
`stream-chat-docusaurus -s`

The command will pick up changes inside the documentation folder and automatically reload the page with the changes.
