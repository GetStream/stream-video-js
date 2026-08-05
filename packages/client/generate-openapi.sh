#!/bin/bash
set -euo pipefail


PKG_DIR="$(cd "$(dirname "$0")" && pwd)"
CHAT_DIR="$(cd "${1:-$PKG_DIR/../../../chat}" && pwd)"
SPEC_FILE="$CHAT_DIR/releases/v2/video-clientside-api.yaml"
OUT="$PKG_DIR/src/gen/coordinator"

KEEP="video"
OPTS=(--opt date_type=string)

[ -x "$CHAT_DIR/build/chat-manager" ] || make -C "$CHAT_DIR/projects/chat-manager" build
[ -f "$SPEC_FILE" ] || make -C "$CHAT_DIR" openapi >/dev/null

rm -rf "$OUT" && mkdir -p "$OUT"
"$CHAT_DIR/build/chat-manager" openapi generate-client \
  --language ts --spec "$SPEC_FILE" --output "$OUT" "${OPTS[@]}"

echo "export * from './models';" > "$OUT/index.ts"

yarn prettier --log-level=warn --write "$OUT" >/dev/null 2>&1 || true
