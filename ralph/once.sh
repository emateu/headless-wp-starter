#!/bin/bash
# Run one Ralph iteration for a PRD
# Usage: ./ralph/once.sh <issue-number>
# Example: ./ralph/once.sh 1

set -e

ISSUE="${1:?Usage: $0 <issue-number>}"
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

claude --dangerously-skip-permissions --effort max \
  "@${PROGRESS} \
  1. Read the PRD: https://github.com/${REPO}/issues/${ISSUE} \
  2. Read the progress file: ${PROGRESS} \
  3. Find the next incomplete task and implement it. \
  4. Run checks (lint, build, docker build — whatever applies to the task). \
  5. Commit your changes. \
  6. Update ${PROGRESS} with what you did. \
  7. If you completed a GitHub issue, close it: gh issue close <number> --repo ${REPO} --reason completed \
  ONLY DO ONE TASK AT A TIME."
