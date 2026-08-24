# Domain documentation layout

This repository uses a **single-context** layout.

## What this means

- There is one `CONTEXT.md` file at the repository root (expected at `./CONTEXT.md`).
- Architectural decision records (ADRs) are stored in `docs/adr/` relative to the repository root.

## How skills use this

Skills like `improve-codebase-architecture`, `diagnose`, and `tdd` will:
1. Read `./CONTEXT.md` to learn the project's domain language and glossary.
2. Read files in `docs/adr/` to understand past architectural decisions.

## Current state

At the time of setup, `CONTEXT.md` does not exist in this repository. If you want the skills to have domain context, please create `CONTEXT.md` at the repository root. If the project has multiple contexts (e.g., a monorepo), please update this file to reflect a multi-context layout and create the necessary context files.

