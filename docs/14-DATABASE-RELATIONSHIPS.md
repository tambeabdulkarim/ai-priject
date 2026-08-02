# 14 — Database Relationships

Status: Official relationship reference for Phoenix. Companion to `13-DATABASE-BLUEPRINT.md` (table definitions) and governed by `11-DATABASE-BIBLE.md` (relationship standards, §5–§7). This document is not SQL, not Prisma, not implementation — it is the authoritative map of how every table connects, cascades, and lives/dies relative to every other table.

---

# PART 1 — PER-TABLE RELATIONSHIP DEFINITIONS

Organized by domain, matching `13-DATABASE-BLUEPRINT.md`.

## Domain: Authentication (`auth` schema)

### Users
- **Parent Tables:** none — root entity
- **Child Tables:** User_Sessions, Refresh_Tokens, Enrollments, Orders, Downloads, Bookmarks, Reading_Progress, Quiz_Attempts, Comments, AI_Requests, Notifications, Certificates, Courses (as instructor), News (as author), Authors (as linked_user), Products (as owner)
- **One-to-One:** none
- **One-to-Many:** Users → User_Sessions, Users → Refresh_Tokens, Users → Enrollments, Users → Orders, Users → Notifications
- **Many-to-Many:** Users ↔ Roles (via User_Roles)
- **Cascade Behavior:** `RESTRICT` on delete — a user with any historical activity (orders, enrollments, comments) cannot be hard-deleted; deletion always routes through soft delete
- **Soft Delete:** yes — `deleted_at`; PII fields (email, display_name, avatar) are anonymized on deletion per `11-DATABASE-BIBLE.md` §14, while the row itself persists to preserve referential integrity for financial/audit history
- **Ownership Rules:** a user owns their own row exclusively; only `admin`/`superadmin` may modify another user's row, and only for account-status/role management, never profile content
- **Data Lifecycle:** created at registration → active → optionally suspended (status change, reversible) → deactivated/soft-deleted on request → PII scrubbed within the retention SLA → row retained indefinitely as an anonymized anchor for historical financial and audit records

### Roles
- **Parent Tables:** none
- **Child Tables:** Role_Permissions
- **One-to-One:** none
- **One-to-Many:** Roles → Role_Permissions
- **Many-to-Many:** Roles ↔ Users (via User_Roles), Roles ↔ Permissions (via Role_Permissions)
- **Cascade Behavior:** `RESTRICT` — a role in use by any user or granted any permission cannot be deleted; `is_system_role` roles are never deletable regardless of usage
- **Soft Delete:** no — roles are reference data; retired roles are deactivated (`is_system_role` flag / status), not deleted, to preserve the meaning of historical `User_Roles`/`Audit_Logs` rows
- **Ownership Rules:** `superadmin` only
- **Data Lifecycle:** defined at platform launch (fixed set) → occasionally extended for new responsibilities → never removed once any historical grant references it

### User_Roles
- **Parent Tables:** Users, Roles
- **Child Tables:** none (pure join table)
- **One-to-One:** none
- **Many-to-Many:** resolves Users ↔ Roles
- **Cascade Behavior:** `RESTRICT` on either parent delete while a grant exists — a user's last role is never silently dropped by a cascade; role revocation is an explicit action, not a side effect
- **Soft Delete:** no — grants are revoked by row deletion, with the revocation itself recorded in `Audit_Logs`, matching the `Role_Permissions` pattern
- **Ownership Rules:** `superadmin` only; every grant/revoke is logged
- **Data Lifecycle:** the default `learner` role is granted at registration → additional/elevated roles granted by `superadmin` → revoked on role change, with historical grants preserved in `Audit_Logs`

### Permissions
- **Parent Tables:** none
- **Child Tables:** Role_Permissions
- **One-to-Many:** Permissions → Role_Permissions
- **Many-to-Many:** Permissions ↔ Roles (via Role_Permissions)
- **Cascade Behavior:** `RESTRICT` — a permission granted to any role cannot be deleted
- **Soft Delete:** no — deprecated via a status flag, never deleted, so historical `Role_Permissions`/`Audit_Logs` rows referencing it remain meaningful
- **Ownership Rules:** `superadmin` only; new permissions are introduced alongside the feature that requires them, reviewed the same as a code change
- **Data Lifecycle:** created when a new protected action is introduced → referenced by role grants for the life of the feature → deprecated (never deleted) if the underlying action is retired

### Role_Permissions
- **Parent Tables:** Roles, Permissions
- **Child Tables:** none (pure join table)
- **One-to-One:** none
- **Many-to-Many:** resolves Roles ↔ Permissions
- **Cascade Behavior:** `CASCADE` on delete of either parent — but in practice this is unreachable, since Roles/Permissions themselves are `RESTRICT`-protected from deletion while grants exist; cascade exists as a safety net for the rare legitimate cleanup of a truly retired role
- **Soft Delete:** no — grants are revoked by row deletion (a grant either exists or doesn't; there's no "soft-revoked" state), with the revocation itself recorded in `Audit_Logs`
- **Ownership Rules:** `superadmin` only; every grant/revoke is logged
- **Data Lifecycle:** created on grant → exists for the life of the grant → deleted on revoke, with the historical fact of the grant preserved separately in `Audit_Logs`

### User_Sessions
- **Parent Tables:** Users
- **Child Tables:** Refresh_Tokens
- **One-to-One:** User_Sessions ↔ Refresh_Tokens (current active token per session)
- **One-to-Many:** Users → User_Sessions
- **Cascade Behavior:** `CASCADE` on Users delete (only reachable via the anonymization path, since Users are soft-deleted, not hard-deleted, in practice); `CASCADE` on delete to child Refresh_Tokens
- **Soft Delete:** no — sessions are revoked (`revoked_at`), not soft-deleted; revoked sessions are purged after a short retention window for audit purposes
- **Ownership Rules:** system-managed; a user can revoke their own sessions, `admin` can revoke any session for security response
- **Data Lifecycle:** created at login → active while used → revoked on logout, expiry, or security action → purged after retention window

