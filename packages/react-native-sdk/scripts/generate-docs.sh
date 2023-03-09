#!/bin/bash

echo "Generating docs from the client..."
yarn workspace @stream-io/video-client run clean:docs > /dev/null
yarn workspace @stream-io/video-client run generate-docs:classes > /dev/null

echo "Generating docs from react-bindings..."
yarn generate-docs:react:bindings > /dev/null

echo "Generating docs from React Native SDK..."
# clean up old docs
rm -rf generated-docs
rm -rf docusaurus/docs/reactnative/04-call-engine/
rm -rf docusaurus/docs/reactnative/07-reference/

# generate new docs
npx typedoc --options typedoc.json

# preprocess the docs to our specific needs
npx replace-in-file '# @stream-io/video-react-native-sdk' '# Components' 'temp-docs/**' > /dev/null
npx replace-in-file '# Interface: ' '# ' 'temp-docs/**' > /dev/null
sed -i '' -e 's/interfaces/..\/Interfaces/g' 'temp-docs/modules.md'
sed -i '' -e 's/\.md/\//g' 'temp-docs/modules.md'

# copy from the temp-docs to the structure we want in docusaurus
mkdir generated-docs
mkdir docusaurus/docs/reactnative/04-call-engine
mkdir docusaurus/docs/reactnative/07-reference
touch docusaurus/docs/reactnative/04-call-engine/_category_.json
touch docusaurus/docs/reactnative/07-reference/_category_.json
echo "{
  \"label\": \"Call Engine\",
  \"position\": 4
}" > docusaurus/docs/reactnative/04-call-engine/_category_.json
echo "{
  \"label\": \"Reference\",
  \"position\": 7
}" > docusaurus/docs/reactnative/07-reference/_category_.json
cp -r temp-docs/interfaces generated-docs/Interfaces
cp temp-docs/modules.md generated-docs/components.md
rm -rf temp-docs

# move client docs to SDK's docs and mark as generated
cp -a ../client/docusaurus/docs/client/ generated-docs/client
cd generated-docs/client || exit
for sub_directories in * ;
do
  (
    cd "$sub_directories" || exit
    for f in * ; do mv -- "$f" "${f%.*}.gen.${f##*.}" ; done
  )
done

cd ../../
cp -a ./generated-docs/client/ docusaurus/docs/reactnative/
rm -rf generated-docs/client/

# copy shared JS docs to the docs to react-native docusaurus
cp -a ../client/generated-docs/. docusaurus/docs/reactnative/04-call-engine
cp -a ../react-bindings/generated-docs/. docusaurus/docs/reactnative/07-reference
cp -a ./generated-docs/. docusaurus/docs/reactnative/07-reference

echo "Done!"
