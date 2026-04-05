# Ralph

AI coding agent that reads a PRD (GitHub issue), picks the next task, implements it, commits, and tracks progress.

## Usage

```bash
# One task at a time (interactive, you review each step)
pnpm ralph 1

# Automated loop (5 iterations, walks away)
pnpm ralph:loop 1 5
```

The number is the GitHub issue number that contains the PRD.

## How it works

1. Reads the PRD from the current repo's GitHub issues
2. Reads the progress file at `ralph/progress/<number>.md`
3. Picks the next incomplete task
4. Implements it, runs checks, commits
5. Updates the progress file
6. Stops (or repeats if using `loop`)

## Files

```
ralph/
  once.sh              # Single iteration script
  loop.sh              # Multi-iteration script
  progress/
    1.md               # Progress for PRD #1 (auto-created)
```

Progress files are created automatically on first run.

## Tips

- Start with `pnpm ralph <issue>` to see what it does before looping
- Review commits after each run
- The loop stops early if the PRD is complete
- Keep PRDs specific — Ralph works best with clear, isolated tasks