### Refresh_Tokens
- **Parent Tables:** Users, User_Sessions
- **Child Tables:** none
- **One-to-One:** Refresh_Tokens ↔ User_Sessions (current token per session)
- **Many-to-One (self-referencing chain):** Refresh_Tokens.previous_token_id → Refresh_Tokens.id
- **Cascade Behavior:** `CASCADE` on parent Users or User_Sessions delete/revoke
- **Soft Delete:** no — revoked via `revoked_at`; purged after short retention window
- **Ownership Rules:** system-managed only, never directly user- or admin-editable, only revocable
- **Data Lifecycle:** issued on login/refresh → rotated on each use (old token marked used, new token issued) → revoked on logout, reuse-detection, or session expiry → purged

### Notifications
- **Parent Tables:** Users
- **Child Tables:** none
- **One-to-Many:** Users → Notifications
- **Cascade Behavior:** `CASCADE` on Users delete (anonymization path)
- **Soft Delete:** no — hard-deleted on TTL archival, since notification content has no long-term audit value once expired
- **Ownership Rules:** strictly the owning user; system/admin processes create notifications on a user's behalf but never read another user's notifications
- **Data Lifecycle:** created by a domain event → read/unread state toggled by the user → archived/deleted after TTL (`11-DATABASE-BIBLE.md` §15)

### Audit_Logs
- **Parent Tables:** Users (as actor, nullable)
- **Child Tables:** none
- **One-to-Many:** Users → Audit_Logs (as actor)
- **Cascade Behavior:** `SET NULL` on Users delete — the log entry survives even if the actor account is later deleted/anonymized, since the audit record's evidentiary value outlives the account
- **Soft Delete:** not applicable — table is insert-only, no delete/update path exists at the application-role level under any circumstance
- **Ownership Rules:** system-written only; read access restricted to `admin`/`superadmin`/security roles
- **Data Lifecycle:** created at the moment of a security-relevant action → retained per the minimum 1-year (or longer, per compliance) schedule in `11-DATABASE-BIBLE.md` §14 → archived (not deleted) past that window per `11-DATABASE-BIBLE.md` §15

---

## Domain: Learning (`courses` schema)

### Courses
- **Parent Tables:** Users (instructor), Categories
- **Child Tables:** Modules, Enrollments, Certificates
- **One-to-Many:** Courses → Modules, Courses → Enrollments, Courses → Certificates
- **Cascade Behavior:** `RESTRICT` on delete while any Enrollment exists; `CASCADE` to Modules only if the course itself was never published and has zero enrollments (draft cleanup)
- **Soft Delete:** yes — `status = archived` is the effective soft delete; a course with historical enrollments/certificates is never hard-deleted, only archived (hidden from catalog, existing learners retain access)
- **Ownership Rules:** owning instructor and `content_editor`/`admin` roles
- **Data Lifecycle:** draft → in_review → published → (optionally) archived; archived courses remain queryable for existing enrollees indefinitely

### Modules
- **Parent Tables:** Courses
- **Child Tables:** Lessons
- **One-to-Many:** Courses → Modules, Modules → Lessons
- **Cascade Behavior:** `CASCADE` on Courses delete (only reachable in the pre-publish draft-cleanup case above); `RESTRICT` otherwise
- **Soft Delete:** no — modules are reordered/removed only in draft state; once published, a module is hidden via a status flag rather than removed, to avoid breaking existing learners' `Lesson_Progress` history
- **Ownership Rules:** same as parent Courses
- **Data Lifecycle:** created during course authoring → reordered freely pre-publish → structurally stable post-publish (content edited in place, not restructured)

### Lessons
- **Parent Tables:** Modules
- **Child Tables:** Lesson_Files, Lesson_Progress, Quizzes
- **One-to-Many:** Modules → Lessons, Lessons → Lesson_Files, Lessons → Lesson_Progress, Lessons → Quizzes
- **One-to-One (optional):** Lessons → Media (via video_media_id)
- **Cascade Behavior:** `CASCADE` to Lesson_Files on Lessons delete (pre-publish only); `RESTRICT` once any Lesson_Progress exists
- **Soft Delete:** no, for the same reason as Modules — hidden via status, not deleted, once live
- **Ownership Rules:** same as parent Courses
- **Data Lifecycle:** authored → published as part of the module → content may be edited in place indefinitely; structural removal only pre-publish

### Lesson_Files
- **Parent Tables:** Lessons, Files
- **Child Tables:** none
- **One-to-Many:** Lessons → Lesson_Files
- **Cascade Behavior:** `CASCADE` on Lessons delete (pre-publish only); the referenced `Files` row is never cascade-deleted from here (files are owned by the Files domain, §Files below)
- **Soft Delete:** no
- **Ownership Rules:** same as parent Lessons
- **Data Lifecycle:** attached at authoring time → available for the life of the published lesson → detached (not the underlying file deleted) if replaced

### Enrollments
- **Parent Tables:** Users, Courses, Order_Items (nullable — corrected during the Database Documentation Consistency Audit from an earlier "Payments" reference; Order_Items is correct because entitlement is granted per purchased line item, not per payment, so a single order can produce multiple Enrollments, each traceable to its own Order_Item)
- **Child Tables:** Lesson_Progress, Certificates
- **One-to-Many:** Enrollments → Lesson_Progress
- **One-to-One:** Enrollments ↔ Certificates (once completed)
- **Cascade Behavior:** `RESTRICT` on Users or Courses delete — an enrollment is a durable historical/financial-adjacent record, never cascade-removed; `RESTRICT` on Order_Items delete for the same reason
- **Soft Delete:** no — lifecycle is modeled via `status` (active/expired/refunded), which is the functional equivalent of soft delete for access-control purposes
- **Ownership Rules:** the enrolled user (read-only) and `admin`/support roles (status changes, e.g., processing a refund)
- **Data Lifecycle:** created on purchase/enrollment → active while access is valid → expired/refunded on the relevant business event → retained permanently for financial and completion-history reporting

