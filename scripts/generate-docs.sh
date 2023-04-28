#!/bin/bash
# set -e

# the sdk's name in the folder under packages/*/docusaurus/docs/?/
SDK_DIR_IN_DOCS=$1;
# value of the name property in package.json. i.e @stream-io/video-*
PACKAGE_NAME=$2;
# package name of the SDK. i.e react-native-sdk
PACKAGE_DIR_NAME=$3;

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
rm -rf "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/"
rm -rf "docusaurus/docs/$SDK_DIR_IN_DOCS/03-ui/*.md/"
rm -rf "docusaurus/docs/$SDK_DIR_IN_DOCS/03-ui/Interfaces/"

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
mkdir "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine"
touch "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/_category_.json"
echo "{
  \"label\": \"Call Engine\",
  \"position\": 4
}" > "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/_category_.json"
rm -rf temp-docs

# move client docs to SDK's docs and mark as generated
cp -a ../client/docusaurus/docs/client/. generated-docs/client/
cd generated-docs/client || exit
for sub_directory in * ;
do
  if [ -d "$sub_directory" ];
  then
    (
    cd "$sub_directory" || exit
    # prevent renaming the assets files to keep compatibility with mdx imports
    if [[ "$sub_directory" != assets ]];then
      for filename in * ; do mv -- "$filename" "${filename%.*}.gen.${filename##*.}" ; done
    fi
    )
  fi
done

cd ../../

cp -a ./generated-docs/client/. "docusaurus/docs/$SDK_DIR_IN_DOCS/"
rm -rf generated-docs/client/

# copy shared JS docs to the docs to SDK's docusaurus
cp -a ../client/generated-docs/. "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/"
cp ../client/docusaurus/docs/client/SDKSpecific.jsx "docusaurus/docs/$SDK_DIR_IN_DOCS/SDKSpecific.jsx"

cp -a generated-docs/hooks-and-contexts.md "docusaurus/docs/$SDK_DIR_IN_DOCS/04-call-engine/"

cp -a generated-docs/components.md "docusaurus/docs/$SDK_DIR_IN_DOCS/03-ui/"
cp -a generated-docs/Interfaces/. "docusaurus/docs/$SDK_DIR_IN_DOCS/03-ui/Interfaces/"

echo "Done!"
