#!/usr/bin/env bash
# Verify a backport branch against untouched release-v1, from inside a backport worktree.
#
#   bash "$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/.claude/skills/backport-to-release-v1/verify.sh"
#
# Run it from the backport worktree root. The script lives in the main checkout: a worktree
# branched off release-v1 does not contain .claude/skills/.
#
# A worktree under .claude/worktrees/ has no install state of its own. Module lookup walks up to
# the main checkout's root node_modules, whose @stream-io/* links point at the MAIN checkout's
# packages (usually v2), and RN dependencies live in package-local node_modules that the worktree
# lacks. A plain tsc/jest run therefore checks v1 code against v2 packages and reports noise.
#
# This script:
#   1. keeps a baseline worktree of origin/release-v1 at .claude/worktrees/v1-baseline,
#   2. links the main checkout's package-local node_modules into both trees (gitignored),
#   3. builds client + react-bindings dist in both trees (needed by the RN jest runs), after
#      building and linking each tree's own audio-filters-web when the branch touches it,
#   4. typechecks every touched project with every @stream-io/* package mapped to that tree's
#      own sources, and reports only errors the branch adds over the baseline,
#   5. runs client vitest, RN SDK jest and RN dogfood jest against the tree's own packages.
#
# Exit status is non-zero when the branch adds a type error or a test failure.

set -uo pipefail

TREE="$(git rev-parse --show-toplevel)"
ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
BIN="$ROOT/node_modules/.bin"
BASE="$ROOT/.claude/worktrees/v1-baseline"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/v1verify.XXXXXX")"
fail=0

[ "$TREE" != "$ROOT" ] || { echo "Run this from the backport worktree, not the main checkout." >&2; exit 2; }

say() { printf '\n== %s\n' "$*"; }

# 1. baseline worktree at the current release-v1 tip
git fetch -q origin release-v1
if [ -d "$BASE" ]; then
  git -C "$BASE" checkout -q --detach origin/release-v1
else
  git worktree add -q --detach "$BASE" origin/release-v1
fi

# 2. package-local node_modules from the main checkout
link_deps() {
  local tree="$1" d
  for d in "$ROOT"/packages/*/node_modules "$ROOT"/sample-apps/react-native/*/node_modules "$ROOT"/sample-apps/react/*/node_modules; do
    [ -d "$d" ] || continue
    local rel="${d#"$ROOT"/}"
    local dir="$tree/$(dirname "$rel")"
    [ -d "$dir" ] && [ ! -e "$tree/$rel" ] && ln -s "$d" "$tree/$rel"
  done
}
link_deps "$TREE"
link_deps "$BASE"

# Generated, gitignored `src/version.ts` (each package's `copy-version` script). Written for both
# trees before anything runs, so neither the typecheck nor jest sees it in one tree only.
gen_versions() {
  local tree="$1" pj
  for pj in "$tree"/packages/*/package.json; do
    grep -q '"copy-version"' "$pj" || continue
    local dir; dir="$(dirname "$pj")"
    echo "export const version = '$(node -p "require('$pj').version")';" >"$dir/src/version.ts"
  done
}
gen_versions "$TREE"
gen_versions "$BASE"

# 3. dist builds used by the jest runs
build() {
  local tree="$1" pkg
  for pkg in client react-bindings; do
    (cd "$tree/packages/$pkg" && rm -rf dist && NODE_ENV=production "$BIN/rollup" -c >"$TMP/build-$pkg-$(basename "$tree").log" 2>&1) \
      || { echo "build failed: $tree/packages/$pkg (see $TMP)" >&2; return 1; }
  done
}

touched="$(git diff --name-only origin/release-v1...HEAD)"
touches() { printf '%s\n' "$touched" | grep -q "^$1/"; }

# The client imports types from @stream-io/audio-filters-web, which otherwise resolves to the
# main checkout's dist: a v2 build of whatever was last built there, usually stale. When the
# branch touches the package, build each tree's own copy and link it at the tree root, ahead
# of the main checkout's node_modules in the lookup. CI's build:all builds it first anyway.
link_audio_filters() {
  local tree="$1" pkg="$1/packages/audio-filters-web"
  (cd "$pkg" && rm -rf dist && "$BIN/vite" build >"$TMP/build-afw-$(basename "$tree").log" 2>&1 \
    && "$BIN/tsc" >>"$TMP/build-afw-$(basename "$tree").log" 2>&1) \
    || { echo "build failed: $pkg (see $TMP)" >&2; return 1; }
  mkdir -p "$tree/node_modules/@stream-io"
  ln -sfn "$pkg" "$tree/node_modules/@stream-io/audio-filters-web"
}
if touches packages/audio-filters-web; then
  link_audio_filters "$TREE" && link_audio_filters "$BASE" || fail=1
