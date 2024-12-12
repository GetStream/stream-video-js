#!/usr/bin/env bash

npx tsc src/timers/worker.ts \
  --skipLibCheck \
  --removeComments \
  --module preserve \
  --target ES2020 \
  --lib ES2020,WebWorker \
  --outDir worker-dist

cat <<EOF >src/timers/worker.build.ts
export const timerWorker = {
  src: \`$(<worker-dist/worker.js)\`,
};
EOF

rm -r worker-dist