### Lesson_Progress
- **Parent Tables:** Enrollments, Lessons
- **Child Tables:** none
- **One-to-Many:** Enrollments → Lesson_Progress
- **Cascade Behavior:** `CASCADE` on Enrollments delete (unreachable in practice, since Enrollments are `RESTRICT`-protected); `CASCADE` on Lessons delete only in the pre-publish case
- **Soft Delete:** no — progress is overwritten/updated in place, not soft-deleted
- **Ownership Rules:** the enrolled user only (system-written on their activity)
- **Data Lifecycle:** created on first lesson interaction → updated continuously → retained for the life of the enrollment, archived per `11-DATABASE-BIBLE.md` §15 once historically inactive

### Quizzes
- **Parent Tables:** Lessons
- **Child Tables:** Quiz_Questions, Quiz_Attempts
- **One-to-Many:** Lessons → Quizzes, Quizzes → Quiz_Questions, Quizzes → Quiz_Attempts
- **Cascade Behavior:** `RESTRICT` once any Quiz_Attempts exist; `CASCADE` to Quiz_Questions only pre-publish
- **Soft Delete:** no
- **Ownership Rules:** same as parent course's instructor/editorial roles
- **Data Lifecycle:** authored alongside the lesson → stable once learners begin attempting it (questions edited in place, not restructured, once attempts exist)

### Quiz_Questions
- **Parent Tables:** Quizzes
- **Child Tables:** none (referenced by, not parent of, Quiz_Attempts — attempts store submitted answers inline, not a foreign key per question)
- **One-to-Many:** Quizzes → Quiz_Questions
- **Cascade Behavior:** `CASCADE` on Quizzes delete (pre-publish only)
- **Soft Delete:** no
- **Ownership Rules:** same as parent Quizzes
- **Data Lifecycle:** authored → stable post-publish

### Quiz_Attempts
- **Parent Tables:** Quizzes, Users
- **Child Tables:** none
- **One-to-Many:** Users → Quiz_Attempts, Quizzes → Quiz_Attempts
- **Cascade Behavior:** `RESTRICT` on Quizzes or Users delete — historical assessment records are never cascade-removed
- **Soft Delete:** no — an attempt is an immutable historical fact once submitted
- **Ownership Rules:** the attempting user (create-once, read own); instructor/admin read for grading/analytics
- **Data Lifecycle:** created on submission → immutable thereafter → retained for the life of the enrollment/certificate it supports

### Certificates
- **Parent Tables:** Users, Courses, Enrollments
- **Child Tables:** none
- **One-to-One:** Enrollments ↔ Certificates
- **Cascade Behavior:** `RESTRICT` on all parents — a certificate is a durable credential, never cascade-deleted
- **Soft Delete:** no — a certificate is either issued (exists) or revoked (a distinct, explicit `revoked_at` state), never silently removed
- **Ownership Rules:** system-issued on completion; only `admin` may revoke, with mandatory audit-logging
- **Data Lifecycle:** issued on course completion → publicly verifiable indefinitely → revoked only in exceptional integrity cases (still retained as a revoked record, not deleted)

---

## Domain: Library (`library` schema)

### Library_Items
- **Parent Tables:** Authors, Categories, Files
- **Child Tables:** Downloads, Bookmarks, Reading_Progress
- **One-to-Many:** Library_Items → Downloads, Library_Items → Bookmarks, Library_Items → Reading_Progress
- **Cascade Behavior:** `RESTRICT` once any Downloads/Bookmarks/Reading_Progress exist
- **Soft Delete:** yes — `status = archived`; a purchased/downloaded item is never hard-removed from a user's access history
- **Ownership Rules:** `content_editor`/`admin`
- **Data Lifecycle:** draft → published → optionally archived (existing owners retain access)

### Categories
- **Parent Tables:** Categories (self-referencing, nullable parent)
- **Child Tables:** Categories (children), Library_Items, Courses, Products
- **One-to-Many:** Categories → Categories (sub-categories), Categories → Library_Items, Categories → Courses, Categories → Products
- **Cascade Behavior:** `RESTRICT` while any content references the category, and `RESTRICT` while sub-categories exist (must delete/reassign children first)
- **Soft Delete:** no — categories are reference data; retired categories are deactivated via a status flag, existing content reassigned before removal
- **Ownership Rules:** `admin`
- **Data Lifecycle:** created as taxonomy evolves → stable long-term → deprecated (not deleted) when reorganized

### Authors
- **Parent Tables:** Users (nullable, if linked)
- **Child Tables:** Library_Items
- **One-to-Many:** Authors → Library_Items
- **Cascade Behavior:** `RESTRICT` while any Library_Items reference the author
- **Soft Delete:** no — non-sensitive reference data, deactivated rather than deleted if retired
- **Ownership Rules:** `content_editor`/`admin`
- **Data Lifecycle:** created when their first item is catalogued → persists for the life of the catalog

### Downloads
- **Parent Tables:** Users, Library_Items
- **Child Tables:** none
- **One-to-Many:** Users → Downloads, Library_Items → Downloads
- **Cascade Behavior:** `RESTRICT` on both parents — a download record is a historical/entitlement fact
- **Soft Delete:** no — immutable event log
- **Ownership Rules:** the downloading user (read own); admin (audit/abuse review)
- **Data Lifecycle:** created per download event → retained per general log retention (`11-DATABASE-BIBLE.md` §14)

### Bookmarks
- **Parent Tables:** Users, Library_Items
- **Child Tables:** none
- **Many-to-Many:** resolves Users ↔ Library_Items
- **Cascade Behavior:** `CASCADE` on either parent delete — a bookmark has no meaning without both sides, and unlike Downloads carries no financial/audit weight
- **Soft Delete:** no — removed outright when un-bookmarked
- **Ownership Rules:** the owning user exclusively
- **Data Lifecycle:** created/removed freely by user action, no retention requirement

