#!/bin/bash
set -euo pipefail

PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
CHAT_DIR="$(cd "${1:-$PKG_DIR/../../../chat}" && pwd)"
OUTPUT_DIR="$PKG_DIR/src/gen/coordinator"
SPEC_DIR="$(mktemp -d)"
trap 'rm -rf "$SPEC_DIR"' EXIT

make -C "$CHAT_DIR/tools/openapi" build

(
  cd "$CHAT_DIR"
  ./build/openapi generate-spec \
    -products video -version v2 -clientside -encode-time-as-unix-timestamp \
    -output "$SPEC_DIR/video-clientside-api"
  rm -rf "$OUTPUT_DIR"
  ./build/openapi generate-client \
    --language ts --spec "$SPEC_DIR/video-clientside-api.yaml" --output "$OUTPUT_DIR" \
    --opt response_dates_as_number=true \
    --opt typed_filters=true \
    --opt separate_path_params=true
)

echo "export * from './models';" >"$OUTPUT_DIR/index.ts"

(cd "$PKG_DIR/../.." && yarn lint:gen)
