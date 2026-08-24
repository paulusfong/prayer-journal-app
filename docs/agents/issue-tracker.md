# Issue tracker: Beads (bd)

Issues and PRDs for this repo live in the local Beads issue tracker (Dolt-based).

## Conventions

- Issues are created with `bd create` and managed via the `bd` CLI.
- Triage state is recorded as labels (using `bd label` or `bd tag`). The label strings for triage roles are defined in `triage-labels.md`.
- Comments and conversation history can be added with `bd comment`.
- Dependencies are managed with `bd dep link`.

## When a skill says "publish to the issue tracker"

Run `bd create --title="<title>" --description="<description>" [--type=task|bug|feature] [--priority=<0-4>]` and optionally add labels with `bd label <issue-id> <label>`.

## When a skill says "fetch the relevant ticket"

Use `bd show <issue-id>` to get the full issue details, or `bd query` for searching.

## When a skill says "update issue"

Use `bd update <issue-id> --title="<new title>" --description="<new description>"` or other fields as needed.

## When a skill says "close issue"

Run `bd close <issue-id> [--reason="<explanation>"]`.

## When a skill says "add comment"

Run `bd comment <issue-id> --body="<comment text>"`.

## When a skill says "set label"

Run `bd label <issue-id> <label>` to add a label, or `bd label <issue-id> --remove <label>` to remove.

## When a skill says "check if issue is blocked"

Use `bd show <issue-id>` and look for the `is_blocked` field, or run `bd blocked` to list blocked issues.
