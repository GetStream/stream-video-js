#!/bin/bash
set -euo pipefail

# Generates the coordinator client with the in-house `chat-manager` generator,
# the same one stream-chat-js and stream-feeds-js use.
#
# Unlike those two, the spec is built here rather than read from
# releases/v2/*.yaml, so that `-products video` can exclude the `common`
# operations the SDK does not use. See ai-docs/openapi-v2-migration-plan.md for
# why, and for what each --opt buys.
#
# The output is committed, so CI never needs the chat-manager binary. It is also
# wiped on every run: hand-written types belong in src/gen/shims.ts, which sits
# beside the wiped directory, not inside it.
#
# Usage: ./generate-openapi.sh [path-to-chat-repo]   (default: ../../../chat)

PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
CHAT_DIR="$(cd "${1:-$PKG_DIR/../../../chat}" && pwd)"
OUTPUT_DIR="$PKG_DIR/src/gen/coordinator"
SPEC_DIR="$(mktemp -d)"
trap 'rm -rf "$SPEC_DIR"' EXIT

rm -rf "$OUTPUT_DIR"

[ -x "$CHAT_DIR/build/chat-manager" ] || make -C "$CHAT_DIR/projects/chat-manager" build

(
  cd "$CHAT_DIR"
  ./build/chat-manager openapi generate-spec \
    -products video -version v2 -clientside -encode-time-as-unix-timestamp \
    -output "$SPEC_DIR/video-clientside-api"
  ./build/chat-manager openapi generate-client \
    --language ts --spec "$SPEC_DIR/video-clientside-api.yaml" --output "$OUTPUT_DIR" \
    --opt response_dates_as_number=true \
    --opt typed_filters=true \
    --opt separate_params=true
)

echo "export * from './models';" >"$OUTPUT_DIR/index.ts"

(cd "$PKG_DIR/../.." && yarn lint:gen)
