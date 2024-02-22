#!/bin/bash
set -euo pipefail

FROM_REPO=$1;

if  [ "$FROM_REPO" == 'chat' ]; then
  PROTOCOL_REPO_DIR="../../../chat"
else
  PROTOCOL_REPO_DIR="../../../protocol"
fi
if  [ "$FROM_REPO" == 'chat' ]; then
  SCHEMA_FILE="$PROTOCOL_REPO_DIR/releases/video-openapi.yaml"
elif [ "$FROM_REPO" == 'protocol' ]; then
  SCHEMA_FILE="$PROTOCOL_REPO_DIR/openapi/video-openapi.yaml"
else
  SCHEMA_FILE=$FROM_REPO
fi

if  [ "$FROM_REPO" == 'chat' ]; then
  # Generate the Coordinator OpenAPI schema
  make -C $PROTOCOL_REPO_DIR video-openapi
fi

OUTPUT_DIR="./src/gen/coordinator"
TEMP_OUTPUT_DIR="./src/gen/openapi-temp"

# Clean previous output
rm -rf $TEMP_OUTPUT_DIR
rm -rf $OUTPUT_DIR

# NOTE: https://openapi-generator.tech/docs/generators/typescript-fetch/
# Generate the Coordinator API models
yarn openapi-generator-cli generate \
  -i "$SCHEMA_FILE" \
  -g typescript-fetch \
  -o "$TEMP_OUTPUT_DIR" \
  --additional-properties=supportsES6=true \
  --additional-properties=modelPropertyNaming=original \
  --additional-properties=enumPropertyNaming=UPPERCASE \
  --additional-properties=withoutRuntimeChecks=true

# Remove the generated API client, just keep the models
cp -r $TEMP_OUTPUT_DIR/models $OUTPUT_DIR
rm -rf $TEMP_OUTPUT_DIR

yarn prettier --write $OUTPUT_DIR
