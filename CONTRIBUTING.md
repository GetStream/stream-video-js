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

## Guidelines

### React SDK

- Don't forget to update [the documentation](https://github.com/GetStream/docs-content/tree/main/chat-sdk/react)
- If you need to update tutorials, don't forget to also update the [relevant codesandboxes](https://codesandbox.io/dashboard/recent?workspace=cc639528-2089-4e83-ad4c-d161569e2f37) as well (in case we have one)
- Don't forget to update relevant sample apps located in `sample-apps/react`

### React Native SDK

- Don't forget to update [the documentation](https://github.com/GetStream/docs-content/tree/main/chat-sdk/react-native)
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
- Many sample applications are deployed to a preview environment, you can check your changes there as well, check the relevant action's output for links (some applications are internal, and only available to Stream developers)
- (internal) documentation is deployed to the [staging docs site](https://staging.getstream.io/video/docs/), you can check your changes there as well

## Making Changes

When you make changes to published packages:

1. Create a feature branch
2. Make your code changes
3. **Create a changeset:** Run `yarn changeset` and follow the interactive prompts
4. Commit both your code and the changeset file (`.changeset/*.md`)
5. Open a PR

### Creating Changesets

We use [Changesets](https://github.com/changesets/changesets) for version management. When you modify any published package (`@stream-io/video-*`), you must create a changeset:

```bash
yarn changeset
```

This will:

- Ask which packages changed
- Ask what type of version bump (major/minor/patch)
- Ask for a summary of changes

**Version bump guidelines:**

- **Major:** Breaking changes (API changes, removed features)
- **Minor:** New features, backwards compatible
- **Patch:** Bug fixes, no new features

See [.changeset/README.md](./.changeset/README.md) for detailed examples and scenarios.

## Release flow (internal)

### For Contributors

All PRs that change published packages **must include a changeset**. CI will fail if a changeset is missing.

### For Maintainers

**Stable releases:** The **Release** workflow runs automatically on every push to `main` and creates/updates a "Version Packages" PR. It automatically exits pre-release mode if needed. Review and merge the PR to publish.

**Pre-releases:** From a non-main branch, manually trigger the **Release** workflow, select `prerelease` type and choose tag: `rc` (default), `beta`, or `alpha`. First run publishes `rc.0`, subsequent runs publish `rc.1`, `rc.2`, etc. Note: Pre-releases are restricted to non-main branches only.

See [.changeset/README.md](./.changeset/README.md) for detailed workflow documentation.

### After Release

When packages are published:

- Documentation is deployed to the [production site](https://getstream.io/video/docs/)
- Node.js documentation needs to be deployed separately ([see Client section](#client))
- Relevant sample apps are automatically deployed
