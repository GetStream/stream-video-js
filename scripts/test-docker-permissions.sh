#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
export LOCAL_UID=12345 LOCAL_GID=23456
export COMPOSE_PROJECT_NAME="video-permissions-$$"
volume="$COMPOSE_PROJECT_NAME-snapshots"
snapshot_dir=/e2e/sample-apps/react/egress-composite/tests

cleanup() {
  docker compose down --volumes >/dev/null
  docker volume rm "$volume" >/dev/null
}
trap cleanup EXIT

docker volume create "$volume" >/dev/null
docker compose build generate-screenshots
image=$(docker compose config --images)

# A Linux-owned mount reproduces permissions independently of Docker Desktop sharing.
docker run --rm --user 0:0 --entrypoint sh \
  --mount "type=volume,src=$volume,dst=/snapshots" "$image" -ec '
    mkdir -p /snapshots/__screenshots__
    touch /snapshots/__screenshots__/permission-check.png
    chown -R 12345:23456 /snapshots
    chmod 755 /snapshots /snapshots/__screenshots__
    chmod 644 /snapshots/__screenshots__/permission-check.png
  '

docker run --rm --user 1000:1000 --entrypoint sh \
  --mount "type=volume,src=$volume,dst=/snapshots" "$image" -ec '
    test ! -w /snapshots/__screenshots__
    test ! -w /snapshots/__screenshots__/permission-check.png
  '

docker compose run --rm --no-deps --entrypoint sh \
  -v "$volume:$snapshot_dir" generate-screenshots -ec '
    test "$(id -u)" = 12345
    test "$(id -g)" = 23456
    test -w /e2e
    test -w "$HOME"
    yarn workspace @stream-io/egress-composite node -e '\''
      const { chromium } = require("@playwright/test");
      (async () => {
        const browser = await chromium.launch({ headless: true });
        try {
          const page = await browser.newPage();
          await page.setContent("<h1>Snapshot permissions</h1>");
          await page.screenshot({ path: "tests/__screenshots__/permission-check.png" });
          await page.screenshot({ path: "tests/__screenshots__/new-snapshot.png" });
        } finally {
          await browser.close();
        }
      })().catch(error => { console.error(error); process.exit(1); });
    '\''
    test "$(stat -c %u /e2e/sample-apps/react/egress-composite/tests/__screenshots__/permission-check.png)" = 12345
    test "$(stat -c %u /e2e/sample-apps/react/egress-composite/tests/__screenshots__/new-snapshot.png)" = 12345
  '

printf 'Non-root Chromium snapshot creation and overwrite passed.\n'
