---
date: 2026-08-22
topic: prayer-journal
---

# Prayer Journal (small circle)

## What We're Building

A desktop-web prayer journal for one small circle (family, prayer partner, or small group). People log prayer requests, others in the circle can see them, mark “I prayed,” and leave a short note. Dated updates sit under a request. When someone marks a request answered, it moves to an answered list with its title and notes kept.

v1 is one circle, used mainly on a computer in the browser. Phone (PWA) and native apps come later. Multiple circles come later.

## Why This Approach

Three shapes were considered:

- **A — shared list only:** too thin. The point is group prayer, not a peekable notebook.
- **B — full spec in one shot:** named-people ACL, event email *and* digest, PWA/native hooks. Easy to stall.
- **C — same product, thin first slice (chosen):** ship the real group loop this week. Defer the two hard extras (per-person ACL, daily digest) and later platforms. Keep the data model ready so those are additions, not rewrites.

## Key Decisions

- **Audience:** you + a small circle, not a public church board.
- **On a request, people can:** see it, mark “I prayed,” leave a short note.
- **Circles:** one circle in v1; structure should not block more groups later.
- **Visibility in v1:** private (author only) or whole circle. Named-people sharing is next, not v1.
- **Mark answered:** author or anyone in the circle. Request moves to an answered list; title + notes stay. No testimony required.
- **Request fields:** title, optional longer note, who it is for, optional category, optional hope-by date (surgery, exam). List can sort by that date.
- **Updates:** dated notes under the original. Do not silently rewrite history.
- **Join:** invite link; you approve each person. No open join.
- **Platform:** desktop web first. PWA later, then native.
- **Email in v1:** send when a new request is posted, and when yours is marked answered. Daily digest is later, not v1.
- **Success:** the circle actually logs requests, marks answers, and hits “I prayed” without being nagged.

## Out of scope for v1

- Named-people visibility (private / circle / pick people — only first two now)
- Daily email digest
- PWA / home-screen install
- Native iOS/Android
- Multiple circles per person
- Required answered-prayer testimony

## Open Questions

- Auth: email magic link, password, or Google? (planning can pick the simplest)
- Categories: fixed list vs free text?
- “Who it is for”: free text vs people already in the circle?
- Can an answered request be reopened?
- Who can edit or delete a request or a note — author only?
- Can you un-tap “I prayed”?
- UI language: English, Chinese, or both?

## Next Steps

→ `/workflows:plan` for implementation details
