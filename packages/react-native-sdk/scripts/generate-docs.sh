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
npx replace-in-file '# Interface: ' '# ' 'temp-docs/**' > /dev/null
sed -i '' -e 's/interfaces/..\/Interfaces/g' 'temp-docs/modules.md'
sed -i '' -e 's/\.md/\//g' 'temp-docs/modules.md'

# copy from the temp-docs to the structure we want in docusaurus
mkdir generated-docs
cp -r temp-docs/interfaces generated-docs/Interfaces
cp temp-docs/modules.md generated-docs/components.md
rm -rf temp-docs

# copy shared JS docs to the docs to react-native docusaurus
cp -a ../client/docusaurus/docs/clientjs docusaurus/docs/reactnative/06-client-js
cp -a ../client/generated-docs/. docusaurus/docs/reactnative/07-reference
cp -a ../react-bindings/generated-docs/. docusaurus/docs/reactnative/07-reference
cp -a ./generated-docs/. docusaurus/docs/reactnative/07-reference

echo "Done!"