fi

# 4. typecheck deltas
# Writes a tsconfig wrapper that extends <project>/tsconfig.json and maps every workspace package
# in <tree> to its source entry point, keeping the project's own `paths` (made absolute).
mkcfg() {
  local proj="$1" tree="$2" out="$3"
  node - "$proj" "$tree" "$out" "$BIN/tsc" <<'NODE'
const [proj, tree, out, tsc] = process.argv.slice(2);
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const shown = JSON.parse(execFileSync(tsc, ['-p', proj, '--showConfig'], { encoding: 'utf8' }));
const paths = {};
for (const [k, v] of Object.entries(shown.compilerOptions?.paths ?? {})) {
  paths[k] = v.map((p) => (path.isAbsolute(p) ? p : path.resolve(proj, p)));
}
for (const dir of fs.readdirSync(path.join(tree, 'packages'))) {
  const pj = path.join(tree, 'packages', dir, 'package.json');
  if (!fs.existsSync(pj)) continue;
  const { name } = JSON.parse(fs.readFileSync(pj, 'utf8'));
  const entry = ['index.ts', 'src/index.ts', 'src/index.tsx']
    .map((e) => path.join(tree, 'packages', dir, e)).find((e) => fs.existsSync(e));
  if (name && entry) paths[name] = [entry];
}
// rootDir is widened to the tree so the mapped sibling-package sources are allowed in.
fs.writeFileSync(out, JSON.stringify({
  extends: './tsconfig.json',
  compilerOptions: { noEmit: true, rootDir: tree, paths },
}, null, 2));
NODE
}
# The wrapper must sit next to the project's tsconfig.json: TS 6 resolves the default `rootDir`
# and the implicit `include` against the directory of the final config file, so a wrapper
# elsewhere silently checks nothing. It is excluded via info/exclude and deleted after each run.
WRAPPER=tsconfig.v1verify.json
EXCLUDE="$(git rev-parse --path-format=absolute --git-common-dir)/info/exclude"
grep -qxF "$WRAPPER" "$EXCLUDE" 2>/dev/null || echo "$WRAPPER" >>"$EXCLUDE"
# tsc prints paths relative to its cwd, so run it from the tree root: both trees then report
# `packages/...`, and anything still loaded from the main checkout (three levels up) shows up
# as MAIN-CHECKOUT/ instead of masquerading as a tree file.
typecheck() {
  local tree="$1" rel="$2" out="$3" cfg="$1/$2/$WRAPPER"
  mkcfg "$tree/$rel" "$tree" "$cfg"
  (cd "$tree" && "$BIN/tsc" -p "$cfg" 2>&1) | grep -E 'error TS' \
    | sed -E 's#^\.\./\.\./\.\./#MAIN-CHECKOUT/#; s/\([0-9]+,[0-9]+\)//' \
    | sort -u >"$out.errs"
  rm -f "$cfg"
}

projects="$(printf '%s\n' "$touched" | grep -oE '^(packages/[^/]+|sample-apps/react-native/[^/]+|sample-apps/react/[^/]+)' | sort -u)"
say "typecheck (errors the branch adds over release-v1)"
for rel in $projects; do
  [ -f "$TREE/$rel/tsconfig.json" ] || continue
  key="${rel//\//_}"
  typecheck "$BASE" "$rel" "$TMP/base-$key"
  typecheck "$TREE" "$rel" "$TMP/pick-$key"
  new="$(comm -13 "$TMP/base-$key.errs" "$TMP/pick-$key.errs")"
  printf '%-45s baseline %3s / branch %3s\n' "$rel" "$(wc -l <"$TMP/base-$key.errs" | tr -d ' ')" "$(wc -l <"$TMP/pick-$key.errs" | tr -d ' ')"
  # An error in ANOTHER package's file that is itself typechecked here comes from compiling that
  # package's raw sources under this project's config (e.g. the client's global `Navigator`
  # augmentation is not loaded through the RN SDK). That package's own row is authoritative,
  # so report it without failing. Errors in this project's files, or in a package not checked
  # here, still fail.
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    owner="$(printf '%s\n' "$line" | grep -oE '^packages/[^/]+' || true)"
    if [ -n "$owner" ] && [ "$owner" != "$rel" ] && printf '%s\n' "$projects" | grep -qx "$owner"; then
      echo "  CROSS-PACKAGE (see $owner's own row): $line"
    else
      echo "  NEW: $line"; fail=1
    fi
  done <<<"$new"
