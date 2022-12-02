#!/bin/bash

echo "Generating docs from the client..."
yarn generate-docs:client > /dev/null

echo "Generating docs from react-bindings..."
yarn generate-docs:react:bindings > /dev/null

echo "Generating docs from React Native SDK..."
# clean up old docs
npx rimraf generated-docs
# generate new docs
npx typedoc --options typedoc.json

# preprocess the docs to our specific needs
npx replace-in-file '# Interface: ' '# ' 'temp-docs/**' > /dev/null
npx replace-in-file '# Module: ' '# ' 'temp-docs/**' > /dev/null
npx replace-in-file '.md' '' 'temp-docs/**' > /dev/null

# copy from the temp-docs to the structure we want in docusaurus
mkdir generated-docs
cp -r temp-docs/interfaces/ generated-docs/Interfaces
cp -r temp-docs/modules/ generated-docs/Modules
rm -rf temp-docs

# copy the docs to react-native docusaurus
cp -r ../client/generated-docs/ docusaurus/docs/reactnative/reference
cp -r ../react-bindings/generated-docs/ docusaurus/docs/reactnative/reference
cp -r ./generated-docs/ docusaurus/docs/reactnative/reference

echo "Done!"
