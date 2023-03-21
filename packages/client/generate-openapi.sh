#!/bin/bash
set -euo pipefail

PROTOCOL_REPO_DIR="../../../protocol"
SCHEMA_FILE="$PROTOCOL_REPO_DIR/openapi/video-openapi.yaml"
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
  --skip-validate-spec \
  --additional-properties=supportsES6=true \
  --additional-properties=modelPropertyNaming=original \
  --additional-properties=enumPropertyNaming=original \
  --additional-properties=withoutRuntimeChecks=true

# Remove the generated API client, just keep the models
cp -r $TEMP_OUTPUT_DIR/models $OUTPUT_DIR
rm -rf $TEMP_OUTPUT_DIR

yarn prettier --write $OUTPUT_DIR
