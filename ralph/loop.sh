#!/bin/bash
# Run Ralph in a loop for a PRD
# Usage: ./ralph/loop.sh <issue-number> [iterations]
# Example: ./ralph/loop.sh 1 5

set -e

ISSUE="${1:?Usage: $0 <issue-number> [iterations]}"
ITERATIONS="${2:-5}"
REPO="${RALPH_REPO:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
PROGRESS="ralph/progress/${ISSUE}.md"

# Create progress file if it doesn't exist
mkdir -p ralph/progress
if [ ! -f "$PROGRESS" ]; then
  echo "# PRD #${ISSUE} — Progress" > "$PROGRESS"
  echo "" >> "$PROGRESS"
  echo "Tracking: https://github.com/${REPO}/issues/${ISSUE}" >> "$PROGRESS"
  echo "" >> "$PROGRESS"
fi

echo "Starting Ralph loop: PRD #${ISSUE}, ${ITERATIONS} iterations"
echo ""

for ((i=1; i<=ITERATIONS; i++)); do
  echo "=== Iteration ${i}/${ITERATIONS} ==="

  result=$(claude -p --dangerously-skip-permissions --effort max \
    "@${PROGRESS} \
    1. Read the PRD: https://github.com/${REPO}/issues/${ISSUE} \
    2. Read the progress file: ${PROGRESS} \
    3. Find the next incomplete task and implement it. \
    4. Run checks (lint, build, docker build — whatever applies to the task). \
    5. Commit your changes. \
    6. Update ${PROGRESS} with what you did. \
    7. If you completed a GitHub issue, close it: gh issue close <number> --repo ${REPO} --reason completed \
    8. If the entire PRD is done, close the PRD issue too and output <promise>COMPLETE</promise>. \
    ONLY DO ONE TASK AT A TIME.")

  echo "$result"
  echo ""

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD #${ISSUE} complete after ${i} iterations."
    exit 0
  fi
done

echo "Finished ${ITERATIONS} iterations for PRD #${ISSUE}."
