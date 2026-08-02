# 13 — Database Blueprint

Status: Master data design document. Governed by `11-DATABASE-BIBLE.md` (conventions, standards) and `10-SECURITY-BIBLE.md` (data protection). This is a design document, not an implementation artifact — no SQL, no Prisma schema. Every table below uses a UUIDv7 primary key named `id`, `created_at`/`updated_at` audit timestamps, and lives in the domain schema matching its section, per `11-DATABASE-BIBLE.md` §2–§3, unless stated otherwise.

---

# CORE TABLES

Schema: `auth`. Identity, access control, and platform-wide activity records — the foundation every other domain depends on.

## Users

- **Purpose:** The system of record for every human account on the platform — learners, instructors, staff, and admins share this one table.
- **Primary Key:** `id`
- **Foreign Keys:** none (root entity)
- **Important Columns:** `email` (unique), `email_verified_at`, `password_hash`, `display_name`, `avatar_file_id`, `locale`, `timezone`, `status` (active/suspended/deactivated), `deleted_at` (soft delete)
- **Relationships:** one-to-many with `User_Sessions`, `Refresh_Tokens`, `Enrollments`, `Orders`, `Notifications`; many-to-many with `Roles` via a `User_Roles` join table
- **Indexes:** unique on `email`; index on `status`; partial index on `deleted_at IS NULL`
- **Security Notes:** `password_hash` never leaves the Auth module boundary; email uniqueness check is timing-safe to avoid account-enumeration (`10-SECURITY-BIBLE.md` §2). Row is never hard-deleted — deletion requests soft-delete and trigger PII-scrubbing per `11-DATABASE-BIBLE.md` §14.

## Roles

- **Purpose:** The fixed catalog of roles defined in `09-PLATFORM-ARCHITECTURE.md` §5 (learner, instructor, admin, etc.).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `name` (unique, e.g. `admin`), `description`, `is_system_role` (prevents deletion of built-in roles)
- **Relationships:** many-to-many with `Users` (`User_Roles`), many-to-many with `Permissions` (`Role_Permissions`)
- **Indexes:** unique on `name`
- **Security Notes:** Only `superadmin` may create/modify roles; changes are written to `Audit_Logs`.

## User_Roles

- **Purpose:** Join table granting roles to users. Added during the Phase 3 (Authentication) implementation pass — `Users` and `Roles` had always documented a `User_Roles` many-to-many relationship in prose (see their `Relationships` fields above), but no formal table entry existed here, an omission of the same kind as the `Enrollments.purchase_id` inconsistency resolved during the Database Documentation Consistency Audit. Follows the `Role_Permissions` pattern exactly.
- **Primary Key:** composite (`user_id`, `role_id`)
- **Foreign Keys:** `user_id → Users.id`, `role_id → Roles.id`
- **Important Columns:** `granted_at`, `granted_by_id` (→ Users, nullable — null for the default role granted at registration)
- **Relationships:** resolves the many-to-many between `Users` and `Roles`
- **Indexes:** index on `role_id` (reverse lookups); primary key already covers `user_id` lookups
- **Security Notes:** Every change is audit-logged with actor (`granted_by_id`); role assignment is `superadmin`-only per `10-SECURITY-BIBLE.md` §3 and `16-API-CONTRACT.md` `PATCH /users/:id/roles`.

## Permissions

- **Purpose:** The catalog of fine-grained `resource:action` permission strings (`10-SECURITY-BIBLE.md` §3).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `key` (unique, e.g. `course:publish`), `description`, `domain` (which module owns this permission)
- **Relationships:** many-to-many with `Roles` via `Role_Permissions`
- **Indexes:** unique on `key`
- **Security Notes:** Permission keys are never reused for a different meaning once shipped — a retired permission is deprecated, not repurposed, to avoid silently changing access grants of roles that reference it historically in audit logs.

## Role_Permissions

- **Purpose:** Join table granting permissions to roles.
- **Primary Key:** composite (`role_id`, `permission_id`)
- **Foreign Keys:** `role_id → Roles.id`, `permission_id → Permissions.id`
- **Important Columns:** `granted_at`, `granted_by_id` (→ Users)
- **Relationships:** resolves the many-to-many between `Roles` and `Permissions`
- **Indexes:** index on `permission_id` (reverse lookups); primary key already covers `role_id` lookups
- **Security Notes:** Every change is audit-logged with actor (`granted_by_id`); this table is the actual authorization source of truth checked on every API request (`10-SECURITY-BIBLE.md` §3).

## User_Sessions