### Reading_Progress
- **Parent Tables:** Users, Library_Items
- **Child Tables:** none
- **One-to-Many (effectively one-to-one per user/item):** Users → Reading_Progress, Library_Items → Reading_Progress
- **Cascade Behavior:** `CASCADE` on either parent delete
- **Soft Delete:** no — updated in place
- **Ownership Rules:** the owning user exclusively (system-written on their activity)
- **Data Lifecycle:** created on first read → updated continuously → archived per `11-DATABASE-BIBLE.md` §15 once inactive

---

## Domain: Marketplace (`marketplace` schema)

### Products
- **Parent Tables:** Categories, Users (nullable owner, future vendor model)
- **Child Tables:** Order_Items
- **One-to-Many:** Products → Order_Items
- **Cascade Behavior:** `RESTRICT` once any Order_Items reference the product
- **Soft Delete:** yes — `status = archived`; historical orders retain their snapshotted price/details regardless of product archival
- **Ownership Rules:** `admin` at launch; future vendor `owner_id` for self-service vendor management
- **Data Lifecycle:** draft → published → optionally archived (purchasers retain access via Order_Items snapshot)

### Orders
- **Parent Tables:** Users, Coupons (nullable)
- **Child Tables:** Order_Items, Payments
- **One-to-Many:** Users → Orders, Orders → Order_Items, Orders → Payments
- **Cascade Behavior:** `RESTRICT` on Users delete; `CASCADE` to Order_Items only if the order was never paid (abandoned-cart cleanup)
- **Soft Delete:** no — lifecycle modeled via `status` (pending/paid/refunded/cancelled), functionally equivalent to soft delete
- **Ownership Rules:** the purchasing user (read own); `admin`/support (refund/status management)
- **Data Lifecycle:** created at checkout initiation → paid on verified webhook → optionally refunded/cancelled → retained permanently (financial record, `11-DATABASE-BIBLE.md` §14)

### Order_Items
- **Parent Tables:** Orders, Products
- **Child Tables:** Enrollments (referenced, not owned — a course-product Order_Item may have one corresponding Enrollment)
- **One-to-Many:** Orders → Order_Items, Products → Order_Items, Order_Items → Enrollments
- **Cascade Behavior:** `CASCADE` on Orders delete (abandoned/unpaid orders only); `RESTRICT` on Products delete once referenced; `RESTRICT` once a referencing Enrollment exists
- **Soft Delete:** no — immutable once the order is paid
- **Ownership Rules:** system-written at checkout, immutable thereafter
- **Data Lifecycle:** created at checkout → frozen (price-snapshotted) at payment → retained with the parent Order permanently

### Payments
- **Parent Tables:** Orders
- **Child Tables:** Transactions
- **One-to-Many:** Orders → Payments, Payments → Transactions
- **Cascade Behavior:** `RESTRICT` on Orders delete
- **Soft Delete:** no — a payment attempt is an immutable historical fact (status update only: pending → succeeded/failed)
- **Ownership Rules:** system-written only, driven exclusively by verified provider webhooks
- **Data Lifecycle:** created on checkout attempt → resolved to succeeded/failed → retained permanently

### Coupons
- **Parent Tables:** none
- **Child Tables:** Orders (referenced, not owned)
- **One-to-Many:** Coupons → Orders
- **Cascade Behavior:** `RESTRICT` while any Orders reference the coupon
- **Soft Delete:** no — expired via `expires_at`, deactivated via status, never deleted while historical orders reference it
- **Ownership Rules:** `admin`/marketing roles
- **Data Lifecycle:** created for a campaign → active until expiry/exhaustion → retained for historical order accuracy

### Transactions
- **Parent Tables:** Payments
- **Child Tables:** none
- **One-to-Many:** Payments → Transactions
- **Cascade Behavior:** `RESTRICT` on Payments delete — this table is never subject to cascade removal under any path
- **Soft Delete:** not applicable — insert-only ledger, no update/delete path
- **Ownership Rules:** system-written only; read restricted to finance/admin
- **Data Lifecycle:** created per financial event → retained for the statutory 7-year minimum (`11-DATABASE-BIBLE.md` §14) regardless of any other table's lifecycle

---

## Domain: AI (`ai` schema)

### AI_Providers
- **Parent Tables:** none
- **Child Tables:** AI_Models
- **One-to-Many:** AI_Providers → AI_Models
- **Cascade Behavior:** `RESTRICT` while any AI_Models reference the provider
- **Soft Delete:** no — deactivated via `status`, never deleted while historical AI_Requests trace back through its models
- **Ownership Rules:** engineering/admin, config-managed
- **Data Lifecycle:** onboarded per `12-AI-INTEGRATION-BIBLE.md` §3 → active/degraded/disabled → rarely removed, only deactivated

### AI_Models
- **Parent Tables:** AI_Providers
- **Child Tables:** AI_Requests (referenced, not owned)
- **One-to-Many:** AI_Providers → AI_Models, AI_Models → AI_Requests
- **Cascade Behavior:** `RESTRICT` while any AI_Requests reference the model
- **Soft Delete:** no — deprecated via `deprecated_at`, never deleted while historical requests reference it
- **Ownership Rules:** engineering/admin
- **Data Lifecycle:** added on provider integration → default/active → deprecated on provider sunset, per `12-AI-INTEGRATION-BIBLE.md` §14

### AI_Requests
- **Parent Tables:** Users, AI_Models, Prompt_Templates
- **Child Tables:** AI_Costs
- **One-to-One:** AI_Requests ↔ AI_Costs
- **One-to-Many:** Users → AI_Requests, AI_Models → AI_Requests
- **Cascade Behavior:** `SET NULL` on Users delete (anonymization path — the usage record and its cost data outlive the account for financial/analytics integrity); `RESTRICT` on AI_Models/Prompt_Templates delete
- **Soft Delete:** no — immutable log row
- **Ownership Rules:** system-written only
- **Data Lifecycle:** created per Gateway call → retained per the shorter AI-content retention window (`12-AI-INTEGRATION-BIBLE.md` §8) → redacted-content fields purged first, aggregate metadata retained longer for cost/analytics

