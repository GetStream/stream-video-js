Hi 👋

We're happy that you'd like to contribute to this project. The following guide will help you get started.

## Setting up your local environment

### Install dependencies

Run the following command in the repository root

```
yarn install
```

### Build packages

```
yarn build:all
```

There are also build scripts for individual packages in case you don't need to build everything.

### Running packages

This repository contains multiple packages. Depending on your contribution you'll need to run some of these. Please refer to the [package overview](./README.md#projectspackages-) to understand which are the relevant packages for you.

Each package has the necessary scripts inside the root [`package.json`](./package.json) file.

Please note that some packages could require extra setup steps:

- please check the README of each package as well
- please check for `.env-example` files that show you how to create a local `.env` file for the given package to hold credentials

### Running docs

Some packages contain documentation pages, these are located in the `docusaurus` folder of the given package's root directory (for example: `packages/react-sdk/docusaurus`).

To run them:

```bach
# navigate to the given package
cd packages/react-sdk
# start docs
stream-chat-docusaurus -s
```

Follow this guide to set up [stream-chat-docusaurus](https://github.com/GetStream/stream-chat-docusaurus-cli)

## Guidelines

### React SDK

- Don't forget to update the documentation located in `packages/react-sdk/docusaurus`
- If you need to update tutorials, don't forget to also update the [relevant codesandboxes](https://codesandbox.io/dashboard/recent?workspace=cc639528-2089-4e83-ad4c-d161569e2f37) as well (in case we have one)
- Don't forget to update relevant sample apps located in `sample-apps/react`

### React Native SDK

- Don't forget to update the documentation located in `packages/react-native-sdk/docusaurus`
  // TODO

### Client

- Don't forget to add/update unit and/or integration tests
- Documentation for the Node.js client lives in the [protocol repository](https://github.com/GetStream/protocol), don't forget to update that

#### SFU API changes (internal)

To update SFU models and API endpoints [generate ts client](https://github.com/GetStream/protocol#generate-sdk-with-docker) and copy the files to the `packages/client/src/gen` folder.

#### Coordinator API changes (internal)

We have a shell script which will generate the Coordinator models from the OpenAPI spec.
This script expects the following directory structure to be set up:

- `chat` - the `chat` repository
- `stream-video-js` - current repository
- `cd stream-video-js/packages/client && yarn generate:open-api:dev`

Alternatively you can use the following script `cd stream-video-js/packages/client && yarn generate:open-api` to generate the models from the [protocol repository](https://github.com/GetStream/protocol).

## PRs

- CI checks are running on PRs, please pay attention to them, and fix issues in case an action fails
- Many sample applications are deployed to a preview environment, you can check your changes there as well, check the relevant action's output for links (some application are internal, and only available to Stream developers)
- (internal) documentation is deployed to the [staging docs site](https://staging.getstream.io/video/docs/), you can check your changes there as well

## Release flow (internal)

Commits to `main` will trigger the following CI steps:

- Version and release all changed packages
  - The new version is calculated for each package automatically based on [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)
  - The release configuration for each public package can be found in the `packages/<package name>/project.json` file
  - For more information checkout the documentation of the [release tool](https://github.com/jscutlery/semver) we are using
  - [Known issue about the release process](https://getstream.slack.com/archives/C04ATV49DU3/p1687161389232829)
- Documentation is deployed to the [production site](https://getstream.io/video/docs/). An exception is the Node.js documentation, which needs to be deployed separately ([see above](#client) for more details).
- All relevant sample apps will be deployed
