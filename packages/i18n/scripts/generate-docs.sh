#!/bin/bash

typedoc --options typedoc.json ./index.ts
npx replace-in-file '.md' '' 'temp-docs/**'
npx replace-in-file 'Class: StreamI18n' 'StreamI18n' 'temp-docs/**'
npx replace-in-file 'classes/StreamI18n' 'StreamI18n.md' 'temp-docs/**'
mkdir -p generated-docs
cp temp-docs/classes/StreamI18n.md generated-docs/02-StreamI18n.md
cp temp-docs/modules.md generated-docs/03-reference-i18n.md
rm -rf temp-docs
