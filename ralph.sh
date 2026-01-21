#!/bin/bash
set -e

# Defaults
MAX=10
SLEEP=2
PROMPT="PRD.md"

# Parse named arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --max)
            MAX="$2"
            shift 2
            ;;
        --sleep)
            SLEEP="$2"
            shift 2
            ;;
        --prompt)
            PROMPT="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: ./ralph.sh [--max N] [--sleep N] [--prompt FILE]"
            exit 1
            ;;
    esac
done

if [[ ! -f "$PROMPT" ]]; then
    echo "Error: Prompt file '$PROMPT' not found"
    exit 1
fi

echo "Starting Ralph - Max $MAX iterations, Prompt: $PROMPT"
echo ""

RETRIES=3
RETRY_DELAY=5

for ((i=1; i<=$MAX; i++)); do
    echo "==========================================="
    echo "  Iteration $i of $MAX"
    echo "==========================================="

    # Retry loop for transient API errors
    for ((attempt=1; attempt<=$RETRIES; attempt++)); do
        set +e  # Disable exit-on-error for claude call
        result=$(claude --dangerously-skip-permissions -p "You are Ralph, an autonomous coding agent. Do exactly ONE task per iteration.

## Steps

1. Read $PROMPT and find the first task that is NOT complete (marked [ ]).
2. Read progress.txt - check the Learnings section first for patterns from previous iterations.
3. Implement that ONE task only.
4. Run iOS build to verify it builds successfully.

## Critical: Only Complete If Build Succeeds

- If build succeeds:
  - Update $PROMPT to mark the task complete (change [ ] to [x])
  - Commit your changes with message: feat: [task description]
  - Append what worked to progress.txt

- If tests FAIL:
  - Do NOT mark the task complete
  - Do NOT commit broken code
  - Append what went wrong to progress.txt (so next iteration can learn)

## Progress Notes Format

Append to progress.txt using this format:

## Iteration [N] - [Task Name]
- What was implemented
- Files changed
- Learnings for future iterations:
  - Patterns discovered
  - Gotchas encountered
  - Useful context
---

## Update AGENTS.md (If Applicable)

If you discover a reusable pattern that future work should know about:
- Check if AGENTS.md exists in the project root
- Add patterns like: 'This codebase uses X for Y' or 'Always do Z when changing W'
- Only add genuinely reusable knowledge, not task-specific details

## End Condition

After completing your task, check $PROMPT:
- If ALL tasks are [x], output exactly: <promise>COMPLETE</promise>
- If tasks remain [ ], just end your response (next iteration will continue)" 2>&1)
        exit_code=$?
        set -e  # Re-enable exit-on-error

        [[ $exit_code -eq 0 ]] && break

        echo "  ⚠ Claude CLI failed (attempt $attempt/$RETRIES): exit code $exit_code"
        if [[ $attempt -lt $RETRIES ]]; then
            echo "  Retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
    done

    # Check if all retries failed
    if [[ $attempt -gt $RETRIES ]]; then
        echo "  ✗ All retries failed. Continuing to next iteration..."
        echo ""
        sleep $SLEEP
        continue
    fi

    echo "$result"
    echo ""

    if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
        echo "==========================================="
        echo "  All tasks complete after $i iterations!"
        echo "==========================================="
        exit 0
    fi

    sleep $SLEEP
done

echo "==========================================="
echo "  Reached max iterations ($MAX)"
echo "==========================================="
exit 1
