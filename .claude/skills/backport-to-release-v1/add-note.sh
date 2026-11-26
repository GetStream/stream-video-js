#!/usr/bin/env bash
# Add a "Backport note" to a picked commit, just above its "(cherry picked from commit ...)" trailer.
#
#   bash "$ROOT/.claude/skills/backport-to-release-v1/add-note.sh" <commit> <note-file>
#
# Run it from the backport worktree, after the last pick (not while a cherry-pick is in
# progress) and before pushing. <commit> can be any unpushed commit on the branch, not just HEAD:
# the note goes in through a reword fixup and an autosquash rebase, which keep the author, the
# subject and the code of every commit untouched.
#
# <note-file> holds the note itself, starting with "Backport note: " and wrapped like the rest
# of the commit body. Write it to a file first instead of passing it inline, so quoting can't
# mangle it.
#
# Self-contained on purpose: an earlier helper kept in a session scratchpad vanished between
# sessions, and the rewords that relied on it left empty commit messages.

set -euo pipefail

[ $# -eq 2 ] || { echo "usage: add-note.sh <commit> <note-file>" >&2; exit 2; }
commit="$(git rev-parse --verify "$1^{commit}")"
note_file="$2"

die() { echo "add-note: $*" >&2; exit 1; }

[ -s "$note_file" ] || die "note file is missing or empty: $note_file"
head -1 "$note_file" | grep -q '^Backport note: ' || die "the note must start with 'Backport note: '"
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "the working tree has uncommitted changes"
gitdir="$(git rev-parse --git-dir)"
[ ! -e "$gitdir/CHERRY_PICK_HEAD" ] && [ ! -d "$gitdir/sequencer" ] || die "a cherry-pick is in progress; finish it first"
[ ! -d "$gitdir/rebase-merge" ] && [ ! -d "$gitdir/rebase-apply" ] || die "a rebase is in progress"
git merge-base --is-ancestor "$commit" HEAD || die "$commit is not on the current branch"
[ -z "$(git branch -r --contains "$commit")" ] || die "$commit is already pushed; never rewrite pushed commits"

old_msg="$(mktemp)"; new_msg="$(mktemp)"; fixup_msg="$(mktemp)"
trap 'rm -f "$old_msg" "$new_msg" "$fixup_msg"' EXIT
git log -1 --format=%B "$commit" >"$old_msg"

grep -q '^Backport note: ' "$old_msg" && die "$commit already has a backport note"
[ "$(grep -cE '^\(cherry picked from commit [0-9a-f]{40}\)$' "$old_msg")" = 1 ] \
  || die "$commit doesn't have exactly one '(cherry picked from commit ...)' trailer"

# insert the note and a blank line right above the trailer
awk -v nf="$note_file" '
  /^\(cherry picked from commit [0-9a-f]+\)$/ {
    while ((getline line < nf) > 0) print line
    print ""
  }
  { print }
' "$old_msg" >"$new_msg"

subject="$(head -1 "$old_msg")"
[ "$(head -1 "$new_msg")" = "$subject" ] || die "the subject would change; aborting"

# "amend! <subject>" + the full new message: autosquash replaces the target's message with it
{ printf 'amend! %s\n\n' "$subject"; cat "$new_msg"; } >"$fixup_msg"

tree_before="$(git rev-parse 'HEAD^{tree}')"
# --fixup=reword opens an editor for its template; the next command replaces that message, so
# skip the editor rather than block on it (or fail without one). Same for the rebase.
GIT_EDITOR=true git commit -q --allow-empty --fixup="reword:$commit"
git commit -q --amend --allow-empty -F "$fixup_msg"
GIT_EDITOR=true GIT_SEQUENCE_EDITOR=true git rebase -q -i --autosquash "$commit^"

# the rebase must have changed nothing but that one message
[ "$(git rev-parse 'HEAD^{tree}')" = "$tree_before" ] || die "the code changed during the rebase; inspect the branch"
rewritten="$(git log --format=%H --fixed-strings --grep="$subject" "$commit^..HEAD" | tail -1)"
[ -n "$rewritten" ] || die "can't find the rewritten commit"
[ "$(git log -1 --format=%B "$rewritten")" = "$(cat "$new_msg")" ] || die "the rewritten message doesn't match; inspect the branch"

echo "added the note to $(git log -1 --format='%h %an | %s' "$rewritten")"
