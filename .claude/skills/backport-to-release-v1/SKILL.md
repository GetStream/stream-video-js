---
name: backport-to-release-v1
description: Use when a PR merged into `main` carries the `backport-v1` label and has to land on the `release-v1` branch, or when running the weekly v1 backport round in stream-video-js.
---

# Backporting to release-v1

`main` is v2 (npm dist-tag `beta`). `release-v1` is the stable branch that ships to dist-tag
`latest`. PRs merged to `main` and labeled `backport-v1` have to be replayed onto `release-v1`
without losing the original author or the link back to the original PR.

**Core principle: cherry-pick with `-x`, adapt the picked code to the APIs `release-v1` already
has, and merge the PR with Rebase and merge.** Never drag an unbackported refactor onto the
release branch just to make a pick apply.

## Pinned repo facts

Do not re-derive these; they are easy to get wrong.

| Fact                    | Value                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Merge methods           | merge commit **disabled**, squash and rebase both enabled                                                                                                               |
| Squash commit body      | `PR_BODY` (the PR description **replaces** the commit message)                                                                                                          |
| `release-v1` protection | linear history required, no force push, no deletions. **No** required reviews, **no** required status checks                                                            |
| Release automation      | `.github/workflows/version-and-release.yml`, `workflow_dispatch` only. `main` -> `beta`, `release-v1` -> `latest`. Version bumps come from conventional-commit subjects |
| Label                   | `backport-v1` = queued, `backported-v1` = done                                                                                                                          |

## Procedure

### 1. Read the queue

```bash
gh pr list --label backport-v1 --state merged --json number,title,author,mergeCommit,mergedAt \
  --jq 'sort_by(.mergedAt)[] | "\(.mergeCommit.oid[0:9])  #\(.number)  \(.title)"'
```

Only merged PRs can be picked. Pick in merge order so the changelog reads sanely.

Two checks per entry before you pick it: how it was merged, and whether it already landed.

**How it was merged.** Decide from the commit on `main`, never from the PR's commit count. A
squash-merged PR still reports every commit of its branch (a 25-commit PR squashes to one), so
`commits > 1` says nothing about the merge method.

```bash
sha=$(gh pr view <original-pr> --json mergeCommit --jq .mergeCommit.oid)
git log -1 --format=%s "$sha"    # ends in "(#<original-pr>)" = squash-merged
```

- **Squash-merged** (the normal case): `$sha` is the whole PR. Pick that one commit.
- **Rebase-merged** (subject has no `(#N)` suffix, GitHub does not add one): the PR landed as
  several rewritten commits ending at `$sha`. `gh pr view --json commits` lists the PR _branch_
  SHAs, not the ones on `main`, so do not pick those. `main` is linear, so take the last N
  commits of `main` ending at `$sha`, check their subjects against the PR's commits, and pick
  them in **one** invocation:

  ```bash
  n=$(gh pr view <original-pr> --json commits --jq '.commits | length')
  git log --reverse --format='%h %s' -n "$n" "$sha"     # must match the PR's commits
  git cherry-pick -x $(git rev-list --reverse -n "$n" "$sha")
  ```

  One `git cherry-pick` call lets Git's sequencer track the remaining commits, so after a
  conflict `git cherry-pick --continue` resumes the rest. Piping SHAs through `xargs -n1` runs
  separate picks: the ones after a conflict fail and nothing remembers them.

**Whether it already landed.**

```bash
git log --oneline --grep '(#<original-pr>)' origin/release-v1   # squash: empty = not yet backported
```

For a rebase-merged PR the subjects carry no `(#N)`, so check **every** landed SHA for a
`cherry picked from commit <sha>` trailer on `release-v1`. Some present and some missing means
an earlier round was partial: finish it, do not count it as done.

### 2. Branch off `release-v1`

The main checkout usually has unrelated work in progress, so use a worktree.

```bash
git fetch origin
git worktree add .claude/worktrees/backport-v1 -b backport/v1-$(date +%F) origin/release-v1
```

A worktree here has no yarn install state of its own. Module lookup walks up to the main
checkout's root `node_modules`, whose `@stream-io/*` links point at the **main checkout's**
packages, usually v2, and the RN dependencies live in package-local `node_modules` the worktree
lacks. So a plain `tsc` or `jest` run checks v1 code against v2 packages. Step 5's script sets
up a correct environment. For one-off commands, use the main checkout's binaries:

```bash
ROOT="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
BIN="$ROOT/node_modules/.bin"
```

Never run a full `yarn install` in the worktree: the verify script links the main checkout's
package-local `node_modules` in, and an install would write through those links into the main
checkout. `yarn install --mode=update-lockfile` (step 4) does not link, and is safe.

(Never write a dollar sign followed by a digit anywhere in this skill, including awk field
references and shell positional parameters: the skill loader treats it as an argument slot and
strips the dollar sign, so the command reaches the reader broken.)

If a branch for today already exists, suffix it (`backport/v1-$(date +%F)-b`). Remove the
worktree when the round is done: `git worktree remove .claude/worktrees/backport-v1`.

### 3. Cherry-pick

```bash
git cherry-pick -x <squash-sha>
```

`-x` is what satisfies both requirements at once:

- cherry-pick preserves the **author** (name and email), so GitHub credits the original author.
  Only the committer becomes you.
- `-x` appends `(cherry picked from commit <sha>)`, which GitHub renders as a link, and the
  squash subject already ends in `(#1234)`, which auto-links the original PR.

Never reword the subject: the release job reads the conventional-commit prefix.

### 4. Resolve conflicts by adapting, not by importing

Conflicts are almost always one missing refactor on `release-v1`. Find it before resolving:

```bash
git log origin/release-v1..origin/main --oneline -- <conflicted-file>
```

If a main-only commit renamed or moved an API, **rewrite the picked code to the old API**. Do not
cherry-pick the refactor too unless it is itself labeled `backport-v1`. Record what you adapted
in a "Backport note" in the commit body, above the `(cherry picked from ...)` trailer.

Add the notes once every pick is in, before pushing, with `add-note.sh` (next to this file). It
works on any unpushed commit on the branch, not only HEAD, so a pick that a multi-SHA
`git cherry-pick` already committed and moved past is fine. Write each note to a file first, in
its own command, starting with `Backport note: ` and wrapped like a commit body (`SCRATCH` is
any scratch directory; the note file is only read while the script runs):

```bash
cat > "$SCRATCH/note-2528.txt" <<'EOF'
Backport note: adapted to release-v1. <what differs from main, and why>
EOF
bash "$ROOT/.claude/skills/backport-to-release-v1/add-note.sh" <commit> "$SCRATCH/note-2528.txt"
```

The script refuses a pushed commit, a dirty tree, a cherry-pick or rebase in progress, a commit
that already has a note, and a commit without exactly one trailer. It goes through a reword fixup
and an autosquash rebase, then checks that the code and every other message are unchanged, so
the author, the subject and the trailer all survive. Never hand-roll this with `--amend` or a
reword helper kept in a scratchpad: a scratchpad helper vanished between sessions once, and the
rewords that relied on it wrote empty commit messages. Never edit the subject line: the release
job parses it.

**Resolve to "v1's file plus this PR's own change", not to either side.** A conflict hunk's
incoming side carries `main`-only context (imports, i18n keys, renamed APIs) along with the PR's
change, and in JSX Git can align the hunk on the inner lines of two different elements. Taking
"theirs" wholesale has duplicated a `<Button>` and pulled in `main`-only imports. Read what the PR
itself changed and re-apply only that onto v1's version:

```bash
git show --format='' <squash-sha> -- <file>          # the PR's own change
diff <(git show origin/release-v1:<file>) <file>     # after resolving: must equal the above
```

Take `main`'s version of a file only when the PR rewrote most of it, and say so in the note.

**Renames must cover the whole tree, tests included.** The client `tsconfig.json` excludes
`__tests__`, so `tsc` misses an old name in a test file that the pick added, and vitest only
fails at runtime (`ReferenceError: VideoApi is not defined`). After the picks:

```bash
git grep -nwE 'ClientState|clientState|VideoApi|ApiClient|TimestampNS|dateToNs' \
  -- packages sample-apps ':!packages/client/src/gen'   # must be empty on v1
```