done

# 5. tests
if touches packages/client; then
  say "client vitest"
  out="$(cd "$TREE/packages/client" && "$BIN/vitest" run 2>&1)"
  printf '%s\n' "$out" | grep -E '^ +(Test Files|Tests) '
  # Files that cannot load without STREAM_SECRET are expected locally; they run in CI.
  bad="$(printf '%s\n' "$out" | grep -E '^ FAIL ' | grep -v ' \[ ' || true)"
  secretless="$(printf '%s\n' "$out" | grep -cE 'secretOrPrivateKey must have a value' || true)"
  [ -z "$bad" ] || { printf '%s\n' "$bad"; fail=1; }
  echo "  files that need STREAM_SECRET (expected locally): $secretless"
fi

if touches packages/audio-filters-web && ls "$TREE"/packages/audio-filters-web/src/__tests__/*.test.ts >/dev/null 2>&1; then
  say "audio-filters-web vitest"
  out="$(cd "$TREE/packages/audio-filters-web" && "$BIN/vitest" run 2>&1)"
  printf '%s\n' "$out" | grep -E '^ +(Test Files|Tests) '
  bad="$(printf '%s\n' "$out" | grep -E '^ FAIL ' || true)"
  [ -z "$bad" ] || { printf '%s\n' "$bad"; fail=1; }
fi

jest_run() {
  local tree="$1" rel="$2" out="$3"
  node - "$tree" "$rel" "$out.config.js" <<'NODE'
const [tree, rel, out] = process.argv.slice(2);
const fs = require('fs'), path = require('path');
const proj = path.join(tree, rel);
const map = {
  '^@stream-io/video-client$': path.join(tree, 'packages/client/dist/index.cjs.js'),
  '^@stream-io/video-react-bindings$': path.join(tree, 'packages/react-bindings/dist/index.cjs.js'),
};
for (const dir of fs.readdirSync(path.join(tree, 'packages'))) {
  const pj = path.join(tree, 'packages', dir, 'package.json');
  if (!fs.existsSync(pj) || !dir.includes('react-native')) continue;
  const { name } = JSON.parse(fs.readFileSync(pj, 'utf8'));
  const entry = path.join(tree, 'packages', dir, 'src/index.ts');
  if (name && fs.existsSync(entry) && path.join(tree, 'packages', dir) !== proj) map[`^${name}$`] = entry;
}
fs.writeFileSync(out, `const base = require(${JSON.stringify(path.join(proj, 'jest.config.js'))});
module.exports = { ...base, rootDir: ${JSON.stringify(proj)},
  moduleNameMapper: { ...base.moduleNameMapper, ...${JSON.stringify(map)} } };\n`);
NODE
  (cd "$tree/$rel" && "$BIN/jest" --ci --config "$out.config.js" 2>&1) \
    | grep -E '^(PASS|FAIL) |^Tests:|^Test Suites:' | sed -E 's/ \([0-9.]+ s\)//' | sort >"$out.txt"
}

jest_projects=""
touches packages/react-native-sdk && jest_projects="packages/react-native-sdk"
for d in $(printf '%s\n' "$projects" | grep '^sample-apps/react-native/'); do
  [ -f "$TREE/$d/jest.config.js" ] && jest_projects="$jest_projects $d"
done
if [ -n "${jest_projects// /}" ]; then
  build "$TREE" && build "$BASE" || fail=1
  for rel in $jest_projects; do
    say "jest $rel"
    key="${rel//\//_}"
    [ -f "$BASE/$rel/jest.config.js" ] && jest_run "$BASE" "$rel" "$TMP/jbase-$key" && echo "baseline: $(grep '^Test' "$TMP/jbase-$key.txt" | tr '\n' ' ')"
    jest_run "$TREE" "$rel" "$TMP/jpick-$key"
    echo "branch:   $(grep '^Test' "$TMP/jpick-$key.txt" | tr '\n' ' ')"
    new="$( [ -f "$TMP/jbase-$key.txt" ] && comm -13 <(grep '^FAIL' "$TMP/jbase-$key.txt") <(grep '^FAIL' "$TMP/jpick-$key.txt") || grep '^FAIL' "$TMP/jpick-$key.txt")"
    [ -z "$new" ] || { printf '%s\n' "$new" | sed 's/^/  NEW: /'; fail=1; }
  done
fi

say "result"
[ "$fail" = 0 ] && echo "no new type errors or test failures" || echo "the branch adds failures (above)"
echo "scratch files: $TMP"
exit "$fail"
