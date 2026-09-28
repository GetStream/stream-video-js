@../AGENTS.md

## Linear ticket required for PRs

Before opening a PR, find the Linear ticket for the work (or create one in the right team) and put its ID in the PR title or PR body, e.g. the template's `🎫 Ticket: https://linear.app/stream/issue/REACT-123` line. Team keys: `REACT` (React/JS), `RN` (React Native), `VID` (Video).

A PreToolUse hook (`.claude/hooks/require-linear-ticket.sh`) blocks `gh pr create` and MCP PR-creation tools unless the ID appears in the PR title or PR body. The branch name does not count. If `LINEAR_API_KEY` is set, it also checks that the ticket exists.
