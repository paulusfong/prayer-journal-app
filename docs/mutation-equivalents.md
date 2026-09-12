## Documented equivalent mutants (Stryker disable)

These are ignored via `// Stryker disable` because the mutant is behaviorally identical to the original under the app's invariants:

1. **`src/lib/journal.ts` — digest-equal scrub / pending re-apply**  
   - Always-updating when digests match is a no-op write.  
   - Re-applying `pending` on an already-pending row is equivalent.

2. **`src/lib/magic-link-throttle.ts`**  
   - `OptionalChaining` on `String#split()[0]` — split always yields a defined first element.  
   - `MethodExpression` on `Headers#get` trim — Fetch Headers already returns trimmed values.  
   - `CallExpression` prune-on-reject — only affects GC of old timestamps; the filter recomputes the window anyway.

3. **`src/lib/request-fields.ts`**  
   - Calendar `Regex` without anchors — validation still rejects junk around `YYYY-MM-DD`.  
   - `LogicalOperator`/`ConditionalExpression` on `Date.UTC` overflow — Y/M/D checks are coupled for invalid calendars (equivalent).

4. **Author missing-row path (removed)**  
   - Previously `if (!authorRow) return true` after FK lookup was an equivalent (authorId always references `user`). The early return was removed in favor of `authorRows[0]!` so those mutants no longer exist.

Thresholds: `high`/`low`/`break` = **100**. Mutate: `src/lib/**/*.ts` excluding tests, `auth-client.ts`, `auth.ts`, `schema.ts`, `db.ts`.
