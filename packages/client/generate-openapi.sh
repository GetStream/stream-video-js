#!/bin/bash
set -euo pipefail

CHAT_REPO_ROOT_DIR="../../../chat"
SCHEMA_FILE="$CHAT_REPO_ROOT_DIR/releases/video-openapi.yaml"
OUTPUT_DIR="./src/gen/coordinator"
TEMP_OUTPUT_DIR="./src/gen/openapi-temp"

# Generate the Coordinator OpenAPI schema
make -C $CHAT_REPO_ROOT_DIR video-openapi-yaml

# Clean previous output
rm -rf $TEMP_OUTPUT_DIR
rm -rf $OUTPUT_DIR

# NOTE: https://openapi-generator.tech/docs/generators/typescript-fetch/
# Generate the Coordinator API models
yarn openapi-generator-cli generate \
  -i "$SCHEMA_FILE" \
  -g typescript-fetch \
  -o "$TEMP_OUTPUT_DIR" \
  --skip-validate-spec \
  --additional-properties=supportsES6=true \
  --additional-properties=modelPropertyNaming=original \
  --additional-properties=enumPropertyNaming=original \
  --additional-properties=withoutRuntimeChecks=true

# Remove the generated API client, just keep the models
cp -r $TEMP_OUTPUT_DIR/models $OUTPUT_DIR
rm -rf $TEMP_OUTPUT_DIR

yarn prettier --write $OUTPUT_DIR
