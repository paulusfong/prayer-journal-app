# Prayer Journal

A desktop-web journal for one small circle. Log prayer requests, mark “I prayed,” leave short notes, and move answered requests aside.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Drizzle ORM · SQLite (libSQL) · Better Auth magic links

See [docs/brainstorms/2026-08-22-prayer-journal-brainstorm.md](docs/brainstorms/2026-08-22-prayer-journal-brainstorm.md).

## Setup

```bash
cp .env.example .env.local
# set BETTER_AUTH_SECRET to a long random string
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000. The first email that signs in becomes the circle owner. Everyone else needs the invite link from **Circle**, then owner approval.

## Mail in development

Without `RESEND_API_KEY`, messages are appended under `tmp/mails/<email>`. Request a sign-in link, open that file, visit `/sign-in/confirm?token=…`, then click **Sign in** (so email scanners do not consume the token).

## Tests

```bash
npm test
npm run check:pr   # same scoped unit + mutation as CI (vs origin/main)
```

`npm install` points git hooks at `.githooks/`: **pre-commit** runs repo-wide ESLint + scoped unit tests on staged files; **pre-push** runs `check:pr` (ESLint + unit + mutation — mutation can take several minutes). Bypass with `SKIP_PR_CHECK=1` or `--no-verify`.

## Production

Shipping to a real circle? Follow [docs/go-live-checklist.md](docs/go-live-checklist.md).

Host is **Vercel + Turso** (the app treats `VERCEL=1` as production mail). Do not use a `file:` SQLite URL on Vercel — the disk is ephemeral.

- GitHub Action **Deploy** (push to `main` or *Run workflow*): needs secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, and a GitHub Environment named `production`.
- Local: `DATABASE_URL=… DATABASE_AUTH_TOKEN=… bash .github/scripts/deploy-prod.sh`


- `BETTER_AUTH_SECRET` — required
- `BETTER_AUTH_URL` — public origin
- `DATABASE_URL` — `file:./data/journal.sqlite` or a libSQL/Turso URL
- `RESEND_API_KEY` + `MAIL_FROM` — transactional mail (new circle request, yours answered)