- **Purpose:** Tracks active login sessions per device, enabling per-device logout and concurrent-session limits (`10-SECURITY-BIBLE.md` §6).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`
- **Important Columns:** `device_label`, `user_agent`, `ip_address`, `last_active_at`, `expires_at`, `revoked_at`
- **Relationships:** one-to-many from `Users`; one-to-one with the active `Refresh_Tokens` row for that session
- **Indexes:** index on `user_id`; index on `expires_at` (cleanup jobs); partial index on `revoked_at IS NULL`
- **Security Notes:** `ip_address` is stored for security/anomaly review only, not exposed to the user beyond a coarse "last active from ~region"; session rows are retained briefly after revocation for audit purposes, then purged per retention policy.

## Refresh_Tokens

- **Purpose:** Server-side record backing the refresh-token rotation strategy (`10-SECURITY-BIBLE.md` §8).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `session_id → User_Sessions.id`
- **Important Columns:** `token_hash` (never plaintext), `previous_token_id` (rotation chain), `expires_at`, `used_at`, `revoked_at`, `revoked_reason`
- **Relationships:** one-to-one (current) with `User_Sessions`; self-referencing chain via `previous_token_id`
- **Indexes:** unique on `token_hash`; index on `session_id`; index on `expires_at`
- **Security Notes:** Only the hash is stored; reuse of an already-used token (`used_at` already set) triggers immediate revocation of the entire session family, per rotation-detection policy.

## Notifications

- **Purpose:** In-app notification center entries (`09-PLATFORM-ARCHITECTURE.md` §17).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`
- **Important Columns:** `type`, `title`, `body`, `link_url`, `read_at`, `channel` (in_app/email/push — which channel delivered this record), `source_event_id`
- **Relationships:** many-to-one from `Users`; conceptually linked to whatever domain event produced it (course published, order confirmed) via `source_event_id`, not a hard foreign key, to avoid coupling this table to every other domain
- **Indexes:** composite index on (`user_id`, `read_at`) for unread-count queries; index on `created_at` for pagination
- **Security Notes:** Notification body never contains sensitive data (full payment details, tokens) — only user-facing summary text; TTL-archived per `11-DATABASE-BIBLE.md` §15.

## Audit_Logs