Use `-w`, never `\b`: `git grep -E` treats `\b` as a plain `b` on macOS, so a `\b(...)\b`
pattern silently matches nothing. That let a test building its `Call` with `videoApi` and
`clientState` through (#2609); on v1 a test builds it with
`clientStore: new StreamVideoWriteableStateStore()` and no `videoApi`.

**Known `main`-only refactors** (none is labeled for backport; adapt to v1 instead):

| On `main`                                                                         | On `release-v1`                                                                                                           |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ClientState` / `clientState` (#2422)                                             | `StreamVideoWriteableStateStore` / `clientStore`                                                                          |
| `client.state` is the one store (#2422)                                           | two stores: pass `client['writeableStateStore']` where a store is handed over; reading `client.state.calls` works on both |
| `setCurrentValue(...)` module import                                              | `this.setCurrentValue(...)` class field in `CallState`                                                                    |
| `useI18n` from `../../../i18n` (#2436)                                            | `useI18n` from `@stream-io/video-react-bindings`                                                                          |
| dogfood `t(key, fallback, options)` (#2436)                                       | dogfood `hooks/useAppI18n.ts` adapts it to v1's `t(key, options)`                                                         |
| `this.api.*` OpenAPI client (#2454); `doAxiosRequest` resolves the Axios response | `this.streamClient.post/get`; `doAxiosRequest` resolves the body: stub it with the body, not `{ data }`                   |
| timestamps are `TimestampNS`, built with `dateToNs` (#2454)                       | ISO date strings (`'2025-08-14T14:49:00Z'`)                                                                               |

Add a row whenever a round finds a new one.

**Lockfiles.** Never merge `yarn.lock`. Start from v1's and let Yarn resolve the pick's
`package.json` changes:

```bash
git checkout --ours yarn.lock && yarn install --mode=update-lockfile
```

The same goes for `package.json` conflicts: take v1's file and re-apply the PR's own lines,
because the surrounding ranges (sibling peers, versions) differ between the branches.
`Podfile.lock` hunks apply without conflicts but carry `main`'s pod checksums. CI's
`pod install` rewrites the file, so leave it as picked.

If something has to be _removed_ from a pick (a stray unrelated file swept into the original
squash, for example), add a separate follow-up commit instead of rewriting the picked one, so the
pick stays faithful to the original.

**When to give up on a pick.** If adapting means rewriting the change rather than renaming into
the old API, `git cherry-pick --abort` and leave it out of the round. Keep `backport-v1` on the
original PR so it stays queued, and comment there saying what blocks it and which main-only
commit is the cause. A hand-written v1 patch is a normal outcome; a half-adapted pick is not.

A pick that comes out empty (the change reached `release-v1` some other way) is a dedupe miss:
`git cherry-pick --skip` it and move on.

### 5. Verify. A clean cherry-pick is not evidence

**Always typecheck, even when nothing conflicted.** Git merges by text, so a hunk can apply with
no conflict and still reference an API that `release-v1` does not have.

Run `verify.sh` from the backport worktree root. It lives in the main checkout, because a
worktree off `release-v1` has no `.claude/skills/`:

```bash
bash "$ROOT/.claude/skills/backport-to-release-v1/verify.sh"
```

It keeps a baseline worktree of `origin/release-v1`. For every touched project it typechecks
with each `@stream-io/*` package mapped to that tree's own sources, then runs client `vitest` and
the RN SDK and dogfood `jest` suites against that tree's built v1 packages. It reports only
errors and failures the branch adds over the baseline, and exits non-zero if there are any.
The baseline error counts are environment noise, identical in both trees. Takes about a minute.

When the branch touches `packages/audio-filters-web`, the script also builds each tree's own copy
of it, links it at the tree root (`node_modules/@stream-io/audio-filters-web`, gitignored), and
runs its `vitest` suite. Without that, the client's rollup build resolves the package to the main
checkout's `dist`, a stale v2 build, and fails on any type the branch added there (as with
`INoiseCancellation.engine` in #2589); every jest run after it then fails for lack of a client
`dist`. CI is not affected: `build:all` builds `audio-filters-web` before the client.

Then lint and format, from the worktree root:

```bash
FILES=$(git diff --name-only --diff-filter=ACM origin/release-v1...HEAD | grep -E '\.(ts|tsx)$' || true)
[ -n "$FILES" ] && "$BIN/prettier" --check ${=FILES} && "$BIN/eslint" ${=FILES} --max-warnings 0
```

Note the `${=FILES}` splitting: this is zsh, which does not word-split unquoted variables. CI
only Prettier-checks `.ts` and `.tsx`, and some v1 Markdown already fails Prettier.

**Expected local test result:** all client tests pass, and three files fail at import with
`secretOrPrivateKey must have a value`: `Call.test.ts`, `StreamVideoClient.test.ts` and
`StreamVideoClient.ringing.test.ts`. They need `STREAM_SECRET`, and run on the backport PR's CI
(step 7). Any other failure, or one with a different message, is yours.

Native code (Kotlin, Swift, Objective-C) is only exercised by the PR's Android and iOS CI builds.
Say so in the PR body.

Prove the adaptation was cosmetic by diffing against `main`:

```bash
diff <(git show HEAD:<file>) <(git show origin/main:<file>)
```

Everything left over should be the rename you made plus pre-existing `release-v1` content.

### 6. Open the PR

```bash
git push -u origin HEAD
gh pr create --base release-v1 --title "chore: backport #<a> and #<b> to v1" --body-file <file>
```

Body follows `.github/pull_request_template.md`, lists each backported PR, explains any
adaptation, and states that the PR must be rebase-merged. Do not hard-wrap the body.

**A Linear ticket is required.** A PreToolUse hook blocks `gh pr create` unless a `REACT-`,
`RN-` or `VID-` ID is in the title or body. Create one per round in **React/JS**, titled like
`Backport to v1: #<a>, #<b>`, and put `🎫 Ticket: https://linear.app/stream/issue/REACT-<n>` in
the body.

- Write the body file in its **own** command before `gh pr create`. The hook runs before the
  command and reads `--body-file` from disk, so a file created in the same command does not
  exist yet when it checks.
- In the Linear description, link PRs by full URL
  (`[GetStream/stream-video-js#2441](https://github.com/GetStream/stream-video-js/pull/2441)`).
  Linear resolves a bare `#2453` to whichever repo it finds first, and has linked another
  repo's PR.

### 7. Wait for the PR's checks, then merge with **Rebase and merge**

**The PR's own checks are the gate.** The `Test` workflow runs on every pull request, with
`STREAM_SECRET`: lint, unit and integration tests, and builds. The Android and iOS builds are a
separate workflow, "React Native Dogfood Release" (`Build Android`, `Build iOS`), and the only
check that compiles native code (Kotlin, Swift, Objective-C). They start a few minutes after the
others and take longer, so they are easy to merge past while still queued. Together this is the
full validation, and the only time it runs before the code is on `release-v1`.
`release-v1` has **no required status checks**, so the merge button is live while checks are
still running or already red. Nothing stops a red merge except you:

```bash
gh pr checks <backport-pr> --watch --fail-fast
```

Merge only when every check has passed or been skipped, including `Build Android` and
`Build iOS` when the round touches native code. Merging early also triggers the sample-app
deploys from the `release-v1` push before anything has been validated.

Rebase replays each commit verbatim: author preserved, trailers and `(#1234)` references intact,
linear history satisfied.

**Squash destroys all of it.** This repo sets `squash_merge_commit_message = PR_BODY`, so
squashing collapses every backport into one commit and overwrites the message with the PR
description, dropping the cherry-pick trailers and re-attributing authorship.

**What rebase-merge changes, so you do not misread it.** The commit's **author** (name, email and
author date) is preserved, and so are the trailers. The **committer** becomes whoever clicked the
button, and GitHub's commit list leads with the committer, so a landed backport reads as "you
committed" even though the author header is untouched. That is correct and expected. Verify the
header rather than trusting the UI:

```bash
git fetch origin && git log origin/release-v1 -3 --format='%h  A:%an <%ae>  C:%cn  %s'
git log -1 --format=%B <landed-sha> | grep 'cherry picked from'
```

Compare `A:` against the original commit on `main`. When the original author is also the person
running the round, the two names match and nothing looks preserved - that is not a failure.

Check `rebaseable` before relying on the button:

```bash
gh api repos/GetStream/stream-video-js/pulls/<backport-pr> --jq '{mergeable, rebaseable}'
```

If `release-v1` advanced since you branched, GitHub replays onto the new tip. On conflict the
button greys out. **Do not force-push the rebased branch** - force pushing is forbidden here.
Instead branch again from the new `release-v1` tip (`backport/v1-<date>-b`), redo the picks,
open a fresh PR, and close the stale one referencing the replacement.

If one pick in a batch fails verification, drop it and ship the others rather than holding the
round. Before the branch is pushed, `git rebase --onto` is fine; once it is pushed, dropping a
commit would need a force push, so re-pick the good commits onto a fresh dated branch instead.
Label only the originals that actually landed.

### 8. Close the loop

Label the **original** PR, not the backport PR, and only after the backport has actually merged,
otherwise the queue reports work as done that never landed:

```bash
gh pr edit <original-pr> --add-label backported-v1 --remove-label backport-v1
gh pr view <original-pr> --json labels --jq '[.labels[].name] | join(", ")'
```

Verify with `gh pr view`, not `gh pr list`: the search index lags by minutes and will still show
the old label.

Then remove the worktree (unlink the main checkout's `node_modules` links first, so nothing is
deleted through them) and mark the round's Linear ticket **Done**, attaching the backport PR:

```bash
find .claude/worktrees/backport-v1 -maxdepth 4 -name node_modules -type l -delete
git worktree remove --force .claude/worktrees/backport-v1
git branch -D backport/v1-<date>
```

### 9. Confirm CI on the merged tip, then release

The PR checks in step 7 validated the branch. The push to `release-v1` runs `Test` again, this
time on the rebased commits as they landed. If `release-v1` moved while the PR was open, this is
the first run on that combination. It is the last check before publishing, not a replacement for
step 7:

```bash
gh run list --branch release-v1 --limit 10 \
  --json workflowName,status,conclusion,headSha \
  --jq '.[] | select(.headSha|startswith("<merged-sha>")) | "\(.status) \(.conclusion) \(.workflowName)"'
```

`gh run list --commit <sha>` does not filter these runs - it returns nothing, which reads as
"no pending runs" and will tell you CI is done when it has not started. Filter on `headSha` in
`jq`, as above.

Only once **Test** reports `success`: `workflow_dispatch` the **Version and release** workflow on
`release-v1`. It publishes to dist-tag `latest`, so confirm with the release owner rather than
firing it automatically at the end of a round.

## Common mistakes

| Mistake                                              | Consequence                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Squash-merging the backport PR                       | Authorship and cherry-pick trailers destroyed, batch flattened to one commit |
| Trusting a conflict-free pick                        | Text-level merge can produce non-compiling code. Only `tsc` catches it       |
| Cherry-picking the refactor that caused the conflict | Unreviewed, unlabeled changes land on the branch that ships to `latest`      |
| `yarn test:ci:client` inside the worktree            | No install state there. Use the parent `node_modules/.bin`                   |
| Labeling `backported-v1` before the PR merges        | Queue shows work as done that never landed                                   |
| Labeling the backport PR instead of the original     | Original stays in the queue and gets backported twice                        |
| Rewording the commit subject                         | Release automation reads the conventional-commit prefix for the version bump |
| Picking `mergeCommit.oid` for a rebase-merged PR     | Silently backports only the last commit of the PR                            |
| Reading `commits > 1` as "rebase-merged"             | Squashed PRs report all branch commits; you would pick the whole branch      |
| `xargs -n1 git cherry-pick` over a range             | Picks after a conflict are lost; `--continue` does not resume them           |
| Merging before `gh pr checks` is green               | No required checks on `release-v1`: a red or unfinished PR merges fine       |
| Taking "theirs" for a whole conflict hunk            | Drags in `main`-only context; in JSX it has duplicated elements              |
| Renaming only the files that conflicted              | Old names survive in added test files; `tsc` excludes `__tests__`            |
| Hand-merging `yarn.lock`                             | Inconsistent lockfile; start from v1's and `--mode=update-lockfile`          |
| Plain `tsc` / `jest` inside the worktree             | Resolves `@stream-io/*` to the main checkout's v2 packages; use `verify.sh`  |
| Force-pushing a rebased backport branch              | Forbidden here. Open a fresh dated branch and a new PR instead               |
