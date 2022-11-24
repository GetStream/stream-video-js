# install all dependencies
yarn

# build all packages
yarn build:all

# install all pods in RN related workspaces
rn_workspaces=(packages/react-native-dogfood packages/react-native-sample-app)
for workspace in "${rn_workspaces[@]}"
 do
  (
    cd "$workspace" || exit
    npx pod-install
  )
done

