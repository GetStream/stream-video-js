#!/bin/bash
# set -e

# the sdk's name in the folder under packages/*/docusaurus/docs/?/
SDK_DIR_IN_DOCS=$1;
# value of the name property in package.json. i.e @stream-io/video-*
PACKAGE_NAME=$2;
# package name of the SDK. i.e react-native-sdk
PACKAGE_DIR_NAME=$3;

DOCUSAURUS_PATH="docusaurus/docs";
SDK_DOCS_PATH="$DOCUSAURUS_PATH/$SDK_DIR_IN_DOCS";

ROOT_PROJ_DIR=$(dirname "$0")

rename_generated_files () {
  for sub_directory in $* ;
  do
    (
      find "$sub_directory" -type f | while read filepath; do
        if [[ $filepath != *.mdx && $filepath != *.md ]]; then continue; fi;
        dirpath=$(dirname $filepath)
        filename=$(basename $filepath)
        extension="${filename##*.}"
        name="${filename%.*}"

        mv -- "$filepath" "$dirpath/$name.gen.$extension"
      done
    )
  done
}

cd "$ROOT_PROJ_DIR/.." || exit
cd "packages/$PACKAGE_DIR_NAME/" || exit

echo "Generating docs from the client..."
yarn workspace @stream-io/video-client run clean:docs > /dev/null
yarn workspace @stream-io/video-client run generate-docs:classes > /dev/null
yarn workspace @stream-io/i18n run docs:generate > /dev/null

echo "Generating docs from $PACKAGE_NAME and react-binding..."
# delete react-bindings dist to have proper source code links for hooks/contexts defined there
rm -rf ../react-bindings/dist/

# clean up old docs
rm -rf generated-docs
rm -rf "$SDK_DOCS_PATH/04-call-engine/"
rm -rf "$SDK_DOCS_PATH"/03-ui/*.md
rm -rf "$SDK_DOCS_PATH/03-ui/Interfaces/"
rm -rf "$SDK_DOCS_PATH/07-i18n/"
rm -rf "$SDK_DOCS_PATH"/02-guides/*gen.mdx

mkdir generated-docs

# generate and process new docs

# Hooks and Contexts
if [ "$PACKAGE_DIR_NAME" == 'react-sdk' ]; then
  npx typedoc --options typedoc.json --exclude '!**/*(hooks|contexts)/**'
else
  # RN needs a special exclude statement because of reexporting StreamVideo
  npx typedoc --options typedoc.json --exclude '!**/*(hooks|contexts|providers)/**'
fi
npx replace-in-file '/\.md/g' '/' 'temp-docs/modules.md' --isRegex > /dev/null
npx replace-in-file '/modules\//g' '' 'temp-docs/modules.md' --isRegex > /dev/null
cp temp-docs/modules.md generated-docs/hooks-and-contexts.md
npx replace-in-file "# $PACKAGE_NAME" '# Hooks and Contexts' 'generated-docs/hooks-and-contexts.md' > /dev/null

# Components
npx typedoc --options typedoc.json --exclude '!**/*components/**'
npx replace-in-file "# $PACKAGE_NAME" '# Components' 'temp-docs/**' > /dev/null
npx replace-in-file '# Interface: ' '# ' 'temp-docs/**' > /dev/null
npx replace-in-file '/interfaces/g' '../Interfaces' 'temp-docs/modules.md' --isRegex > /dev/null
npx replace-in-file '/\.md/g' '/' 'temp-docs/modules.md' --isRegex > /dev/null
npx replace-in-file '/modules\//g' '' 'temp-docs/modules.md' --isRegex > /dev/null
cp temp-docs/modules.md generated-docs/components.md
cp -a temp-docs/interfaces/. generated-docs/Interfaces/

#copy from the temp-docs to the structure we want in docusaurus
mkdir "$SDK_DOCS_PATH/04-call-engine"
touch "$SDK_DOCS_PATH/04-call-engine/_category_.json"
echo "{
  \"label\": \"Call Engine\",
  \"position\": 4
}" > "$SDK_DOCS_PATH/04-call-engine/_category_.json"
rm -rf temp-docs

# move client, i18n docs to SDK's docs and mark as generated
cp -a "../client/$DOCUSAURUS_PATH/client/." generated-docs/client/
cp -a "../i18n/$DOCUSAURUS_PATH/i18n/." generated-docs/i18n/
cp -a ../i18n/generated-docs/. generated-docs/i18n/07-i18n
rename_generated_files generated-docs/client;
rename_generated_files generated-docs/i18n;

cp -a ./generated-docs/client/. "$SDK_DOCS_PATH"
cp -a ./generated-docs/i18n/. "$SDK_DOCS_PATH"

# copy shared JS docs to the docs to SDK's docusaurus
cp -a ../client/generated-docs/. "$SDK_DOCS_PATH/04-call-engine/"
cp "../client/$DOCUSAURUS_PATH/client/SDKSpecific.jsx" "$SDK_DOCS_PATH/SDKSpecific.jsx"

cp -a generated-docs/hooks-and-contexts.md "$SDK_DOCS_PATH/04-call-engine/"

cp -a generated-docs/components.md "$SDK_DOCS_PATH/03-ui/"
cp -a generated-docs/Interfaces/. "$SDK_DOCS_PATH/03-ui/Interfaces/"

rm -rf generated-docs

echo "Done!"