### AI_Usage
- **Parent Tables:** Users
- **Child Tables:** none
- **One-to-Many:** Users → AI_Usage (one row per billing period)
- **Cascade Behavior:** `CASCADE` on Users delete (anonymization path) — unlike AI_Requests, this is a rolling quota counter with no independent long-term reporting value once the account is gone
- **Soft Delete:** no — rows are period-scoped and naturally superseded each billing cycle
- **Ownership Rules:** system-written only
- **Data Lifecycle:** created at period start → incremented continuously → reconciled against the Redis fast-path → retained briefly past period-end for billing dispute resolution, then archived

### AI_Costs
- **Parent Tables:** AI_Requests
- **Child Tables:** none
- **One-to-One:** AI_Requests ↔ AI_Costs
- **Cascade Behavior:** `CASCADE` on AI_Requests delete (only reachable via the archival path, since AI_Requests itself is not user-delete-cascaded)
- **Soft Delete:** not applicable — financial-adjacent, immutable once written
- **Ownership Rules:** system-written; read restricted to finance/admin
- **Data Lifecycle:** created alongside its AI_Requests row → retained for cost-reporting/financial reconciliation per finance retention needs, independent of AI_Requests' shorter content-retention window

### Prompt_Templates
- **Parent Tables:** none
- **Child Tables:** AI_Requests (referenced, not owned)
- **One-to-Many:** Prompt_Templates → AI_Requests
- **Cascade Behavior:** `RESTRICT` while any AI_Requests reference the template
- **Soft Delete:** no — deactivated via `is_active`, versioned rather than overwritten
- **Ownership Rules:** engineering, changes reviewed like code (`12-AI-INTEGRATION-BIBLE.md` §6)
- **Data Lifecycle:** new version created per prompt iteration → activated → superseded by the next version, retained for historical request traceability

---

## Domain: News (`news` schema)

### News
- **Parent Tables:** Users (author), News_Categories
- **Child Tables:** Comments
- **One-to-Many:** News → Comments
- **Many-to-Many:** News ↔ Tags (via News_Tag_Assignments)
- **Cascade Behavior:** `CASCADE` to Comments on News delete (only reachable pre-publish; published articles are archived, not deleted)
- **Soft Delete:** yes — `status = archived` is the effective soft delete for published content
- **Ownership Rules:** the authoring `content_editor` and `admin`
- **Data Lifecycle:** draft → in_review → published → optionally archived (remains readable via direct link, delisted from listings)

### News_Categories
- **Parent Tables:** none
- **Child Tables:** News
- **One-to-Many:** News_Categories → News
- **Cascade Behavior:** `RESTRICT` while any News references the category
- **Soft Delete:** no — deactivated, not deleted, while referenced
- **Ownership Rules:** `content_editor`/`admin`
- **Data Lifecycle:** stable reference data, rarely changed

### Tags
- **Parent Tables:** none
- **Child Tables:** News (via News_Tag_Assignments join table)
- **Many-to-Many:** Tags ↔ News (via News_Tag_Assignments)
- **Cascade Behavior:** `CASCADE` on the join-table row when either side is deleted; the `Tags` row itself is `RESTRICT`-protected only in the sense that an orphaned tag (zero assignments) is simply unused, not invalid — cleanup of unused tags is a periodic maintenance task, not a cascade rule
- **Soft Delete:** no
- **Ownership Rules:** `content_editor`/`admin`, and potentially author-suggested with editorial approval
- **Data Lifecycle:** created on first use → persists across many articles → pruned if unused for an extended period (maintenance job, not automatic cascade)

### Comments
- **Parent Tables:** Users, News, Comments (self-referencing parent for threads)
- **Child Tables:** Comments (replies)
- **One-to-Many:** News → Comments, Comments → Comments (replies), Users → Comments
- **Cascade Behavior:** `RESTRICT` on News delete once comments exist (forces the archive-not-delete pattern above); self-referencing replies are handled via soft delete (below), never hard-cascaded, to preserve thread structure
- **Soft Delete:** yes — `deleted_at`; a deleted comment's placeholder remains in the thread (moderation pattern: "[comment removed]") so replies to it aren't orphaned
- **Ownership Rules:** the commenting user (own content); `moderator`/`admin` (hide/remove any)
- **Data Lifecycle:** posted → visible → optionally flagged/hidden by moderation → soft-deleted on removal, retained for moderation audit history

---

## Domain: Files (`files` schema)

### Files
- **Parent Tables:** Users (uploader)
- **Child Tables:** Versions, Media; referenced by Lesson_Files, Library_Items, Products, avatars across domains
- **One-to-Many:** Files → Versions
- **One-to-One (optional):** Files ↔ Media
- **Cascade Behavior:** `RESTRICT` — a file referenced by any content table is never cascade-deleted; orphaned files (zero references) are cleaned up by a periodic maintenance job, not an automatic cascade, to avoid accidental data loss from a race condition
- **Soft Delete:** no formal soft-delete column — `scan_status = quarantined` functions as an effective access-block without deletion; genuinely orphaned files are hard-deleted from storage by the maintenance job only after a grace period
- **Ownership Rules:** the uploading user; content-domain editorial roles once attached to published content
- **Data Lifecycle:** uploaded → scanned → clean/quarantined → attached to content → retained for the life of that content's own lifecycle

### Uploads
- **Parent Tables:** Users, Files (nullable until finalized)
- **Child Tables:** none
- **One-to-One:** Uploads ↔ Files (once completed)
- **Cascade Behavior:** `CASCADE` on Users delete (anonymization path); no cascade impact on Files (the relationship is Uploads → Files, not the reverse)
- **Soft Delete:** no — expired/abandoned upload sessions are hard-deleted by a cleanup job
- **Ownership Rules:** the uploading user
- **Data Lifecycle:** created at presigned-URL issuance → completed or expired → purged shortly after resolution (this is a transient tracking table, not a durable record)

