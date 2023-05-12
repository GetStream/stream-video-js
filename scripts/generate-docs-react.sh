#!/bin/bash
set -e

# the sdk's name in the folder under packages/*/docusaurus/docs/?/
SDK_DIR_IN_DOCS=$1;
# value of the name property in package.json. i.e @stream-io/video-*
PACKAGE_NAME=$2;
# package name of the SDK. i.e react-native-sdk
PACKAGE_DIR_NAME=$3;

DOCUSAURUS_PATH="docusaurus/docs";
SDK_DOCS_PATH="$DOCUSAURUS_PATH/$SDK_DIR_IN_DOCS";

ROOT_PROJ_DIR=$(dirname "$0")

cd "$ROOT_PROJ_DIR/.." || exit
cd "packages/$PACKAGE_DIR_NAME/" || exit

echo "Generating docs from the client..."
yarn workspace @stream-io/video-client run clean:docs > /dev/null
yarn workspace @stream-io/video-client run generate-docs:classes > /dev/null

echo "Generating docs from $PACKAGE_NAME and react-binding..."
# delete react-bindings dist to have proper source code links for hooks/contexts defined there
rm -rf ../react-bindings/dist/

# clean up old docs
rm -rf generated-docs

mkdir generated-docs

# generate and process new docs

# Hooks and Contexts
if [ "$PACKAGE_DIR_NAME" == 'react-sdk' ]; then
  npx typedoc --options typedoc.json --exclude '!**/+(hooks|contexts)/**'
else
  # RN needs a special exclude statement because of reexporting StreamVideo
  npx typedoc --options typedoc.json --exclude '!**/*(hooks|contexts|providers)/**'
fi
npx replace-in-file '/\.md/g' '/' 'temp-docs/modules.md' --isRegex > /dev/null
npx replace-in-file '/modules\//g' '' 'temp-docs/modules.md' --isRegex > /dev/null
cp temp-docs/modules.md generated-docs/hooks-and-contexts.md
npx replace-in-file "# $PACKAGE_NAME" '# Hooks and Contexts' 'generated-docs/hooks-and-contexts.md' > /dev/null

#copy from the temp-docs to the structure we want in docusaurus

# copy shared JS docs to the docs to SDK's docusaurus
cp -a ../client/generated-docs/. "$SDK_DOCS_PATH/04-call-engine/"

cp -a generated-docs/hooks-and-contexts.md "$SDK_DOCS_PATH/04-call-engine/"

rm -rf generated-docs

echo "Done!"
