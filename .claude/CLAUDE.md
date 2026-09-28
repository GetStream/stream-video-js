@../AGENTS.md

## Linear ticket required for PRs

Before opening a PR, find the Linear ticket for the work (or create one in the right team) and put its ID in the branch name, e.g. `fix/react-123-short-description`. Team keys: `REACT` (React/JS), `RN` (React Native), `VID` (Video).

A PreToolUse hook (`.claude/hooks/require-linear-ticket.sh`) blocks `gh pr create` and MCP PR-creation tools unless the ID appears in the branch name, PR title, or PR body. If `LINEAR_API_KEY` is set, it also checks that the ticket exists.
