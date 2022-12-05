#!/bin/bash

echo "Generating docs from the client..."
yarn workspace @stream-io/video-client run clean:docs > /dev/null
yarn workspace @stream-io/video-client run generate-docs:classes > /dev/null

echo "Generating docs from react-bindings..."
yarn generate-docs:react:bindings > /dev/null

echo "Generating docs from React Native SDK..."
# clean up old docs
rm -rf generated-docs
# generate new docs
npx typedoc --options typedoc.json

# preprocess the docs to our specific needs
npx replace-in-file '# @stream-io/video-react-native-sdk' '# Components' 'temp-docs/**' > /dev/null

# copy from the temp-docs to the structure we want in docusaurus
mkdir generated-docs
cp temp-docs/modules.md generated-docs/components.md
rm -rf temp-docs

# copy the docs to react-native docusaurus
cp -r ../client/generated-docs/ docusaurus/docs/reactnative/reference
cp -r ../react-bindings/generated-docs/ docusaurus/docs/reactnative/reference
cp -r ./generated-docs/ docusaurus/docs/reactnative/reference

echo "Done!"
