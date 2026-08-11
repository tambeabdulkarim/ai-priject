# Phase 13.2 Final Technical Review

Review only. No source code was modified as a result of this review (one documentation-accuracy correction was made to `docs/media-implementation-plan.md`'s Phase 13.3 section — a planning document, not code — see Task 4).

---

## 1. Transaction Review

**Are File creation and Media creation executed inside the same Prisma transaction?**

**NO.**

**Where each write actually happens, in order:** `FilesRepository.createFile` (File) → `FilesRepository.updateUpload` (mark Upload completed) → `MediaService.createFromFile` → `MediaRepository.createForFile` (Media). Each is an independent Prisma call. No `prisma.$transaction([...])` or interactive-transaction wraps any of them, including the pre-existing File-creation/Upload-update pair (that gap predates Phase 13.2 — not introduced by it).

**Why:** this codebase has an established, precedented use of `$transaction` (7 other repositories use it — e.g. `RefreshTokensRepository.markUsedAndCreateNext`, wrapping "mark old token used" + "create new token" together). The bar that precedent sets is clear: transactions are used when partial success would leave the system in a **genuinely broken, incorrect state** (an orphaned "used but not replaced" token would lock a user out). File+Media doesn't meet that bar — by this phase's own design, **a `File` with no `Media` row is a normal, expected, valid state**, not a broken one: every document upload (PDF, zip) never gets a `Media` row at all, and `MediaService.createFromFile` returning `null` is documented, tested behavior, not a failure mode.

**Is this an acceptable architectural decision?** Yes. Beyond matching the codebase's own transaction-usage precedent, wrapping this pair would require either (a) restructuring `MediaService.createFromFile` to accept and use a transaction-scoped Prisma client passed across the `FilesModule → MediaModule` boundary — a real architectural change to this codebase's repository pattern, where each repository holds its own singleton `PrismaService`, not a per-call injectable — or (b) inlining Media-creation logic directly into `FilesRepository`, which would violate the module boundary the approved architecture report deliberately established (Media ownership stays in the Media module). Both are bigger changes than this phase's scope, for a problem that isn't actually present.

**Risk:** Low. If `createFromFile` fails after `File` creation succeeds, the result is a `File` row with no `Media` row — recoverable (a future backfill/retry sweep, or a repeat call, is idempotent per `findByFileId`) and already logged loudly (Task 3). No dangling foreign key, no orphaned reference — `Media.fileId` points *to* `File`, not the reverse, so a missing `Media` row is simply "absent," never "broken."

**Should this remain until production?** Yes, with one caveat worth carrying forward (not a blocker, a forward note): once real transcoding/background processing exists (a later, already-flagged follow-up), a periodic reconciliation sweep for transcodable `File` rows with no `Media` row would be a reasonable operational safety net. That's new scope for a future phase, not evidence this phase's decision is wrong.

---

## 2. Serialization Review

**Is `BigInt.prototype.toJSON` already the project's serialization strategy?**

**NO.** Confirmed by search: no `ClassSerializerInterceptor`, no custom response-serialization interceptor, and no other BigInt-bearing field was ever serialized before this phase (`File.sizeBytes` and `Upload.expectedSizeBytes` are the only two `BigInt` columns in the entire schema — this phase's fix is the first time either needed to cross the JSON boundary). There was no prior strategy to match or diverge from.

**Is it still the safest solution for right now?** **YES**, with an important qualifier: "safest" here means *lowest-risk way to unblock a discovered, disclosed, pre-existing bug that sat directly in the one function this phase was required to modify*, not "the best long-term design." It's a one-line, well-known, standard Node.js fix; it covers both existing `BigInt` fields automatically (not just the one this phase touches); and it changes nothing about any DTO, response type, or module boundary.

**Would an interceptor/serializer layer be technically superior?** **YES.** A scoped NestJS interceptor (or explicit field-level mapping to `string` at the repository/service boundary, matching what `packages/types`'s `FileRecord.sizeBytes: string` already expects) would be more idiomatic: it wouldn't mutate a JavaScript built-in prototype globally, its effect would be visible and traceable at the HTTP layer specifically, and it would carry no risk of interacting unexpectedly with some future library or Node version that also touches `BigInt.prototype`.

**Why wasn't it built now?** Three reasons, stated plainly rather than deferred vaguely:
1. **Scope discipline.** This phase's mandate was narrow ("implement ONLY... Media creation"). Designing a response-serialization layer is itself a small architecture decision (does it belong globally, per-DTO via `class-transformer`, or per-field?) — exactly the kind of thing "do not redesign anything" argues against deciding unilaterally mid-task.
2. **The bug is orthogonal to Media.** It's a platform-wide `BigInt` gap that happened to sit in the function this phase touched — the *correct* permanent fix deserves its own review across every current and future `BigInt` field, not a decision made as a side effect of the Media work.
3. **Low blast radius today.** Two fields, both already conceptually "just a size in bytes as a string" per the existing type contracts — the global shim produces exactly that output with no observed downside in 158/158 passing tests plus a live database check.

**Verdict on this item:** correct call for this phase; flagged here as a named, real recommendation for a future (small) cleanup phase — not upgraded to a blocking issue, since the current fix is functionally correct and low-risk.

---

## 3. Media Failure Behavior

**Is this behavior correct?** **YES.**

**Would you recommend rolling back the upload?** **NO.**

**Reasoning:** The `File` record represents a real, successfully-stored, independently-useful artifact — the upload contract (`POST /files/:uploadId/complete`) is about finalizing *that*, not about guaranteeing every possible downstream extension succeeds. Rolling back a successful, validated (magic-byte-checked), stored file because an *optional* extension record failed to write would:
- Destroy real, correctly-uploaded user data over a problem in an unrelated subsystem (Media), which is a worse outcome for the user than "your file is safely stored; a secondary feature will catch up shortly."
- Contradict this phase's own design for the overwhelming majority of uploads (documents), where `createFromFile` returning `null` is the *normal* path — "sometimes there's no Media row" cannot simultaneously be "normal" for one file type and "must roll back the whole upload" for another; that would be an inconsistent, surprising API contract.
- Provide no real correctness benefit: since Media creation is already idempotent (`findByFileId` check) and already loudly logged, the failure is fully recoverable without ever touching the `File` row.

This matches Task 1's finding directly: the "no transaction" and "no rollback on Media failure" decisions are the same design decision viewed from two angles, and both hold up under scrutiny.

---

## 4. Phase 13.3 Readiness

Checked each item against what Phase 13.2 actually built:

| Item | Status |
|---|---|
| `GET /media` | **Not built in 13.2** (confirmed absent from `media.controller.ts` — only `GET /media/:id` exists). Was in the original architecture report's 13.2 scope but excluded from that task's narrower explicit item list. **Was missing from the Phase 13.3 plan's own assumptions — corrected during this review** (see below). |
| `DELETE /files` | **Not built in 13.2** (confirmed absent from `files.controller.ts` — only `GET /files/:id` exists). Same story as above. **Was missing from the Phase 13.3 plan's own assumptions — corrected during this review.** |
| Media Library | Scheduled in `docs/media-implementation-plan.md` Phase 13.3. Its "list, status, delete action" description implicitly depended on the two missing endpoints above — dependency now made explicit. |
| Media Picker | Scheduled in Phase 13.3. Same dependency, now explicit. |
| Media Preview | Scheduled in Phase 13.3 (`<MediaPreview>`). No backend dependency issue. |
| API Client updates | Scheduled in Phase 13.3 (`packages/api-client` additions). Correctly listed, but was written as if wrapping already-existing endpoints — corrected. |
| Frontend typing updates | Scheduled in Phase 13.3 (`packages/types` additions). Same correction applied. |

**What was missing, and what was done about it:** `docs/media-implementation-plan.md`'s Phase 13.3 section read as though `GET /media` and `DELETE /files/:id` already existed for the frontend to consume. They don't. This review corrected that section directly (a documentation-accuracy fix, not a code change) to list both as an explicit backend prerequisite within Phase 13.3, with an acceptance criterion requiring them to be real before the phase is considered complete. This is not a defect in Phase 13.2's actual implementation — it's a planning-document gap that would have misled whoever started Phase 13.3 under the prior wording. It is fixed now, in documentation, so Phase 13.3 starts from an accurate premise.

---

## 5. Final Verdict

**A) Phase 13.2 is technically approved. Proceed to Phase 13.3.**

Rationale: no code defect was found in any of the four review areas. The no-transaction and no-rollback design decisions are correct, precedent-consistent, and low-risk. The `BigInt` fix is a reasonable, low-blast-radius stopgap for a real, pre-existing, disclosed bug — architecturally improvable later, but not wrong today. The one real issue this review surfaced (Phase 13.3's plan assuming two endpoints that don't exist) has already been corrected in documentation, so it does not block 13.2's closure or 13.3's start — it just means 13.3's first concrete step is now explicit rather than assumed.
