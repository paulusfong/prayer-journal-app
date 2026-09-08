# Go-live checklist — Prayer Journal (first real circle)

Assumption: you're hosting **one instance** for your circle (not a multi-tenant SaaS). Goal: invite 2–6 people, they log requests, tap I prayed, mark answers — without you babysitting mail or access.

## 0. Preflight (local, 15–30 min)

- [ ] Fresh `npm install` + `npm run db:push` + `npm run dev` on a clean machine
- [ ] `npm test` passes
- [ ] Smoke the happy path yourself: magic-link sign-in (confirm **POST**, not GET) → create circle-visible request → second browser/user via invite → owner approve → I prayed + note → mark answered → reopen once
- [ ] Confirm **private** requests never appear to the other user and never email
- [ ] Confirm pending invitee sees no journal (need-invite / pending gates)
- [ ] Skim `/privacy` — it matches what you'll tell people (email, name, prayer text; no analytics; titles-only in mail)

## 1. Hosting & data

- [ ] Pick a host that can run Next.js 16 and keep a durable SQLite/libSQL file (or Turso). Ephemeral disk = lost journal.
- [ ] HTTPS only; set `BETTER_AUTH_URL` to the **public** origin (no trailing slash mismatch)
- [ ] Generate a long random `BETTER_AUTH_SECRET` (never reuse the local one)
- [ ] Set `DATABASE_URL` to a persistent path/volume or Turso URL; confirm backups (daily snapshot is enough for family scale)
- [ ] Confirm the data volume survives deploys/restarts with a dummy write + redeploy test

## 2. Mail (the loop dies if this fails)

- [ ] Resend (or equivalent) account + **verified sending domain**
- [ ] SPF / DKIM / DMARC green for that domain
- [ ] `RESEND_API_KEY` + `MAIL_FROM` set in production
- [ ] Send a real magic link to your inbox and a second address; both land out of spam
- [ ] Trigger a **new circle request** email and an **answered** email; titles + links only, no prayer body
- [ ] Know where production mail failures show up (host logs) — create still succeeds if mail jobs die

## 3. Bootstrap the circle

- [ ] First production sign-in is **you** (first confirmed user = owner)
- [ ] Set circle name / your display name as you'll show them
- [ ] Create invite link; note expiry / how to rotate if it leaks
- [ ] Practice approve / decline / revoke on a throwaway second email before inviting real people

## 4. Soft launch with 1–2 trusted people

- [ ] Invite them; approve; have each create one request and tap I prayed on yours
- [ ] Mark one answered; confirm author got mail
- [ ] Ask them: anything confusing on sign-in, invite, or "where do I write an update?"
- [ ] Fix blockers before the wider circle invite

## 5. Real circle invite

- [ ] Short note to the group: what it is, invite link, "owner approves joins," desktop-web first, link to `/privacy`
- [ ] Tell them: don't paste the invite in a huge public chat; you can rotate if needed
- [ ] Seed 2–3 real open requests so the list isn't empty on day one
- [ ] Watch for: spam-folder magic links, pending folks stuck, IDOR surprises (private items visible — treat as stop-ship)

## 6. Operate the first week

- [ ] Daily: glance open list + pending members
- [ ] If mail flakes: fix domain/DNS before nagging people to "check the app"
- [ ] Don't add named ACL / digest / PWA until this circle has used the basic loop without you prompting
- [ ] Capture friction in issues (sign-in, invite, hope-by, categories) for the next milestone

## Stop-ship if

- Magic link consumed by email scanners (GET must not session)
- Prayer body appears in email or logs
- Pending or non-members can see journal content
- Private request visible to another member
- Database wiped on redeploy

## Done looks like

Owner + a few approved members; requests logged; I prayed taps happening; at least one answered move — and you're not sending "please remember to pray" reminders.
