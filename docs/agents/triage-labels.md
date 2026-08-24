# Triage label mapping for Beads

Beads does not have predefined labels. The following label strings should be created in Beads (using `bd label create` or simply applied to issues) to match the triage roles:

- `needs-triage` — maintainer needs to evaluate
- `needs-info` — waiting on reporter
- `ready-for-agent` — fully specified, AFK-ready (an agent can pick it up with no human context)
- `ready-for-human` — needs human implementation
- `wontfix` — will not be actioned

Additionally, the triage skill uses two category roles:

- `bug` — something is broken
- `enhancement` — new feature or improvement

These should also be created as labels in Beads.

## How to set up labels in Beads

You can create these labels once and reuse them, or apply them directly to issues. For example:

```bash
bd label create needs-triage
bd label create needs-info
bd label create ready-for-agent
bd label create ready-for-human
bd label create wontfix
bd label create bug
bd label create enhancement
```

Then, when triaging an issue, apply the appropriate labels:

```bash
bd label add <issue-id> needs-triage
bd label add <issue-id> bug
```

## Note

The triage skill expects exactly one category role (bug or enhancement) and one state role (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix) per issue.
