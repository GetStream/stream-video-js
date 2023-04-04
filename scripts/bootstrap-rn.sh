#!/bin/bash
# install all dependencies
yarn

# build all related react native packages
yarn build:react-native:deps

# install all pods in RN related workspaces
rn_workspaces=(../packages/react-native-dogfood ../packages/react-native-call-starter-kit ../packages/react-native-meeting-starter-kit ../sample-apps/react-native/cookbook)
for workspace in "${rn_workspaces[@]}"
do
  (
    cd "$workspace" || exit
    npx pod-install
  )
done