### Media
- **Parent Tables:** Files
- **Child Tables:** none (referenced by Lessons.video_media_id)
- **One-to-One:** Files ↔ Media
- **Cascade Behavior:** `CASCADE` on Files delete (only reachable via the orphan-cleanup maintenance path)
- **Soft Delete:** no
- **Ownership Rules:** same as parent Files
- **Data Lifecycle:** created alongside transcoding of a video/audio file → status progresses pending → processing → ready → persists for the life of the parent File

### Versions
- **Parent Tables:** Files (current and previous)
- **Child Tables:** none
- **One-to-Many:** Files → Versions
- **Cascade Behavior:** `RESTRICT` — version history is preserved even if a newer version supersedes it, for rollback and historical-content-integrity purposes (e.g., what a certificate or purchase originally referenced)
- **Soft Delete:** no — versions are immutable historical snapshots by nature
- **Ownership Rules:** same as parent Files
- **Data Lifecycle:** created on file replacement → retained indefinitely alongside the current file, archived per `11-DATABASE-BIBLE.md` §15 once sufficiently old and unreferenced by any active entitlement

---

## Domain: Administration (`system` schema + cross-cutting `Notifications`/`Audit_Logs`)

*(Notifications and Audit_Logs are fully defined under Authentication above, per their `Users` foreign key; they are administratively managed and reviewed here.)*

### Settings
- **Parent Tables:** Users (updated_by, nullable)
- **Child Tables:** none
- **Cascade Behavior:** `SET NULL` on Users delete
- **Soft Delete:** no — a setting is current or removed outright; historical values are tracked via `Audit_Logs`, not a soft-delete column on this table
- **Ownership Rules:** `superadmin` only
- **Data Lifecycle:** created when a new configurable behavior is introduced → updated as needed → rarely removed (feature flags may be retired once the feature is fully rolled out or removed)

### Languages
- **Parent Tables:** none
- **Child Tables:** Translations
- **One-to-Many:** Languages → Translations
- **Cascade Behavior:** `RESTRICT` while any Translations reference the language
- **Soft Delete:** no — deactivated via `is_active`, never deleted while any translation content exists
- **Ownership Rules:** `admin`
- **Data Lifecycle:** added when a new locale is supported → active indefinitely once launched (removing platform language support is a rare, deliberate product decision, not routine)

### Translations
- **Parent Tables:** Languages
- **Child Tables:** none
- **One-to-Many:** Languages → Translations
- **Cascade Behavior:** `CASCADE` on Languages delete (only reachable in the rare full-language-removal case)
- **Soft Delete:** no — overwritten in place on content update
- **Ownership Rules:** `content_editor`/`admin`
- **Data Lifecycle:** created per translation key/language pair → updated as copy changes → removed only if the key itself is retired from the product

### Logs
- **Parent Tables:** none
- **Child Tables:** none
- **Cascade Behavior:** not applicable — standalone
- **Soft Delete:** no — retained per the 90-day operational log window (`11-DATABASE-BIBLE.md` §14), then hard-deleted/archived
- **Ownership Rules:** system-written; read restricted to engineering/admin
- **Data Lifecycle:** written per curated operational event → queried for debugging within retention window → purged/archived after

### Backups
- **Parent Tables:** none
- **Child Tables:** none
- **Cascade Behavior:** not applicable — standalone
- **Soft Delete:** no — a backup record is either current metadata or historical metadata; not deleted while within the backup retention schedule (`11-DATABASE-BIBLE.md` §13)
- **Ownership Rules:** system-written (backup process); read restricted to `admin`/infrastructure roles
- **Data Lifecycle:** created per backup event → verified via restore drill → retained per the 30-day/12-month schedule → purged in step with the underlying backup archive's own expiry

---

# PART 2 — DOMAIN RELATIONSHIP MAPS

## Authentication

```
Users ──┬──< User_Sessions ──< Refresh_Tokens
        ├──< Notifications
        ├──< Audit_Logs (as actor)
        └──< User_Roles >── Roles ──< Role_Permissions >── Permissions
```
Everything in every other domain ultimately traces an ownership edge back to `Users` here. This domain has no inbound dependencies from any other domain — it is the platform's root.

## Learning

```
Users ──< Enrollments >── Courses ──< Modules ──< Lessons ──┬──< Lesson_Files >── Files
                │      ▲                  │                  ├──< Lesson_Progress
                │      │                  │                  └──< Quizzes ──┬──< Quiz_Questions
                │      marketplace.Order_Items (nullable)                    └──< Quiz_Attempts >── Users
                └──< Certificates >───────┘
Courses ──> Categories
Courses ──> Users (instructor)
```

## Library

```
Users ──┬──< Downloads >── Library_Items ──> Authors
        ├──< Bookmarks >── Library_Items ──> Categories
        └──< Reading_Progress >── Library_Items ──> Files
```

## Marketplace

```
Users ──< Orders ──┬──< Order_Items >── Products ──> Categories
                    └──< Payments ──< Transactions
Orders ──> Coupons
```

## AI

```
Users ──< AI_Requests ──┬──> AI_Models ──> AI_Providers
                          ├──> Prompt_Templates
                          └──< AI_Costs
Users ──< AI_Usage
```

## News

```
Users (author) ──< News ──┬──< Comments ──> Users (commenter)
                            │        └──< Comments (replies, self-referencing)
                            ├──> News_Categories
                            └──< News_Tag_Assignments >── Tags
```

## Files

```
Users (uploader) ──< Files ──┬──< Versions
                               └──< Media
Files ──< referenced by Lesson_Files, Library_Items, Products, Authors.avatar, Users.avatar
Uploads ──> Users, Files
```

## Administration

```
Users ──< Audit_Logs (actor)
Users ──< Notifications
Users ──> Settings (updated_by)
Languages ──< Translations
Logs, Backups (standalone, system-written)
```

