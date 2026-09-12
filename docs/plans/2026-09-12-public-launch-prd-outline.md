---
title: "PRD outline: Prayer Journal public launch"
type: prd-outline
status: draft
date: 2026-09-12
supersedes: null
related:
  - docs/go-live-checklist.md
  - docs/plans/2026-08-22-feat-prayer-journal-v1-plan.md
---

# PRD outline — Public launch (multi-circle, self-serve)

**Status:** parked outline for when soft-launch of one known circle is reliable.  
**Not in scope for current go-live.** Soft-launch stays invite-only, one instance, one circle.

## 1. Problem

People outside a single trusted circle cannot use the product without the owner hand-inviting them into **the** circle. The v1 model (singleton circle, first user = owner, invite + approve) cannot scale to “anyone can start or join a prayer circle online” without data leaks, abuse, or broken ownership.

## 2. Who it’s for

| Persona | Need |
|---------|------|
| **Circle creator** | Start a new circle quickly; invite family/group; stay owner |
| **Invitee** | Join one circle via link; clear pending/approved states |
| **Public browser** (later) | Discover or land on marketing → create account → create/join circle |
| **You (operator)** | Run many circles safely; contain abuse; meet basic privacy expectations |

**Non-user (for this milestone):** churches needing multi-campus admin, enterprise SSO, native apps as primary.

## 3. Outcome (success looks like)

1. Stranger can create an account and **their own** circle without colliding with anyone else’s data.  
2. Invites are per-circle; approving someone never grants access to other circles.  
3. Magic-link and invite abuse are rate-limited and observable.  
4. Privacy policy / deletion path exist before marketing “public.”  
5. Soft-launch lessons (IDOR, magic-link POST, digest invites, CI) remain green under multi-tenant queries.

## 4. Non-goals (explicit)

- Named-people ACL, daily digest, PWA/native as launch blockers (can follow).  
- Open global prayer board (all requests visible to the world).  
- Federated login (Google etc.) required for v1 public — magic link can remain primary.  
- Marketplace / directory of all public circles (opt-in later).  
- Migrating every historical single-circle deploy automatically without a one-time migration plan.

## 5. Product shape (proposal)

### 5.1 Tenancy

- **Many circles**, each with members, invites, requests scoped by `circleId`.  
- Remove or retire **singleton** bootstrap as the only path; replace with **Create circle** after sign-in.  
- Membership: `pending | approved | revoked` **per circle** (same as today, multi-row).

### 5.2 Signup / join

- **Create circle** — signed-in user becomes owner.  
- **Join via invite** — existing flow, but invite tokens always bound to one circle.  
- Optional: “I have an invite” vs “Start a circle” on the landing page.

### 5.3 Visibility (unchanged defaults)

- Request visibility remains `private | circle` inside that circle.  
- No cross-circle listing.

### 5.4 Trust & abuse

- Stricter magic-link limits (per email + IP; durable store, not memory-only).  
- Invite mint / join attempt limits.  
- Bot friction if public marketing drives signups (e.g. Turnstile) — decide at implementation.  
- Owner tools: revoke member, rotate invite, delete circle (cascade policy defined).

### 5.5 Legal / privacy

- Public `/privacy` and `/terms` that match storage (email, name, prayer text, mail titles).  
- Account/circle deletion and export (minimum: owner delete circle + account delete request).

## 6. Milestones (suggested order)

| # | Milestone | Exit criteria |
|---|-----------|----------------|
| M0 | Soft-launch one circle | Go-live checklist complete; 1–2 trusted users stable |
| M1 | Data model multi-circle | Schema + queries circle-scoped; no singleton assumption; migration from existing single circle |
| M2 | Create-circle UX | Signed-in user can create circle; switch/list memberships if multiple |
| M3 | Abuse & mail hardening | Durable rate limits; prod mail fail-closed; basic metrics/alerts |
| M4 | Public landing + policies | Marketing page, privacy/terms, deletion path |
| M5 | Soft public beta | Allowlisted domains or waitlist **or** open create-circle with caps |
| M6 | Open public | Remove waitlist; monitor abuse; support path |

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Cross-tenant IDOR | Every read/write goes through circle membership + visibility (extend today’s `loadVisibleRequest` pattern) |
| Spam magic links | Durable rate limits; optional CAPTCHA; fail closed on mail |
| Orphan / abandoned circles | Owner delete; inactivity policy later |
| Prayer content scraping | Authz + robots; no public SEO of request bodies |
| Scope creep (ACL, digests, PWA) | Keep as follow-ons after M4 |

## 8. Open decisions (park until M1)

1. Waitlist vs open create-circle for first public week?  
2. Can one user own/join many circles in M2, or one active circle first?  
3. Circle delete: soft-delete vs hard cascade?  
4. Custom domains / circle vanity URLs — yes/no for public beta?  
5. Pricing — free forever vs freemium (can defer past M5)?

## 9. Out of this outline

Implementation tickets, API sketches, and UI mockups. When starting M1, split into a full PRD + schema ADR + threat model addendum.

## 10. Done-when for “ready to write the full PRD”

- Soft-launch circle has used the basic loop without constant prompting.  
- Prod has Turso + Resend + latest security CI green.  
- You’re ready to accept strangers creating tenants.