- **Purpose:** The append-only security/admin audit trail required by `10-SECURITY-BIBLE.md` §18.
- **Primary Key:** `id`
- **Foreign Keys:** `actor_user_id → Users.id` (nullable — some events are system-initiated)
- **Important Columns:** `action`, `target_type`, `target_id`, `before_state`, `after_state`, `ip_address`, `occurred_at`
- **Relationships:** loosely references any table via `target_type`/`target_id` (deliberately not a hard FK — audit rows must outlive the referenced row even if it's later hard-deleted)
- **Indexes:** index on `actor_user_id`; index on (`target_type`, `target_id`); index on `occurred_at`
- **Security Notes:** No `UPDATE`/`DELETE` grant exists for this table at the application role level, including for `superadmin` — immutability is enforced at the database-role level, not just application logic (`10-SECURITY-BIBLE.md` §18).

---

# LEARNING

Schema: `courses`. Course authoring, delivery, progress tracking, and certification.

## Courses

- **Purpose:** The top-level learning product — a course a user enrolls in.
- **Primary Key:** `id`
- **Foreign Keys:** `instructor_id → Users.id`, `category_id → Categories.id`
- **Important Columns:** `title`, `slug` (unique), `description`, `status` (draft/in_review/published/archived), `price_cents`, `published_at`
- **Relationships:** one-to-many with `Modules`, `Enrollments`, `Certificates`; many-to-one with `Users` (instructor) and `Categories`
- **Indexes:** unique on `slug`; index on `status`; index on `instructor_id`
- **Security Notes:** Only the owning `instructor_id` or `content_editor`/`admin` roles may mutate; `published` status transition is audit-logged (`Audit_Logs`).

## Modules

- **Purpose:** A course's top-level content grouping (a "chapter").
- **Primary Key:** `id`
- **Foreign Keys:** `course_id → Courses.id`
- **Important Columns:** `title`, `position` (ordering), `description`
- **Relationships:** many-to-one with `Courses`; one-to-many with `Lessons`
- **Indexes:** composite index on (`course_id`, `position`)
- **Security Notes:** Reorder/edit operations restricted to the course's instructor or editorial roles, same as `Courses`.

## Lessons

- **Purpose:** An individual learning unit within a module (video, text, or quiz-bearing lesson).
- **Primary Key:** `id`
- **Foreign Keys:** `module_id → Modules.id`
- **Important Columns:** `title`, `position`, `content_type` (video/text/quiz), `body` (text content, nullable), `video_media_id → Media.id` (nullable), `duration_seconds`, `is_preview` (accessible without enrollment)
- **Relationships:** many-to-one with `Modules`; one-to-many with `Lesson_Files`, `Lesson_Progress`, `Quizzes`
- **Indexes:** composite index on (`module_id`, `position`)
- **Security Notes:** Video/file access is resolved through signed URLs (`Media`, `Files`) checked against enrollment status — `is_preview = false` lessons are never resolvable to a playable URL for a non-enrolled, non-instructor user.

## Lesson_Files

- **Purpose:** Downloadable resources attached to a lesson (slides, worksheets).
- **Primary Key:** `id`
- **Foreign Keys:** `lesson_id → Lessons.id`, `file_id → Files.id`
- **Important Columns:** `label`, `position`
- **Relationships:** many-to-one with `Lessons` and `Files`
- **Indexes:** index on `lesson_id`
- **Security Notes:** Download access gated by the same enrollment check as the parent lesson; served via signed URL, never a public bucket path.

## Enrollments

- **Purpose:** Records that a user has access to a course.
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `course_id → Courses.id`, `order_item_id → Order_Items.id` (nullable — free courses have no purchase; corrected from an earlier draft that referenced a non-existent `Purchases` table — the platform has no such table, per the Database Documentation Consistency Audit. `Order_Items` is the correct target because entitlement is granted per purchased line item, not per order or per payment, so a single multi-course order correctly produces one `Enrollment` per `Order_Item`, each traceable to the specific line item that unlocked it.)
- **Important Columns:** `enrolled_at`, `completed_at`, `completion_percent`, `status` (active/expired/refunded)
- **Relationships:** many-to-one with `Users`, `Courses`, and `Order_Items`; one-to-many with `Lesson_Progress`; one-to-one with a `Certificates` row once completed
- **Indexes:** unique composite on (`user_id`, `course_id`); index on `status`
- **Security Notes:** `status = refunded` immediately revokes content access at the API authorization layer, independent of whether the row is retained for historical reporting.

## Lesson_Progress

- **Purpose:** Per-user, per-lesson watch/read progress.
- **Primary Key:** `id`
- **Foreign Keys:** `enrollment_id → Enrollments.id`, `lesson_id → Lessons.id`
- **Important Columns:** `progress_percent`, `last_position_seconds`, `completed_at`
- **Relationships:** many-to-one with `Enrollments` and `Lessons`
- **Indexes:** unique composite on (`enrollment_id`, `lesson_id`); index on `lesson_id` (aggregate completion-rate reporting)
- **Security Notes:** High write-frequency table (per `11-DATABASE-BIBLE.md` §12, progress events are cached in Redis and flushed in batches); a candidate for future time-based partitioning as volume grows (`11-DATABASE-BIBLE.md` §12).

## Quizzes

- **Purpose:** A quiz attached to a lesson.
- **Primary Key:** `id`
- **Foreign Keys:** `lesson_id → Lessons.id`
- **Important Columns:** `title`, `passing_score_percent`, `max_attempts` (nullable = unlimited)
- **Relationships:** many-to-one with `Lessons`; one-to-many with `Quiz_Questions`, `Quiz_Attempts`
- **Indexes:** index on `lesson_id`
- **Security Notes:** Correct-answer data (in `Quiz_Questions`) is never included in any API response served before an attempt is submitted and scored.

## Quiz_Questions

- **Purpose:** Individual questions belonging to a quiz.
- **Primary Key:** `id`
- **Foreign Keys:** `quiz_id → Quizzes.id`
- **Important Columns:** `prompt`, `question_type` (single/multiple/text), `options` (structured choice set), `correct_answer`, `position`
- **Relationships:** many-to-one with `Quizzes`
- **Indexes:** composite index on (`quiz_id`, `position`)
- **Security Notes:** `correct_answer` is a restricted-access column at the application layer — the general course-read query path never selects it.

## Quiz_Attempts

- **Purpose:** A learner's submitted attempt at a quiz.
- **Primary Key:** `id`
- **Foreign Keys:** `quiz_id → Quizzes.id`, `user_id → Users.id`
- **Important Columns:** `answers` (structured submission), `score_percent`, `passed`, `submitted_at`
- **Relationships:** many-to-one with `Quizzes` and `Users`
- **Indexes:** composite index on (`user_id`, `quiz_id`)
- **Security Notes:** Scoring is computed and validated server-side only — the client never submits a pre-computed score; attempt-count limits (`Quizzes.max_attempts`) are enforced at write time, not just in the UI.

## Certificates

- **Purpose:** Proof of course completion, publicly verifiable.
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `course_id → Courses.id`, `enrollment_id → Enrollments.id`
- **Important Columns:** `certificate_number` (unique, public-facing verification code), `issued_at`, `pdf_file_id → Files.id`
- **Relationships:** one-to-one with `Enrollments`; many-to-one with `Users` and `Courses`
- **Indexes:** unique on `certificate_number`
- **Security Notes:** The public verification lookup exposes only certificate validity, holder name, and course title — no other user data — and is rate-limited to prevent enumeration scraping.

---

# LIBRARY

Schema: `library`. E-book catalog, reading access, and reading progress.

## Library_Items

- **Purpose:** An e-book (or other library media) in the catalog.
- **Primary Key:** `id`
- **Foreign Keys:** `author_id → Authors.id`, `category_id → Categories.id`, `file_id → Files.id`
- **Important Columns:** `title`, `slug` (unique), `description`, `status` (draft/published), `price_cents` (nullable — some items are free)
- **Relationships:** many-to-one with `Authors` and `Categories`; one-to-many with `Downloads`, `Bookmarks`, `Reading_Progress`
- **Indexes:** unique on `slug`; index on `status`; index on `category_id`
- **Security Notes:** `file_id` never resolves to a directly public URL — always through the signed, session-bound, watermarked delivery flow (`10-SECURITY-BIBLE.md` §14, `09-PLATFORM-ARCHITECTURE.md` §12).

## Categories

- **Purpose:** A shared, hierarchical category taxonomy reused across Library, Courses, and Products (each of those tables holds its own `category_id` foreign key into this one shared table, rather than each domain maintaining its own category list).
- **Primary Key:** `id`
- **Foreign Keys:** `parent_category_id → Categories.id` (nullable, self-referencing for sub-categories)
- **Important Columns:** `name`, `slug` (unique), `domain` (which area primarily owns this branch: courses/library/marketplace, for admin UI grouping only — not an access restriction)
- **Relationships:** self-referencing hierarchy; referenced by `Library_Items.category_id`, `Courses.category_id`, `Products.category_id`
- **Indexes:** unique on `slug`; index on `parent_category_id`
- **Security Notes:** None beyond standard admin-only mutation — this is non-sensitive reference data.

## Authors

- **Purpose:** Author/writer records for library items (distinct from platform `Users` — an author may or may not have a platform account).
- **Primary Key:** `id`
- **Foreign Keys:** `linked_user_id → Users.id` (nullable — set only if the author is also a registered platform user)
- **Important Columns:** `name`, `bio`, `avatar_file_id`
- **Relationships:** one-to-many with `Library_Items`
- **Indexes:** index on `linked_user_id`
- **Security Notes:** No sensitive data stored — public-facing by design.

## Downloads

- **Purpose:** A record of each time a user downloads a library item's file.
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `library_item_id → Library_Items.id`
- **Important Columns:** `downloaded_at`, `ip_address`
- **Relationships:** many-to-one with `Users` and `Library_Items`
- **Indexes:** composite index on (`user_id`, `library_item_id`); index on `downloaded_at`
- **Security Notes:** Used both for entitlement/audit purposes and to enforce any per-item download-count limits; `ip_address` retained for abuse investigation only.

## Bookmarks

- **Purpose:** A user's saved/favorited library items.
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `library_item_id → Library_Items.id`
- **Important Columns:** `created_at`
- **Relationships:** many-to-many join between `Users` and `Library_Items`
- **Indexes:** unique composite on (`user_id`, `library_item_id`)
- **Security Notes:** Purely user-preference data, no special handling beyond standard access control (a user only ever reads their own bookmarks).

## Reading_Progress

- **Purpose:** Tracks how far a user has read into a library item.
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `library_item_id → Library_Items.id`
- **Important Columns:** `last_position` (page/percent), `updated_at`
- **Relationships:** many-to-one with `Users` and `Library_Items`
- **Indexes:** unique composite on (`user_id`, `library_item_id`)
- **Security Notes:** Same high-write-frequency profile as `Lesson_Progress` — Redis-cached, batch-flushed (`11-DATABASE-BIBLE.md` §11).

---

# MARKETPLACE

Schema: `marketplace`. Digital products, ordering, and payment records.

## Products

- **Purpose:** A purchasable digital product (template, tool license, bundle).
- **Primary Key:** `id`
- **Foreign Keys:** `category_id → Categories.id`, `owner_id → Users.id` (nullable at launch — reserved for the future vendor marketplace per `09-PLATFORM-ARCHITECTURE.md` §13)
- **Important Columns:** `title`, `slug` (unique), `description`, `price_cents`, `status` (draft/published/archived), `file_id → Files.id` (nullable — bundles may reference multiple `Product_Files` instead)
- **Relationships:** one-to-many with `Order_Items`; many-to-one with `Categories`
- **Indexes:** unique on `slug`; index on `status`
- **Security Notes:** Purchasable file delivery follows the same signed-URL pattern as course/library content — never a directly public path.

## Orders

- **Purpose:** A user's purchase transaction envelope (may contain multiple items).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `coupon_id → Coupons.id` (nullable)
- **Important Columns:** `order_number` (unique, human-readable), `status` (pending/paid/refunded/cancelled), `total_cents`, `currency`
- **Relationships:** one-to-many with `Order_Items`; one-to-many with `Payments`
- **Indexes:** unique on `order_number`; index on `user_id`; index on `status`
- **Security Notes:** `status` transitions to `paid` **only** from a verified Stripe webhook event (`10-SECURITY-BIBLE.md` §13), never from a client-side confirmation call alone.

## Order_Items

- **Purpose:** Individual product line items within an order.
- **Primary Key:** `id`
- **Foreign Keys:** `order_id → Orders.id`, `product_id → Products.id`
- **Important Columns:** `unit_price_cents` (snapshotted at purchase time, independent of later `Products.price_cents` changes), `quantity`
- **Relationships:** many-to-one with `Orders` and `Products`
- **Indexes:** index on `order_id`; index on `product_id`
- **Security Notes:** Price is snapshotted, not recomputed from the live product record, so historical orders remain accurate regardless of later price changes — also prevents a class of price-manipulation bugs.

## Payments

- **Purpose:** A payment attempt/record against an order (an order may have more than one payment attempt if a first attempt fails).
- **Primary Key:** `id`
- **Foreign Keys:** `order_id → Orders.id`
- **Important Columns:** `provider` (Stripe), `provider_payment_id`, `status` (pending/succeeded/failed), `amount_cents`, `paid_at`
- **Relationships:** many-to-one with `Orders`; one-to-many with `Transactions`
- **Indexes:** index on `order_id`; unique on `provider_payment_id`
- **Security Notes:** No card/payment-method data is ever stored here or anywhere on Phoenix infrastructure — only the provider's reference ID, keeping the platform out of PCI-DSS card-data scope (`10-SECURITY-BIBLE.md` §18).

## Coupons

- **Purpose:** Discount codes applicable to orders.
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `code` (unique), `discount_type` (percent/fixed), `discount_value`, `max_redemptions`, `redeemed_count`, `expires_at`
- **Relationships:** referenced by `Orders.coupon_id`
- **Indexes:** unique on `code`; index on `expires_at`
- **Security Notes:** Redemption count is incremented atomically (row-level lock) to prevent a race condition allowing more redemptions than `max_redemptions` under concurrent use.

## Transactions

- **Purpose:** The immutable financial ledger entry — the authoritative record for accounting/reconciliation, distinct from the more application-facing `Payments` table.
- **Primary Key:** `id`
- **Foreign Keys:** `payment_id → Payments.id`
- **Important Columns:** `type` (charge/refund/payout), `amount_cents`, `currency`, `provider_reference`, `recorded_at`
- **Relationships:** many-to-one with `Payments`
- **Indexes:** index on `payment_id`; index on `recorded_at`
- **Security Notes:** Append-only, same immutability posture as `Audit_Logs`; retained per the 7-year financial-record schedule in `11-DATABASE-BIBLE.md` §14 regardless of account deletion status.

---

# AI

Schema: `ai`. Backs the AI Gateway defined in `12-AI-INTEGRATION-BIBLE.md`.

## AI_Providers

- **Purpose:** The catalog of integrated AI vendors (OpenAI, Anthropic, etc.).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `name`, `status` (active/degraded/disabled), `priority` (failover ordering)
- **Relationships:** one-to-many with `AI_Models`
- **Indexes:** index on `status`
- **Security Notes:** Provider credentials are **not** stored in this table — they live exclusively in the secrets manager (`10-SECURITY-BIBLE.md` §17); this table holds only non-secret operational metadata.

## AI_Models

- **Purpose:** Specific model versions offered by a provider (per `12-AI-INTEGRATION-BIBLE.md` §14).
- **Primary Key:** `id`
- **Foreign Keys:** `provider_id → AI_Providers.id`
- **Important Columns:** `model_identifier`, `capability` (chat/completion/embedding), `cost_per_1k_input_tokens`, `cost_per_1k_output_tokens`, `is_default`, `deprecated_at`
- **Relationships:** many-to-one with `AI_Providers`; referenced by `AI_Requests.model_id`
- **Indexes:** index on `provider_id`; partial index on `deprecated_at IS NULL`
- **Security Notes:** None beyond standard admin-only mutation.

## AI_Requests

- **Purpose:** One row per Gateway request/response, the core AI usage log (`12-AI-INTEGRATION-BIBLE.md` §8).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `model_id → AI_Models.id`, `prompt_template_id → Prompt_Templates.id`
- **Important Columns:** `feature`, `status` (success/error/moderation_blocked), `input_tokens`, `output_tokens`, `latency_ms`, `prompt_redacted`, `response_redacted`
- **Relationships:** many-to-one with `Users`, `AI_Models`, `Prompt_Templates`; one-to-one with an `AI_Costs` row
- **Indexes:** index on `user_id`; index on `feature`; index on `created_at`
- **Security Notes:** Full-content fields (`prompt_redacted`/`response_redacted`) are PII-scanned and redacted before write (`12-AI-INTEGRATION-BIBLE.md` §13); retained on a shorter schedule than general logs (§ below, Data Flow Overview).

## AI_Usage

- **Purpose:** Aggregated, quota-facing usage counters per user per billing period (the fast-path table checked before dispatching a request, per `12-AI-INTEGRATION-BIBLE.md` §9).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`
- **Important Columns:** `period_start`, `period_end`, `requests_used`, `tokens_used`, `quota_limit`
- **Relationships:** many-to-one with `Users`
- **Indexes:** unique composite on (`user_id`, `period_start`)
- **Security Notes:** Durable reconciliation counterpart to the Redis-backed real-time quota counter — periodic reconciliation job compares the two and alerts on drift.

## AI_Costs

- **Purpose:** Per-request cost attribution feeding the cost-tracking dashboard (`12-AI-INTEGRATION-BIBLE.md` §5).
- **Primary Key:** `id`
- **Foreign Keys:** `ai_request_id → AI_Requests.id`
- **Important Columns:** `provider_cost_usd`, `billed_at`
- **Relationships:** one-to-one with `AI_Requests`
- **Indexes:** index on `billed_at` (financial reporting rollups)
- **Security Notes:** Read access restricted to finance/admin roles — not exposed to the general engineering team beyond aggregate dashboards.

## Prompt_Templates

- **Purpose:** Versioned prompt definitions (`12-AI-INTEGRATION-BIBLE.md` §6).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `name`, `version`, `system_instructions`, `user_input_schema`, `is_active`
- **Relationships:** referenced by `AI_Requests.prompt_template_id`
- **Indexes:** unique composite on (`name`, `version`)
- **Security Notes:** Changes go through the same review process as code (source-controlled, PR-reviewed); this table mirrors the reviewed version, it is not directly hand-edited in production.

---

# NEWS

Schema: `news`. Editorial content.

## News

- **Purpose:** A published (or draft) news article.
- **Primary Key:** `id`
- **Foreign Keys:** `author_id → Users.id`, `category_id → News_Categories.id`
- **Important Columns:** `title`, `slug` (unique), `body`, `status` (draft/in_review/published), `published_at`
- **Relationships:** many-to-one with `Users` (author) and `News_Categories`; many-to-many with `Tags` via a dedicated `News_Tag_Assignments` join table; one-to-many with `Comments`
- **Indexes:** unique on `slug`; index on `status`; index on `published_at`
- **Security Notes:** Editorial workflow states enforced per `content_editor`/`admin` roles (`10-SECURITY-BIBLE.md` §3); `body` rich text is sanitized through the platform's allowlist sanitizer before storage (`10-SECURITY-BIBLE.md` §10).

## News_Categories

- **Purpose:** News-specific category taxonomy (kept separate from the shared `Categories` table used by Courses/Library/Marketplace, since news categorization has distinct editorial needs).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `name`, `slug` (unique)
- **Relationships:** one-to-many with `News`
- **Indexes:** unique on `slug`
- **Security Notes:** None beyond standard admin-only mutation.

## Tags

- **Purpose:** A shared, freeform tag vocabulary reusable across content types. Per `11-DATABASE-BIBLE.md` §5's prohibition on polymorphic associations, `Tags` itself holds no direct foreign key to tagged content — each domain that supports tagging (News at launch) has its own join table (`News_Tag_Assignments`) referencing `Tags.id`.
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `name` (unique), `slug` (unique)
- **Relationships:** many-to-many with `News` via `News_Tag_Assignments`
- **Indexes:** unique on `slug`
- **Security Notes:** None — non-sensitive reference data.

## Comments

- **Purpose:** User comments on news articles (and, by extension, other commentable content in the future, following the same one-join-table-per-domain pattern as `Tags`).
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `news_id → News.id`, `parent_comment_id → Comments.id` (nullable, self-referencing for threaded replies)
- **Important Columns:** `body`, `status` (visible/hidden/flagged), `deleted_at`
- **Relationships:** many-to-one with `Users` and `News`; self-referencing thread structure
- **Indexes:** index on `news_id`; index on `parent_comment_id`; index on `user_id`
- **Security Notes:** `body` sanitized identically to `News.body` (`10-SECURITY-BIBLE.md` §10); subject to the content-moderation pipeline; soft-deleted (not hard-deleted) so moderation history and threaded-reply integrity are preserved.

---

# FILES

Schema: `files`. Shared file/media infrastructure used across every domain (course videos, library e-books, avatars, uploads).

## Files

- **Purpose:** The canonical record of a stored object in object storage (`09-PLATFORM-ARCHITECTURE.md` §9) — the row every other domain table's `*_file_id` foreign key points to.
- **Primary Key:** `id`
- **Foreign Keys:** `uploaded_by_id → Users.id`
- **Important Columns:** `storage_key` (opaque object path, never the original filename), `original_filename`, `mime_type`, `size_bytes`, `scan_status` (pending/clean/quarantined), `visibility` (private/public)
- **Relationships:** one-to-many with `Versions`; referenced from `Lesson_Files`, `Library_Items`, `Products`, `Media`, avatars, etc.
- **Indexes:** index on `uploaded_by_id`; index on `scan_status`
- **Security Notes:** `scan_status` gates availability — a file is not resolvable to any download/view URL for anyone other than the uploader until `scan_status = clean` (`10-SECURITY-BIBLE.md` §15).

## Uploads

- **Purpose:** Tracks an in-progress upload session (from presigned-URL issuance to completion confirmation), distinct from the finalized `Files` record.
- **Primary Key:** `id`
- **Foreign Keys:** `user_id → Users.id`, `file_id → Files.id` (nullable until upload completes)
- **Important Columns:** `presigned_url_issued_at`, `expected_size_bytes`, `status` (pending/completed/expired/failed)
- **Relationships:** many-to-one with `Users`; one-to-one with `Files` once finalized
- **Indexes:** index on `user_id`; index on `status`
- **Security Notes:** Expired, never-completed upload sessions are purged on a schedule, preventing orphaned presigned URLs from lingering indefinitely.

## Media

- **Purpose:** Media-specific metadata layered on top of `Files` for playable/viewable content (video duration, resolution variants, transcoding status) — kept separate from `Files` so non-media files (PDFs, worksheets) don't carry unused media columns.
- **Primary Key:** `id`
- **Foreign Keys:** `file_id → Files.id`
- **Important Columns:** `media_type` (video/image/audio), `duration_seconds` (nullable), `transcoding_status` (pending/processing/ready/failed), `hls_manifest_key` (nullable)
- **Relationships:** one-to-one with `Files`; referenced by `Lessons.video_media_id`
- **Indexes:** unique on `file_id`; index on `transcoding_status`
- **Security Notes:** HLS manifest and segment access follow the same signed-URL, entitlement-checked delivery as the parent content (course enrollment, etc.).

## Versions

- **Purpose:** Version history for a file that has been replaced/updated (e.g., an instructor re-uploads a corrected video) — enables rollback and preserves the file a certificate or purchase was originally associated with.
- **Primary Key:** `id`
- **Foreign Keys:** `file_id → Files.id` (the current/canonical file), `previous_file_id → Files.id`
- **Important Columns:** `version_number`, `replaced_at`, `replaced_by_id → Users.id`
- **Relationships:** links two `Files` rows as a version chain
- **Indexes:** index on `file_id`
- **Security Notes:** Historical versions remain subject to the same access-control and retention rules as the current version — a version isn't a loophole around entitlement checks.

---

# SYSTEM

Schema: `system`. Platform-wide configuration and operational records.

## Settings

- **Purpose:** Platform-wide configuration values manageable without a deploy (feature flags, global toggles, display settings).
- **Primary Key:** `id`
- **Foreign Keys:** `updated_by_id → Users.id`
- **Important Columns:** `key` (unique), `value` (structured), `description`, `is_sensitive` (excludes from any general config-export endpoint)
- **Relationships:** standalone reference table
- **Indexes:** unique on `key`
- **Security Notes:** `superadmin`-only mutation; changes are audit-logged; `is_sensitive` settings (if any ever stored here, as opposed to the secrets manager) require additional access justification — as a rule, actual secrets never live here (`10-SECURITY-BIBLE.md` §17), only non-secret operational config.

## Languages

- **Purpose:** The catalog of supported platform languages (currently `ar`, `en`; extensible per `09-PLATFORM-ARCHITECTURE.md`'s i18n readiness goal).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `code` (unique, e.g. `ar`), `name`, `direction` (rtl/ltr), `is_active`
- **Relationships:** one-to-many with `Translations`
- **Indexes:** unique on `code`
- **Security Notes:** None — non-sensitive reference data, admin-only mutation.

## Translations

- **Purpose:** Key-based translation strings for platform UI copy managed outside of code (as opposed to the current Homepage's inline dictionary pattern) — used for content that content editors, not engineers, need to update.
- **Primary Key:** `id`
- **Foreign Keys:** `language_id → Languages.id`
- **Important Columns:** `key` (namespaced, e.g. `nav.home`), `value`
- **Relationships:** many-to-one with `Languages`
- **Indexes:** unique composite on (`language_id`, `key`)
- **Security Notes:** None — public, non-sensitive content; mutation restricted to `content_editor`/`admin`.

## Logs

- **Purpose:** Durable storage for a curated subset of operational logs that warrant database queryability beyond the log-aggregator's retention window (most logs live in the external aggregator per `09-PLATFORM-ARCHITECTURE.md` §19 — this table is not a general-purpose log sink).
- **Primary Key:** `id`
- **Foreign Keys:** none (system-level, not user-scoped)
- **Important Columns:** `level`, `source_service`, `message`, `context` (structured), `occurred_at`
- **Relationships:** standalone
- **Indexes:** index on `occurred_at`; index on `source_service`
- **Security Notes:** Never contains secrets, tokens, or unredacted PII — the same redaction discipline as `10-SECURITY-BIBLE.md` §18 applies before any row is written here.

## Backups

- **Purpose:** Metadata record of each backup/snapshot taken (not the backup data itself, which lives in encrypted storage per `10-SECURITY-BIBLE.md` §20) — supports the restore-drill verification process (`11-DATABASE-BIBLE.md` §13).
- **Primary Key:** `id`
- **Foreign Keys:** none
- **Important Columns:** `backup_type` (full/incremental/wal), `target` (database/object-storage), `storage_location`, `taken_at`, `verified_at`, `verification_status`
- **Relationships:** standalone
- **Indexes:** index on `taken_at`; index on `verification_status`
- **Security Notes:** `storage_location` is an opaque reference, not a direct credentialed path; access to this table itself is admin-restricted, consistent with the backup-access separation principle in `10-SECURITY-BIBLE.md` §20.

---

# Entity Relationship Overview

The schema is organized as one identity core (`auth`) that every domain schema references outward from, and never the reverse — no domain schema is a dependency of `auth`. Content domains (`courses`, `library`, `marketplace`, `news`) are peers of each other: none references another directly, keeping them independently evolvable. Two shared infrastructure schemas — `files` (all binary content) and a shared `Categories` table — are referenced *by* every content domain, avoiding duplicate taxonomy/storage tables per domain. The `ai` schema is a cross-cutting service layer, referencing `auth.Users` for attribution but not referenced *by* other domains directly — features call the AI Gateway at the application layer, not through database foreign keys into `ai` tables. `system` sits alongside everything as platform-wide configuration with no inbound dependencies from content domains.

At a glance:

```
auth.Users ──┬─< courses.Enrollments >── courses.Courses ──< courses.Modules ──< courses.Lessons
             ├─< marketplace.Orders >── marketplace.Order_Items ── marketplace.Products
             ├─< library.Downloads / Bookmarks / Reading_Progress >── library.Library_Items
             ├─< news.Comments >── news.News
             ├─< ai.AI_Requests
             ├─< auth.User_Sessions ── auth.Refresh_Tokens
             └─< auth.Notifications

files.Files ──< referenced by courses.Lesson_Files, library.Library_Items, marketplace.Products, ai avatars, etc.
Categories  ──< referenced by courses.Courses, library.Library_Items, marketplace.Products
```

---

# Data Flow Overview

1. **Identity flows outward, never inward.** A user authenticates once (`auth` schema); every other schema trusts the resulting `user_id` and role/permission grants rather than re-implementing identity.
2. **Content is authored, then consumed.** Courses/library items/products/news move through a `draft → review → published` lifecycle inside their owning schema before becoming visible to the catalog/search layer — the search index (Meilisearch, per `09-PLATFORM-ARCHITECTURE.md` §7) is a derived read model updated on publish events, never queried as the source of truth.
3. **Entitlement precedes delivery.** Every content-access path (lesson video, library file, product download) checks an entitlement record (`Enrollments`, `Downloads`/purchase history, `Order_Items`) before resolving a signed delivery URL from `files.Files` — files are never directly public.
4. **Money flows through a snapshot-then-ledger pattern.** `Order_Items` snapshots price at purchase time; `Payments` records the provider interaction; `Transactions` is the immutable ledger — three distinct tables because each answers a different question (what was bought, was it paid, what's the accounting record) and none should be reconstructed from the others under load.
5. **AI usage flows through metering before cost.** Every `AI_Requests` row is checked against `AI_Usage` quota state (Redis fast-path, this table as durable reconciliation) before dispatch, and produces an `AI_Costs` row after response — usage control happens before spend, not audited after the fact.
6. **Everything security-relevant flows to `Audit_Logs`; everything AI-relevant additionally flows to `AI_Requests`; everything else flows to the external log aggregator** — three distinct logging paths, each with its own retention and access profile (`10-SECURITY-BIBLE.md` §18, `12-AI-INTEGRATION-BIBLE.md` §8, `09-PLATFORM-ARCHITECTURE.md` §19), deliberately not merged into one undifferentiated log table.

---

# Scaling Considerations

- **Hottest write tables** (`Lesson_Progress`, `Reading_Progress`, `AI_Requests`, `Notifications`, `Audit_Logs`) are the first candidates for the caching-then-partitioning path defined in `11-DATABASE-BIBLE.md` §12 — progress events are Redis-buffered and batch-flushed before they ever threaten primary write throughput.
- **Read-heavy catalog tables** (`Courses`, `Library_Items`, `Products`, `News`) are cached at the Redis layer for published/listing views and served from read replicas for admin reporting, keeping the primary focused on write-path traffic (enrollments, orders, progress).
- **Shared `Categories` and `Files` tables** are read far more than written — safe, high-value caching targets with simple invalidation (invalidate on the rare admin edit).
- **`Audit_Logs`, `AI_Requests`, and `Logs`** are natural time-based partition candidates once volume justifies it (`11-DATABASE-BIBLE.md` §12) — partitioned by month, with the archiving policy (`11-DATABASE-BIBLE.md` §15) moving old partitions to cold storage rather than letting them grow the primary schema indefinitely.
- **`Quiz_Attempts` and `Downloads`** scale linearly with engagement, not user count alone — monitored separately from account-growth-driven scaling projections since a single highly-engaged cohort can generate outsized volume here.
- **Financial tables** (`Orders`, `Payments`, `Transactions`) prioritize integrity over raw throughput — scaling here leans on read replicas for reporting rather than any relaxation of transactional consistency, given the legal/accounting requirement for correctness (`11-DATABASE-BIBLE.md` §14).

---

# Future Expansion Strategy

- **Vendor marketplace:** `Products.owner_id` already anticipates multi-vendor selling (`09-PLATFORM-ARCHITECTURE.md` §13); expansion adds a `Payouts` table and vendor-specific reporting without restructuring existing product/order tables.
- **Mobile push notifications:** `Notifications.channel` already models delivery channel generically; adding `push` requires no schema change, only a new delivery-worker consumer (`09-PLATFORM-ARCHITECTURE.md` §17).
- **Additional languages:** `Languages`/`Translations` are designed to accept new rows, not new columns — a third language is data, not a migration.
- **Gamification (badges/achievements):** deliberately not included in this blueprint's launch scope; when added, it follows the established pattern — a new `Achievements` table plus a `User_Achievements` join table referencing `auth.Users`, without modifying `Users` itself.
- **Self-hosted/fine-tuned AI models:** `AI_Providers`/`AI_Models` already model provider-and-model as distinct, extensible catalogs (`12-AI-INTEGRATION-BIBLE.md` §16) — a self-hosted model is simply a new `AI_Providers` row with its own adapter, no schema change required.
- **Discussion/comments beyond News:** the `Comments` table's dedicated-join-table pattern (avoiding polymorphic associations, `11-DATABASE-BIBLE.md` §5) means extending comments to Courses or Library later requires a new `Course_Comment_Assignments`-style join, not a redesign of `Comments` itself.
- **Table growth is expected to proceed domain-by-domain**, matching the "one vertical slice at a time" rollout sequence recommended in `09-PLATFORM-ARCHITECTURE.md` — this blueprint defines the full target shape so each slice is built toward a known destination rather than accumulating schema debt from incremental, uncoordinated additions.
