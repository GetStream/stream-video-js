#!/bin/bash

CLASS_FILE_ID=02-streami18n-class;
REFERENCE_FILE_ID=03-i18n-reference;

typedoc --options typedoc.json ./index.ts

find temp-docs -type f -name "*.md" -exec sed -i ".bak" "s_classes/__g" {} \;
find temp-docs -type f -name "*.md" -exec sed -i ".bak" "s_StreamI18n.md_../${CLASS_FILE_ID}_g" {} \;
find temp-docs -type f -name "*.md" -exec sed -i ".bak" "s_../modules.md_../${REFERENCE_FILE_ID}_g" {} \;
find temp-docs -type f -name "*.md" -exec sed -i ".bak" "s_modules.md_./_g" {} \;
find temp-docs -type f -name "*.md" -exec sed -i ".bak" "s/.md//g" {} \;
sed -i ".bak" "s/Class: StreamI18n/StreamI18n/" "temp-docs/classes/StreamI18n.md";
sed -i ".bak" "1,/# StreamI18n/ s/# StreamI18n//" "temp-docs/classes/StreamI18n.md";
sed -i ".bak" "1,/# @stream-io\/i18n/ s/# @stream-io\/i18n//" "temp-docs/modules.md";

mkdir -p generated-docs
touch generated-docs/02-StreamI18n.mdx;
echo "---
id: $CLASS_FILE_ID
title: Class StreamI18n
---
" > generated-docs/02-StreamI18n.mdx;
cat temp-docs/classes/StreamI18n.md >> generated-docs/02-StreamI18n.mdx;

touch generated-docs/03-reference-i18n.mdx;
echo "---
id: $REFERENCE_FILE_ID
title: Reference
---
" > generated-docs/03-reference-i18n.mdx;
cat temp-docs/modules.md >> generated-docs/03-reference-i18n.mdx;

rm -rf temp-docs