---

# PART 3 — CROSS-DOMAIN RELATIONSHIP OVERVIEW

- **Authentication is the universal root.** Every domain's ownership model traces back to `Users`; no domain is a dependency of Authentication.
- **Files and Categories are shared infrastructure, referenced by, never referencing, content domains.** Learning, Library, and Marketplace each point into `Files` and `Categories` independently; these two tables have no awareness of which domain is using them.
- **Content domains (Learning, Library, Marketplace, News) are peers.** None references another directly — a course does not reference a product, a library item does not reference a news article. Cross-domain product bundling (e.g., a course bundled with an e-book) is handled at the Marketplace layer via `Products`, not by adding direct foreign keys between the content domains themselves.
- **AI is a service layer, not a content domain.** It references `Users` for attribution but is not referenced by other domains' tables — features call the AI Gateway at the application layer (`12-AI-INTEGRATION-BIBLE.md` §2), keeping AI infrastructure decoupled from content schema.
- **Administration is observational and configurational, not a functional dependency.** `Audit_Logs`, `Notifications`, `Settings`, `Logs` reference other domains loosely (by ID, often without a hard FK, per `13-DATABASE-BLUEPRINT.md`'s `Audit_Logs.target_type`/`target_id` pattern) specifically so administrative/observability data never blocks or cascades with core business data changes.
- **Money (Marketplace) and Credentials (Learning's Certificates) are the two domains with the strictest `RESTRICT`-everywhere posture** — nothing in the financial ledger or the certification trail is ever cascade-deleted, reflecting their role as durable legal/reputational records.

---

# PART 4 — DEPENDENCY GRAPH

Top-level, domain-granularity view (arrow = "depends on" / "references"):

```
                        ┌────────────────┐
                        │ Authentication │
                        └───────▲────────┘
                                │
        ┌───────────┬──────────┼──────────┬───────────┬─────────────┐
        │           │          │          │           │             │
   ┌────┴────┐ ┌────┴────┐┌────┴────┐┌────┴────┐ ┌────┴────┐  ┌─────┴──────┐
   │ Learning│ │ Library │|Marketplace│  News   │ │   AI    │  │Administration│
   └────┬────┘ └────┬────┘└────┬────┘└────┬────┘ └─────────┘  └─────────────┘
        │           │          │          │
        └─────┬─────┴────┬─────┘          │
              │           │                │
        ┌─────┴─────┐┌────┴─────┐          │
        │   Files   ││Categories│◄─────────┘ (News uses its own News_Categories, not shared Categories)
        └───────────┘└──────────┘
```

`Authentication` has no incoming domain dependencies. `Files` and `Categories` have no outgoing dependencies into content domains — they are pure leaf/shared-infrastructure nodes. `AI` and `Administration` depend only on `Authentication`, never on content domains, keeping them independently deployable service layers.

---

# PART 5 — RECOMMENDED CREATION ORDER OF TABLES

Reflects true dependency order — a table is never created before every table it foreign-keys into:

1. **Foundational, no dependencies:** Users, Roles, Permissions, Categories, News_Categories, Authors, AI_Providers, Languages, Tags
2. **First-level dependents:** Role_Permissions, User_Roles, User_Sessions, Files, AI_Models, Translations, Settings
3. **Second-level dependents:** Refresh_Tokens, Notifications, Uploads, Media, Versions, Prompt_Templates
4. **Content root tables:** Courses, Library_Items, Products, News, AI_Requests
5. **Content structure tables:** Modules, News_Tag_Assignments
6. **Content leaf tables:** Lessons, Comments
7. **Lesson-dependent tables:** Lesson_Files, Quizzes
8. **Quiz-dependent tables:** Quiz_Questions
9. **Transactional/engagement tables:** Enrollments, Orders, Downloads, Bookmarks, Coupons, AI_Usage, AI_Costs
10. **Order-dependent tables:** Order_Items, Payments
11. **Payment-dependent tables:** Transactions
12. **Enrollment/attempt-dependent tables:** Lesson_Progress, Quiz_Attempts, Reading_Progress, Certificates
13. **Cross-cutting, created any time after Users exists:** Audit_Logs, Logs, Backups

---

# PART 6 — MIGRATION ORDER

Migrations are applied in the same dependency order as table creation (Part 5) — this is not a separate ordering, it is the same constraint expressed for the migration pipeline specifically:

- Migrations are grouped into the numbered phases above and applied phase-by-phase; a phase's migrations may run in any order relative to each other, but a later phase never runs before an earlier one completes.
- Each phase is a single atomic migration deployment per `11-DATABASE-BIBLE.md` §10 — additive changes within a phase ship together; any breaking change to an already-deployed table follows the expand-migrate-contract pattern independently of this initial creation ordering.
- Domain schemas (`auth`, `courses`, `library`, `marketplace`, `ai`, `news`, `files`, `system`) are created before any table within them — schema creation is phase 0, implicit and prerequisite to phase 1.
- Seed data (default Roles, Permissions, Languages, AI_Providers) is loaded immediately after its owning table's migration, within the same deployment, not as a separate later step — the platform should never be in a state where `Roles` exists but has zero rows.

---

# PART 7 — SAFE DELETION ORDER

The reverse of creation order, followed strictly when decommissioning test/staging data or executing a legitimate, approved hard-deletion (as opposed to the soft-delete paths used in normal operation):

1. Transactions
2. Payments, Order_Items
3. Orders, Downloads, Bookmarks, AI_Usage, AI_Costs, Coupons
4. Certificates, Quiz_Attempts, Lesson_Progress, Reading_Progress, Enrollments
5. Quiz_Questions
6. Quizzes, Lesson_Files
7. Lessons, Comments
8. Modules, News_Tag_Assignments
9. Courses, Library_Items, Products, News, AI_Requests
10. Refresh_Tokens, Notifications, Uploads, Media, Versions, Prompt_Templates
11. Role_Permissions, User_Roles, User_Sessions, Files, AI_Models, Translations, Settings
12. Users, Roles, Permissions, Categories, News_Categories, Authors, AI_Providers, Languages, Tags
13. Audit_Logs, Logs, Backups (deleted last, or more typically never deleted, only archived — included here only for completeness of a full environment teardown)

This order exists for controlled environment resets (staging/test), not as a production operational procedure — production data removal always follows the soft-delete and retention-schedule paths defined per table in Part 1, never a bulk deletion sweep.

---

# PART 8 — FUTURE EXPANSION NOTES

- New domains (a future Community/Forums feature, gamification/Achievements) attach to `Users` the same way every existing domain does, and to `Files`/`Categories` if they need media or taxonomy — the dependency graph in Part 4 gains new leaf branches, never new edges into `Authentication`.
- The `Tags` pattern (dedicated join table per content type, e.g., `News_Tag_Assignments`) is the template for extending tagging to Courses or Products later — a new `Course_Tag_Assignments` join table, not a change to `Tags` itself.
- The `Categories` shared-table pattern is the template for any future shared taxonomy need — new content domains should default to reusing `Categories` rather than inventing a parallel per-domain category table, unless the domain's categorization needs are genuinely distinct (as News's editorial categorization was judged to be).
- Vendor marketplace expansion (`Products.owner_id`) will introduce a `Payouts` table as a new child of `Users` and `Products` — it does not require restructuring any table defined in this document.

---

# PART 9 — DATABASE INTEGRITY RULES

- Every relationship depicted in Parts 1–2 is enforced by an actual database foreign key constraint — no relationship is "documentation only" without a matching schema-level constraint (`11-DATABASE-BIBLE.md` §5).
- Every foreign key has an explicit, deliberate `ON DELETE` action (`CASCADE`, `RESTRICT`, or `SET NULL`) as documented per table in Part 1 — no foreign key is left at an implicit/default action.
- Financial (`Orders`, `Payments`, `Transactions`) and credentialing (`Certificates`) tables default to `RESTRICT` universally — these domains never silently lose data through a cascade from an unrelated cleanup operation.
- Soft-deletable tables enforce their "live row" queries through a consistent `deleted_at IS NULL` (or equivalent status-based) filter, backed by the partial index strategy in `11-DATABASE-BIBLE.md` §8 — soft delete is a query-layer convention with index support, not merely an unindexed column.
- Immutable/append-only tables (`Audit_Logs`, `Transactions`) have their immutability enforced at the database role-grant level (`10-SECURITY-BIBLE.md` §18, `11-DATABASE-BIBLE.md` §9), not solely by application-layer discipline.

---

# PART 10 — REFERENTIAL INTEGRITY RULES

- No orphaned foreign key values are permitted at any point — every foreign key column either points to a valid parent row or is explicitly nullable and null.
- Junction/join tables (`Role_Permissions`, `News_Tag_Assignments`, future domain-specific tag/relation tables) always carry both sides as `NOT NULL` foreign keys with a composite unique constraint (or composite primary key) preventing duplicate relationship rows.
- Self-referencing hierarchies (`Categories.parent_category_id`, `Comments.parent_comment_id`) are constrained to prevent cycles at the application layer (a category cannot become its own ancestor) since a plain foreign key constraint cannot express acyclicity on its own.
- Cross-schema foreign keys (e.g., `courses.Courses.category_id → library.Categories.id` conceptually, though `Categories` is shared infrastructure not schema-namespaced under any single domain) are permitted per `11-DATABASE-BIBLE.md` §3, but cross-schema *writes* are not — a domain module only ever writes its own schema's tables, never reaching into another domain's tables directly even when a valid foreign key relationship exists.
- Price/value snapshotting (`Order_Items.unit_price_cents`) is a deliberate, sanctioned deviation from "always reference live data" — documented per-table in Part 1 wherever it applies, so it is never mistaken for a data-integrity bug.

---

# PART 11 — PERFORMANCE NOTES

- The relationships carrying the highest query frequency — `Lesson_Progress`, `Reading_Progress`, `AI_Requests` — are all leaf tables with no further children, keeping their write path free of cascading side-effects that would otherwise compound write latency.
- `Enrollments` and `Orders` sit at the center of the most joined-across queries (a user's dashboard needs both) — both are indexed on `user_id` as a first-class access pattern, not an afterthought.
- The shared `Categories` and `Files` tables, being read by every content domain, are the platform's most-referenced tables by foreign-key fan-in; they are prime, low-risk caching targets (§ `11-DATABASE-BIBLE.md` §11) precisely because their write frequency is low relative to their read frequency.
- Many-to-many joins (`Role_Permissions`, `News_Tag_Assignments`) are kept small and rarely change per row — safe to query directly without caching, unlike the high-cardinality progress/log tables.

---

# PART 12 — SCALING NOTES

- The dependency graph's tree-like shape (Authentication at the root, content domains as independent branches, Files/Categories as shared leaves) means each content domain can, if ever necessary, be split into its own physical database with only `Users`, `Files`, and `Categories` requiring cross-database reference resolution (via the application layer, not a cross-database foreign key) — the schema-per-domain organization in `11-DATABASE-BIBLE.md` §3 is deliberately structured to make this split possible later without a full redesign, even though it is not needed at launch.
- High-fan-out tables from `Users` (`Enrollments`, `Orders`, `AI_Requests`, `Notifications`) are the tables most likely to eventually need time-based partitioning or archiving (`11-DATABASE-BIBLE.md` §12, §15) as the platform's user base and their historical activity grow — this document's deletion/creation ordering (Parts 5–7) remains valid regardless of whether a given table is later partitioned, since partitioning is a physical storage decision, not a change to the logical relationships defined here.
- The strict domain-peer structure (Part 3) means scaling one domain's read/write load (e.g., Marketplace during a sale event) has no schema-level coupling that would force scaling an unrelated domain (e.g., Library) in lockstep.
