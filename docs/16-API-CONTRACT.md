# 16 — API Contract

Status: Official API specification for Phoenix. Governs every endpoint exposed by `apps/api` (per `09-PLATFORM-ARCHITECTURE.md` §6) and consumed by `apps/web`, `apps/admin`, and the future `apps/mobile` via `packages/api-client`. This is a specification document — no NestJS code, no OpenAPI/Swagger annotations, no SQL. All endpoints are versioned under `/api/v1` (see Versioning Strategy) and use REST conventions per API Naming Standards below.

Conventions used throughout this document:
- **Authentication Required** — whether a valid access token must be presented at all.
- **Authorization Required** — the specific role/permission (`10-SECURITY-BIBLE.md` §3) beyond authentication, or "Resource owner" for object-level checks.
- All timestamps in requests/responses are ISO 8601 UTC. All monetary values are integer cents plus an ISO currency code. All list endpoints follow the Pagination/Filtering/Sorting Standards defined at the end of this document unless stated otherwise.

---

# 1. Authentication

Base path: `/api/v1/auth`

### POST /auth/register
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** `email`, `password`, `display_name`, `locale` (optional)
- **Response Body:** `user_id`, `email`, `verification_required: true`
- **Success Codes:** 201 Created
- **Error Codes:** 400 (validation), 409 (email already registered — response shape identical to success per enumeration prevention, `15-SYSTEM-WORKFLOWS.md` §1)
- **Validation Rules:** email format + uniqueness, password policy (`10-SECURITY-BIBLE.md` §4), breached-password check
- **Rate Limits:** 5 requests / 15 min per IP
- **Audit Logging:** Yes — account creation event

### POST /auth/verify-email
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** `token`
- **Response Body:** `verified: true`
- **Success Codes:** 200 OK
- **Error Codes:** 400 (invalid/expired token)
- **Validation Rules:** token must be unexpired, unused, matching a real user
- **Rate Limits:** 10 requests / 15 min per IP
- **Audit Logging:** Yes — verification completion

### POST /auth/resend-verification
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** `email`
- **Response Body:** generic acknowledgment (enumeration-safe)
- **Success Codes:** 200 OK
- **Error Codes:** 400 (validation)
- **Validation Rules:** email format only; invalidates prior outstanding token on issuance
- **Rate Limits:** 3 requests / 15 min per IP and per account
- **Audit Logging:** Yes

### POST /auth/login
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** `email`, `password`, `mfa_code` (optional/conditional)
- **Response Body:** `access_token`, `user` (id, email, roles, locale); refresh token set via httpOnly cookie
- **Success Codes:** 200 OK
- **Error Codes:** 400 (validation), 401 (invalid credentials, generic), 423 (account locked), 428 (MFA required — response signals a second step)
- **Validation Rules:** credential format; account must not be suspended/deactivated
- **Rate Limits:** 10 requests / 15 min per IP, progressive lockout per account (`10-SECURITY-BIBLE.md` §2)
- **Audit Logging:** Yes — both success and failure

### POST /auth/oauth/:provider/callback
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `provider` (path — google, apple)
- **Request Body:** provider authorization code
- **Response Body:** same as `/auth/login`
- **Success Codes:** 200 OK
- **Error Codes:** 400 (invalid code), 401 (provider verification failed)
- **Validation Rules:** OAuth state/nonce verified to prevent CSRF on the callback
- **Rate Limits:** 10 requests / 15 min per IP
- **Audit Logging:** Yes

### POST /auth/refresh
- **Authentication Required:** No (uses refresh token cookie in place of access token)
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** none (refresh token read from httpOnly cookie)
- **Response Body:** `access_token`; new refresh token set via cookie
- **Success Codes:** 200 OK
- **Error Codes:** 401 (invalid/expired/reused token — reused triggers full session-family revocation)
- **Validation Rules:** token hash match, unexpired, unused, session not revoked
- **Rate Limits:** 30 requests / 15 min per session
- **Audit Logging:** Only on reuse-detection (security event); routine rotations are not individually audited

### POST /auth/logout
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (own session)
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** none
- **Success Codes:** 204 No Content
- **Error Codes:** none (idempotent — always succeeds)
- **Validation Rules:** none beyond authentication
- **Rate Limits:** standard general API limit
- **Audit Logging:** No (routine); logged if triggered as a security response

### POST /auth/logout-all
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** `sessions_revoked: number`
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** none beyond authentication
- **Rate Limits:** standard general API limit
- **Audit Logging:** Yes

### POST /auth/forgot-password
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** `email`
- **Response Body:** generic acknowledgment (enumeration-safe)
- **Success Codes:** 200 OK
- **Error Codes:** 400 (validation)
- **Validation Rules:** email format only; issuing a new token invalidates prior outstanding tokens
- **Rate Limits:** 3 requests / 15 min per IP and per account
- **Audit Logging:** Yes

### POST /auth/reset-password
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** `token`, `new_password`
- **Response Body:** `success: true`
- **Success Codes:** 200 OK
- **Error Codes:** 400 (invalid/expired token, weak password)
- **Validation Rules:** password policy (`10-SECURITY-BIBLE.md` §4); revokes all existing sessions on success
- **Rate Limits:** 5 requests / 15 min per IP
- **Audit Logging:** Yes

---

# 2. Users

Base path: `/api/v1/users`

### GET /users/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** `id`, `email`, `email_verified`, `roles`, `status`, `locale`, `created_at`
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard general API limit
- **Audit Logging:** No

### PATCH /users/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** `locale`, `timezone`, `notification_preferences` (email fields require re-verification, handled via a distinct sensitive-change path)
- **Response Body:** updated user object
- **Success Codes:** 200 OK
- **Error Codes:** 400 (validation), 401
- **Validation Rules:** field-level schema validation; email change specifically re-triggers Workflow 2
- **Rate Limits:** standard general API limit
- **Audit Logging:** Yes for sensitive fields only (email); no for cosmetic preferences

### POST /users/me/change-password
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** `current_password`, `new_password`
- **Response Body:** `success: true`
- **Success Codes:** 200 OK
- **Error Codes:** 400 (weak password), 401 (current password incorrect)
- **Validation Rules:** current password re-verified; new password against policy; revokes other sessions
- **Rate Limits:** 5 requests / 15 min per account
- **Audit Logging:** Yes

### GET /users
- **Authentication Required:** Yes
- **Authorization Required:** `user:list` (admin/support)
- **Request Parameters:** pagination, filter by `status`/`role`, search by email/name
- **Request Body:** none
- **Response Body:** paginated list of user summaries
- **Success Codes:** 200 OK
- **Error Codes:** 403
- **Validation Rules:** filter values validated against allowed enums
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No (read-only admin listing)

### GET /users/:id
- **Authentication Required:** Yes
- **Authorization Required:** `user:read` (admin/support)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** full user record (admin view, including status/role history summary)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No (read); logged only if this view precedes a mutating admin action, per that action's own entry

### PATCH /users/:id/status
- **Authentication Required:** Yes
- **Authorization Required:** `user:ban` (admin)
- **Request Parameters:** `id` (path)
- **Request Body:** `status` (active/suspended/deactivated), `reason`
- **Response Body:** updated status
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409 (invalid transition)
- **Validation Rules:** status transition must be valid per account lifecycle
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory, with before/after diff

### PATCH /users/:id/roles
- **Authentication Required:** Yes
- **Authorization Required:** `user:assign_role` (superadmin)
- **Request Parameters:** `id` (path)
- **Request Body:** `roles` (full replacement set)
- **Response Body:** updated role list
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 400 (unknown role)
- **Validation Rules:** role set must reference existing `Roles`; admin-capable role grants require the actor to hold `superadmin`
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory

---

# 3. Profiles

Base path: `/api/v1/profiles` — the public-facing view distinct from `/users/me` (account/security data).

### GET /profiles/:userId
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `userId` (path)
- **Request Body:** none
- **Response Body:** `display_name`, `avatar_url`, `bio`, public achievement/certificate summary (only public-safe fields)
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### PATCH /profiles/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** `display_name`, `bio`
- **Response Body:** updated profile
- **Success Codes:** 200 OK
- **Error Codes:** 400, 401
- **Validation Rules:** length/character constraints on display name and bio
- **Rate Limits:** standard general API limit
- **Audit Logging:** No

### POST /profiles/me/avatar
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** `file_id` (from a completed Files upload)
- **Response Body:** `avatar_url`
- **Success Codes:** 200 OK
- **Error Codes:** 400 (invalid/unscanned file), 401
- **Validation Rules:** referenced file must belong to the requesting user and be `scan_status = clean`
- **Rate Limits:** 10 requests / hour per account
- **Audit Logging:** No

---

# 4. Courses

Base path: `/api/v1/courses`

### GET /courses
- **Authentication Required:** No
- **Authorization Required:** None (published only); instructors/admins see their own drafts additionally when authenticated
- **Request Parameters:** pagination, filter by `category`, `price` range, search query
- **Request Body:** none
- **Response Body:** paginated list of course summaries
- **Success Codes:** 200 OK
- **Error Codes:** none (empty list on no match)
- **Validation Rules:** filter values validated
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### GET /courses/:slug
- **Authentication Required:** No
- **Authorization Required:** None (published); owner/editorial for drafts
- **Request Parameters:** `slug` (path)
- **Request Body:** none
- **Response Body:** full course detail including module/lesson outline (lesson content bodies excluded unless enrolled/preview)
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### POST /courses
- **Authentication Required:** Yes
- **Authorization Required:** `course:create` (instructor/content_editor)
- **Request Parameters:** none
- **Request Body:** `title`, `description`, `category_id`, `price_cents`
- **Response Body:** created course (status `draft`)
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403
- **Validation Rules:** title/description length, valid category reference
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes — course creation

### PATCH /courses/:id
- **Authentication Required:** Yes
- **Authorization Required:** `course:edit` (owning instructor or `content_editor`/`admin`)
- **Request Parameters:** `id` (path)
- **Request Body:** any editable field subset
- **Response Body:** updated course
- **Success Codes:** 200 OK
- **Error Codes:** 400, 403, 404
- **Validation Rules:** field-level schema; structural changes (modules) restricted once enrollments exist (`14-DATABASE-RELATIONSHIPS.md` Modules entry)
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes for status-affecting changes; No for minor content edits

### POST /courses/:id/submit-review
- **Authentication Required:** Yes
- **Authorization Required:** owning instructor
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** updated status `in_review`
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409 (incomplete course)
- **Validation Rules:** required fields/structure completeness check
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### POST /courses/:id/publish
- **Authentication Required:** Yes
- **Authorization Required:** `course:publish` (content_editor/admin) — see Workflow 21
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** updated status `published`, `published_at`
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409
- **Validation Rules:** must be in `in_review` status
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory

### POST /courses/:id/archive
- **Authentication Required:** Yes
- **Authorization Required:** `course:archive` (owning instructor or admin)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** updated status `archived`
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none — existing enrollees retain access per `14-DATABASE-RELATIONSHIPS.md` Courses entry
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

---

# 5. Lessons

Base path: `/api/v1/courses/:courseId/modules/:moduleId/lessons`

### GET /courses/:courseId/modules/:moduleId/lessons
- **Authentication Required:** No (metadata only) / Yes (for content resolution)
- **Authorization Required:** enrollment required for non-preview lesson content
- **Request Parameters:** `courseId`, `moduleId` (path)
- **Request Body:** none
- **Response Body:** ordered list of lesson summaries (title, type, duration, `is_preview`)
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard API limit
- **Audit Logging:** No

### GET /lessons/:id
- **Authentication Required:** Conditional (required unless `is_preview = true`)
- **Authorization Required:** Active enrollment in the parent course, or owning instructor/editorial role
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** full lesson content (body, signed video/resource URLs), plus **`quiz_id`** (added Phase 28 — the lesson's Quiz id if `content_type = quiz`, else `null`; never includes question content itself, only the id needed to call `GET /progress/quizzes/:quizId` §7)
- **Success Codes:** 200 OK
- **Error Codes:** 401, 403 (not enrolled), 404
- **Validation Rules:** entitlement check per `15-SYSTEM-WORKFLOWS.md` §9
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /courses/:courseId/modules/:moduleId/lessons
- **Authentication Required:** Yes
- **Authorization Required:** owning instructor / `content_editor`
- **Request Parameters:** `courseId`, `moduleId` (path)
- **Request Body:** `title`, `content_type`, `body`, `video_media_id` (optional), `is_preview`
- **Response Body:** created lesson
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403, 404
- **Validation Rules:** content_type-specific field requirements
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No (routine content authoring)

### PATCH /lessons/:id
- **Authentication Required:** Yes
- **Authorization Required:** owning instructor / `content_editor`
- **Request Parameters:** `id` (path)
- **Request Body:** editable field subset
- **Response Body:** updated lesson
- **Success Codes:** 200 OK
- **Error Codes:** 400, 403, 404
- **Validation Rules:** field-level schema
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /courses/:courseId/modules/:moduleId/lessons/reorder
- **Authentication Required:** Yes
- **Authorization Required:** owning instructor / `content_editor`
- **Request Parameters:** `courseId`, `moduleId` (path)
- **Request Body:** ordered array of `lesson_id`
- **Response Body:** updated ordering
- **Success Codes:** 200 OK
- **Error Codes:** 400 (incomplete/invalid set), 403
- **Validation Rules:** submitted set must exactly match existing lessons for the module; pre-publish only per `14-DATABASE-RELATIONSHIPS.md` Modules entry
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

---

# 6. Enrollments

Base path: `/api/v1/enrollments`

### POST /enrollments
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (self-enroll, free courses only — paid courses enroll exclusively via the Payment Success workflow)
- **Request Parameters:** none
- **Request Body:** `course_id`
- **Response Body:** created enrollment
- **Success Codes:** 201 Created
- **Error Codes:** 400 (paid course — must purchase), 404 (course not found/not published), 409 (already enrolled — returns existing enrollment)
- **Validation Rules:** course must be `published` and free
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### GET /enrollments/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** pagination, filter by `status`
- **Request Body:** none
- **Response Body:** paginated list of the user's enrollments with course summary and completion percent
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /enrollments/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner or `enrollment:read` (admin/support)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** full enrollment detail
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /enrollments/:id/refund
- **Authentication Required:** Yes
- **Authorization Required:** `order:refund` (admin/support)
- **Request Parameters:** `id` (path)
- **Request Body:** `reason`
- **Response Body:** updated enrollment status `refunded`, triggers linked `Orders`/refund processing
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409 (already refunded)
- **Validation Rules:** must have a linked completed purchase
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory

---

# 7. Progress

Base path: `/api/v1/progress`

### PUT /progress/lessons/:lessonId
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (must hold active enrollment for the lesson's course)
- **Request Parameters:** `lessonId` (path)
- **Request Body:** `progress_percent`, `last_position_seconds`
- **Response Body:** updated progress record, updated course `completion_percent`
- **Success Codes:** 200 OK
- **Error Codes:** 400 (out-of-range values), 403 (not enrolled), 404
- **Validation Rules:** progress bounds validated; buffered/batched server-side per `15-SYSTEM-WORKFLOWS.md` §9
- **Rate Limits:** 60 requests / 5 min per user (high-frequency, intentionally generous)
- **Audit Logging:** No

### GET /progress/courses/:courseId
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** `courseId` (path)
- **Request Body:** none
- **Response Body:** per-lesson progress breakdown, aggregate completion percent
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /progress/quizzes/:quizId
- **Added:** Phase 28 (Educational Frontend Experience) — closes a real, confirmed gap: no endpoint previously existed for a learner to fetch a quiz's questions before submitting (the codebase's own `apps/web` lesson page had documented this exact block since an earlier phase, rather than guess at an endpoint or invent a relation). Minimal, additive, read-only; reuses `POST .../attempts`' own entitlement rule unchanged.
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (active enrollment in the quiz's lesson's course — identical rule to the attempts endpoint below)
- **Request Parameters:** `quizId` (path)
- **Request Body:** none
- **Response Body:** `id`, `title`, `passing_score_percent`, `max_attempts`, `questions` (each: `id`, `prompt`, `question_type`, `options`, `position`) — **`correct_answer` is never included**, stripped server-side before this response is built
- **Success Codes:** 200 OK
- **Error Codes:** 403 (not enrolled), 404
- **Validation Rules:** none
- **Rate Limits:** 60 requests / 5 min per user (same generous tier as lesson progress — viewing a quiz is a routine read, not the sensitive submit action below)
- **Audit Logging:** No

### POST /progress/quizzes/:quizId/attempts
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (active enrollment)
- **Request Parameters:** `quizId` (path)
- **Request Body:** `answers` (structured submission)
- **Response Body:** `score_percent`, `passed`, per-question correctness (post-submission only)
- **Success Codes:** 201 Created
- **Error Codes:** 400 (malformed submission), 403 (not enrolled), 409 (attempt limit exceeded)
- **Validation Rules:** answer set must match question set; attempt-count checked before scoring
- **Rate Limits:** 10 requests / 15 min per user
- **Audit Logging:** No (routine); flagged separately on abuse-pattern detection
- **Side effect (Phase 29):** a `passed: true` attempt marks the quiz's own lesson complete — reuses the exact same `LessonProgress` upsert + `Enrollment.completionPercent` recompute + notify + `certificatesService.issueForEnrollment` flow `PUT /progress/lessons/:lessonId` already uses (no parallel completion mechanism). A failed attempt has no effect on lesson/course completion.

---

# 8. Certificates

Base path: `/api/v1/certificates`

### GET /certificates/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** pagination
- **Request Body:** none
- **Response Body:** list of the user's earned certificates
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /certificates/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** certificate detail, signed PDF download URL
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /certificates/verify/:certificateNumber
- **Authentication Required:** No
- **Authorization Required:** None (public verification)
- **Request Parameters:** `certificateNumber` (path)
- **Request Body:** none
- **Response Body:** `valid: boolean`, holder display name, course title, issued date only (no other user data, per `13-DATABASE-BLUEPRINT.md` Certificates security notes)
- **Success Codes:** 200 OK
- **Error Codes:** 404 (not found/invalid)
- **Validation Rules:** none
- **Rate Limits:** 20 requests / 15 min per IP (enumeration-scraping protection)
- **Audit Logging:** No

---

# 9. Library

Base path: `/api/v1/library`

### GET /library/items
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** pagination, filter by `category`, `author`, search query
- **Request Body:** none
- **Response Body:** paginated list of library item summaries
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** filter values validated
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### GET /library/items/:slug
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `slug` (path)
- **Request Body:** none
- **Response Body:** full item detail; download/read action links only resolve for entitled users
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### POST /library/items/:id/access
- **Authentication Required:** Yes
- **Authorization Required:** entitlement check (free item, or completed purchase)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** signed, short-lived, watermarked delivery URL
- **Success Codes:** 200 OK
- **Error Codes:** 402 (purchase required), 404
- **Validation Rules:** entitlement per `15-SYSTEM-WORKFLOWS.md` §12
- **Rate Limits:** 20 requests / hour per user (prevents URL-refresh abuse)
- **Audit Logging:** No (recorded in `Downloads`, not the security audit log, unless flagged anomalous)

### POST /library/items/:id/bookmark
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** `bookmarked: true`
- **Success Codes:** 201 Created
- **Error Codes:** 404, 409 (already bookmarked — idempotent success)
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### DELETE /library/items/:id/bookmark
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** none
- **Success Codes:** 204 No Content
- **Error Codes:** 404 (no-op, idempotent)
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### PUT /library/items/:id/progress
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner, entitlement check
- **Request Parameters:** `id` (path)
- **Request Body:** `last_position`
- **Response Body:** updated reading progress
- **Success Codes:** 200 OK
- **Error Codes:** 402, 404
- **Validation Rules:** bounds validation
- **Rate Limits:** 60 requests / 5 min per user
- **Audit Logging:** No

---

# 10. Marketplace

Base path: `/api/v1/marketplace`

### GET /marketplace/products
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** pagination, filter by `category`, `price` range, search
- **Request Body:** none
- **Response Body:** paginated list of product summaries
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** filter values validated
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### GET /marketplace/products/:slug
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `slug` (path)
- **Request Body:** none
- **Response Body:** full product detail
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### POST /marketplace/products
- **Authentication Required:** Yes
- **Authorization Required:** `product:create` (admin; future vendor role)
- **Request Parameters:** none
- **Request Body:** `title`, `description`, `category_id`, `price_cents`, `file_id`
- **Response Body:** created product (`draft`)
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403
- **Validation Rules:** field schema; referenced file must be `scan_status = clean`
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### PATCH /marketplace/products/:id
- **Authentication Required:** Yes
- **Authorization Required:** `product:edit` (admin/owner)
- **Request Parameters:** `id` (path)
- **Request Body:** editable field subset
- **Response Body:** updated product
- **Success Codes:** 200 OK
- **Error Codes:** 400, 403, 404
- **Validation Rules:** field schema; price changes do not retroactively affect existing `Order_Items` snapshots
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes for status/price changes

### GET /marketplace/categories
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** category tree
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

---

# 11. Orders

Base path: `/api/v1/orders`

### POST /orders
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** `items` (array of `product_id`, `quantity`), `coupon_code` (optional)
- **Response Body:** created order (`pending`), checkout session URL (provider-hosted)
- **Success Codes:** 201 Created
- **Error Codes:** 400 (invalid coupon, unavailable product), 409 (stale price re-validation failure)
- **Validation Rules:** server-side price/availability re-validation per `15-SYSTEM-WORKFLOWS.md` §13; total computed server-side only
- **Rate Limits:** 10 requests / 15 min per user
- **Audit Logging:** Yes — order creation

### GET /orders/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** pagination, filter by `status`
- **Request Body:** none
- **Response Body:** paginated order history
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /orders/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner or `order:read` (admin/support)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** full order detail with line items
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /admin/orders
- **Authentication Required:** Yes
- **Authorization Required:** `order:list` (admin)
- **Request Parameters:** pagination, filter by `status`, `user`, date range
- **Request Body:** none
- **Response Body:** paginated order list, all users
- **Success Codes:** 200 OK
- **Error Codes:** 403
- **Validation Rules:** filter values validated
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No

---

# 12. Payments

Base path: `/api/v1/payments`

### POST /payments/webhooks/stripe
- **Authentication Required:** No (provider-signed payload in place of user auth)
- **Authorization Required:** None (signature verification is the trust boundary)
- **Request Parameters:** none
- **Request Body:** raw Stripe event payload
- **Response Body:** acknowledgment (`received: true`)
- **Success Codes:** 200 OK
- **Error Codes:** 400 (invalid signature — rejected before processing)
- **Validation Rules:** signature verified against Stripe's signing secret before payload is trusted (`10-SECURITY-BIBLE.md` §13); idempotency guard on event ID
- **Rate Limits:** exempt from standard per-user limits; provider-source IP allowlisted where feasible
- **Audit Logging:** Yes — payment confirmation, ledger entry, entitlement grant per `15-SYSTEM-WORKFLOWS.md` §14

### GET /payments/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (via parent order) or `payment:read` (admin)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** payment status, amount, provider reference (no card data ever present)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /admin/payments/:id/refund
- **Authentication Required:** Yes
- **Authorization Required:** `order:refund` (admin/support)
- **Request Parameters:** `id` (path)
- **Request Body:** `amount_cents` (optional, partial refund), `reason`
- **Response Body:** refund `Transactions` entry, updated order/payment status
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409 (already fully refunded)
- **Validation Rules:** refund amount cannot exceed original payment amount
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory

---

# 13. Files

Base path: `/api/v1/files`

### POST /files/upload-url
- **Authentication Required:** Yes
- **Authorization Required:** role-based upload quota check (`10-SECURITY-BIBLE.md` §14)
- **Request Parameters:** none
- **Request Body:** `filename`, `content_type`, `size_bytes`
- **Response Body:** presigned upload URL, `upload_id`
- **Success Codes:** 201 Created
- **Error Codes:** 400 (disallowed type/size), 403 (quota exceeded)
- **Validation Rules:** size/type checked against role-based limits before URL issuance
- **Rate Limits:** 30 requests / hour per user
- **Audit Logging:** No

### POST /files/:uploadId/complete
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (uploader)
- **Request Parameters:** `uploadId` (path)
- **Request Body:** none
- **Response Body:** created `Files` record, `scan_status: pending`
- **Success Codes:** 201 Created
- **Error Codes:** 400 (upload not found in storage), 404
- **Validation Rules:** content-inspection (magic-byte) validation server-side; queues malware scan
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No (logged on scan result, not on this step)

### GET /files/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner or entitled consumer of the content the file is attached to
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** file metadata, signed access URL (if entitled and `scan_status = clean`)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 425 (still scanning)
- **Validation Rules:** entitlement resolved per the owning content's own access rules
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

---

# 14. Media

Base path: `/api/v1/media`

### GET /media/:id
- **Authentication Required:** Yes
- **Authorization Required:** entitled consumer of the parent content
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** `transcoding_status`, signed HLS manifest URL (if ready)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 425 (still processing)
- **Validation Rules:** entitlement check identical to the parent lesson/content's own rule
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /admin/media/:id/reprocess
- **Authentication Required:** Yes
- **Authorization Required:** `media:reprocess` (admin)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** `transcoding_status: pending`
- **Success Codes:** 202 Accepted
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes

---

# 15. AI

Base path: `/api/v1/ai`

### POST /ai/requests
- **Authentication Required:** Yes
- **Authorization Required:** feature-specific permission (varies by AI feature) plus quota check
- **Request Parameters:** none
- **Request Body:** `feature`, `input` (schema varies per feature), `prompt_template_version` (implicit/default unless specified)
- **Response Body:** `request_id`, `status: processing` (for streaming, upgrades to a streamed connection)
- **Success Codes:** 202 Accepted (or 200 with immediate small completions)
- **Error Codes:** 400 (schema validation), 402/429 (quota exceeded), 503 (all providers unavailable)
- **Validation Rules:** input schema per `12-AI-INTEGRATION-BIBLE.md` §7; quota checked before dispatch (`12-AI-INTEGRATION-BIBLE.md` §9)
- **Rate Limits:** per-feature limits, stricter than general API (`12-AI-INTEGRATION-BIBLE.md` §10); session-level limiting for streaming features
- **Audit Logging:** Yes — full request/response logged to the dedicated AI usage log (`12-AI-INTEGRATION-BIBLE.md` §8)

### GET /ai/requests/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** request status and validated response (once complete)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No (read of an already-logged record)

### GET /ai/usage/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** current billing-period usage vs. quota
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

---

# 16. News

Base path: `/api/v1/news`

### GET /news
- **Authentication Required:** No
- **Authorization Required:** None (published only); editorial roles see drafts additionally when authenticated
- **Request Parameters:** pagination, filter by `category`, `tag`, search
- **Request Body:** none
- **Response Body:** paginated article summaries
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** filter values validated
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### GET /news/:slug
- **Authentication Required:** No
- **Authorization Required:** None (published); editorial for drafts
- **Request Parameters:** `slug` (path)
- **Request Body:** none
- **Response Body:** full article body, author, tags, category
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### POST /news
- **Authentication Required:** Yes
- **Authorization Required:** `news:create` (content_editor/admin)
- **Request Parameters:** none
- **Request Body:** `title`, `body`, `category_id`, `tags`
- **Response Body:** created article (`draft`)
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403
- **Validation Rules:** body sanitized (`10-SECURITY-BIBLE.md` §10); field schema
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No (routine drafting)

### PATCH /news/:id
- **Authentication Required:** Yes
- **Authorization Required:** `news:edit` (author/content_editor/admin)
- **Request Parameters:** `id` (path)
- **Request Body:** editable field subset
- **Response Body:** updated article
- **Success Codes:** 200 OK
- **Error Codes:** 400, 403, 404
- **Validation Rules:** same sanitization as create
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /news/:id/publish
- **Authentication Required:** Yes
- **Authorization Required:** `news:publish` (content_editor/admin)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** updated status `published`, `published_at`
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409
- **Validation Rules:** required fields complete
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory

---

# 17. Notifications

Base path: `/api/v1/notifications`

### GET /notifications/me
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** pagination, filter by `read`/`unread`
- **Request Body:** none
- **Response Body:** paginated notification list, unread count
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### PATCH /notifications/:id/read
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** updated notification
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /notifications/read-all
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** `marked_read: number`
- **Success Codes:** 200 OK
- **Error Codes:** 401
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### PATCH /notifications/preferences
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner
- **Request Parameters:** none
- **Request Body:** per-category channel opt-in/out map
- **Response Body:** updated preferences
- **Success Codes:** 200 OK
- **Error Codes:** 400, 401
- **Validation Rules:** category keys validated against known notification types
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

---

# 18. Administration

Base path: `/api/v1/admin`

### GET /admin/audit-logs
- **Authentication Required:** Yes
- **Authorization Required:** `audit:read` (admin/security)
- **Request Parameters:** pagination, filter by `actor`, `action`, `target_type`, date range
- **Request Body:** none
- **Response Body:** paginated audit log entries
- **Success Codes:** 200 OK
- **Error Codes:** 403
- **Validation Rules:** filter values validated
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No (reading the audit log is not itself separately audited, to avoid unbounded recursive logging; access to this endpoint is covered by general admin access logging)

### GET /admin/moderation/queue
- **Authentication Required:** Yes
- **Authorization Required:** `moderation:read` (moderator/admin)
- **Request Parameters:** pagination, filter by content type
- **Request Body:** none
- **Response Body:** items pending review (courses in_review, flagged comments, etc.)
- **Success Codes:** 200 OK
- **Error Codes:** 403
- **Validation Rules:** none
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No

### POST /admin/moderation/comments/:id/decision
- **Authentication Required:** Yes
- **Authorization Required:** `comment:moderate` (moderator/admin)
- **Request Parameters:** `id` (path)
- **Request Body:** `decision` (approve/hide), `reason`
- **Response Body:** updated comment status
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory

### GET /admin/analytics/overview
- **Authentication Required:** Yes
- **Authorization Required:** `analytics:read` (admin)
- **Request Parameters:** date range
- **Request Body:** none
- **Response Body:** aggregate platform metrics (DAU/MAU, revenue, completion rates) — served from a read replica, per `09-PLATFORM-ARCHITECTURE.md` §7
- **Success Codes:** 200 OK
- **Error Codes:** 403
- **Validation Rules:** date range bounds validated
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No

---

# 19. Settings

Base path: `/api/v1/settings`

### GET /settings/public
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** non-sensitive platform configuration exposed to clients (feature flags relevant to the frontend, display toggles)
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** none
- **Rate Limits:** standard public API limit, cached aggressively at the CDN edge
- **Audit Logging:** No

### GET /admin/settings
- **Authentication Required:** Yes
- **Authorization Required:** `settings:read` (superadmin)
- **Request Parameters:** none
- **Request Body:** none
- **Response Body:** full settings list (`is_sensitive` values redacted even here — true secrets never live in this table per `10-SECURITY-BIBLE.md` §17)
- **Success Codes:** 200 OK
- **Error Codes:** 403
- **Validation Rules:** none
- **Rate Limits:** standard admin API limit
- **Audit Logging:** No

### PATCH /admin/settings/:key
- **Authentication Required:** Yes
- **Authorization Required:** `settings:write` (superadmin)
- **Request Parameters:** `key` (path)
- **Request Body:** `value`
- **Response Body:** updated setting
- **Success Codes:** 200 OK
- **Error Codes:** 400 (invalid value for setting type), 403, 404
- **Validation Rules:** value validated against the setting's declared type/schema
- **Rate Limits:** standard admin API limit
- **Audit Logging:** Yes, mandatory, with before/after diff

---

# 20. Learning Paths

Base path: `/api/v1/learning-paths`. Added Phase 26 to close a real architecture gap Phase 25 discovered — a learning path (a curated, ordered sequence of Courses) previously existed only as documentation (`docs/content-library/learning-paths.md`), not a real API/database resource. Deliberately no `/learning-paths/:id/projects` endpoint — a path's projects are simply the union of its member courses' own `/courses/:id/projects` (§21), avoiding a redundant relation.

### GET /learning-paths
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** Pagination Standard; `status` implicitly filtered to `published` for unauthenticated/learner requests (same convention as `GET /courses`)
- **Request Body:** none
- **Response Body:** paginated list of learning paths (id, title, slug, description, status, course count)
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### GET /learning-paths/:slug
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `slug` (path)
- **Request Body:** none
- **Response Body:** full learning path including its ordered `courses` array (each with `position`)
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### POST /learning-paths
- **Authentication Required:** Yes
- **Authorization Required:** `learning_path:create` (content_editor/admin) — a learning path is an editorial/curricular object spanning multiple instructors' courses, so it follows the `news:create` precedent (content_editor/admin), not the `course:create` precedent (any instructor) — a single instructor should not unilaterally define a cross-course curriculum.
- **Request Parameters:** none
- **Request Body:** `title`, `description` (optional)
- **Response Body:** created learning path (`status: draft`)
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403
- **Validation Rules:** title required, non-empty; slug generated server-side (same `slugify` utility as Courses)
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes — creation event

### PATCH /learning-paths/:id
- **Authentication Required:** Yes
- **Authorization Required:** `learning_path:create` (same role set — no separate edit permission, matching the platform's existing convention of not minting a distinct `:edit` key per resource)
- **Request Parameters:** `id` (path)
- **Request Body:** `title`, `description` (all optional)
- **Response Body:** updated learning path
- **Success Codes:** 200 OK
- **Error Codes:** 400, 403, 404
- **Validation Rules:** same as create
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### POST /learning-paths/:id/publish
- **Authentication Required:** Yes
- **Authorization Required:** `learning_path:publish` (content_editor/admin — same precedent as `course:publish`/`news:publish`)
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** updated learning path (`status: published`)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404, 409 (path has zero courses)
- **Validation Rules:** at least one course must be attached before publishing
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### PUT /learning-paths/:id/courses
- **Authentication Required:** Yes
- **Authorization Required:** `learning_path:create` (same role set as create/edit)
- **Request Parameters:** `id` (path)
- **Request Body:** `courseIds` — an ordered array of course UUIDs; array order becomes `position`
- **Response Body:** updated learning path with its new ordered `courses` array
- **Success Codes:** 200 OK
- **Error Codes:** 400 (duplicate course ID in the array — rejected, not silently deduplicated, since a duplicate is almost always a client bug worth surfacing), 403, 404 (path or any listed course not found)
- **Validation Rules:** every course ID must reference a real, existing course; no duplicate course ID within the array — enforced both here (400 on a malformed request) and at the database level (`LearningPathCourse`'s `@@unique([learningPathId, courseId])`, the actual last-line guard)
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes — before/after course list

---

# 21. Projects

Base path: `/api/v1/courses/:courseId/projects` for project management (course-scoped, matching the existing `/courses/:courseId/modules/:moduleId/lessons` nesting convention), `/api/v1/projects/:projectId/submissions` for learner submissions. Added Phase 26 to close the second architecture gap Phase 25 discovered: project *briefs* already existed (as `Lesson` rows), but a learner's actual submission and its evaluation had no persistent representation anywhere.

### GET /courses/:courseId/projects
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `courseId` (path)
- **Request Body:** none
- **Response Body:** list of the course's published projects, ordered by `position`
- **Success Codes:** 200 OK
- **Error Codes:** 404 (course not found)
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### GET /projects/:id
- **Authentication Required:** No
- **Authorization Required:** None
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** full project detail, including its linked `sourceLesson` (id, title) if one exists — the client is responsible for fetching that lesson's full body via the existing `GET /lessons/:id`, never duplicated into this response
- **Success Codes:** 200 OK
- **Error Codes:** 404
- **Validation Rules:** none
- **Rate Limits:** standard public API limit
- **Audit Logging:** No

### POST /courses/:courseId/projects
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (the course's owning instructor) or content_editor/admin — same ownership-OR-editorial pattern as `POST /courses/:courseId/modules/:moduleId/lessons`, enforced in the service, not a standalone permission key
- **Request Parameters:** `courseId` (path)
- **Request Body:** `title`, `description` (optional), `instructions` (optional), `sourceLessonId` (optional — links to an existing project-brief Lesson instead of duplicating its content), `position` (optional)
- **Response Body:** created project (`status: draft`)
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403, 404 (course, or `sourceLessonId` if provided, not found), 409 (`sourceLessonId` already linked to another project — the unique constraint's surfaced error)
- **Validation Rules:** title required; if `sourceLessonId` provided, that lesson must belong to the same course
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### POST /courses/:courseId/projects/:id/publish
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner or content_editor/admin (same pattern as above)
- **Request Parameters:** `courseId`, `id` (path)
- **Request Body:** none
- **Response Body:** updated project (`status: published`)
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none beyond ownership
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes

### POST /projects/:id/submissions
- **Authentication Required:** Yes
- **Authorization Required:** None beyond authentication — enforced instead as a business rule: the actor must hold an active `Enrollment` in the project's course (same "must be enrolled" precondition already implicit in `PUT /progress/lessons/:lessonId`)
- **Request Parameters:** `id` (path — project ID)
- **Request Body:** `content` (optional, text/URL) and/or `fileId` (optional, an already-uploaded File per the existing `/files/upload-url` → `/files/:uploadId/complete` flow) — at least one of the two required
- **Response Body:** created submission (`status: submitted`, `attemptNumber` auto-incremented from the actor's prior attempts on this project, if any)
- **Success Codes:** 201 Created
- **Error Codes:** 400 (neither `content` nor `fileId` provided), 403 (not enrolled in the project's course), 404 (project not found or not published)
- **Validation Rules:** at least one of `content`/`fileId`; project must be `published`
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes — submission event

### GET /projects/submissions/me
- **Authentication Required:** Yes
- **Authorization Required:** None — always scoped to the caller
- **Request Parameters:** Pagination Standard
- **Request Body:** none
- **Response Body:** paginated list of the caller's own submissions, each including its `evaluation` if one exists
- **Success Codes:** 200 OK
- **Error Codes:** none
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /courses/:courseId/projects/submissions
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (the course's owning instructor) or content_editor/admin/moderator — moderator gets the same narrow, read-only allowance already established for course-review visibility (`canViewAsModerator`), never a grading right
- **Request Parameters:** `courseId` (path); Pagination Standard; `projectId`, `status` (optional filters)
- **Request Body:** none
- **Response Body:** paginated list of submissions for the course's projects
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### GET /projects/submissions/:id
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (the submitting learner) or the course's owning instructor or content_editor/admin/moderator (read-only) — same ownership-OR-editorial-OR-moderator-read shape used throughout this section
- **Request Parameters:** `id` (path)
- **Request Body:** none
- **Response Body:** full submission detail including its evaluation if one exists
- **Success Codes:** 200 OK
- **Error Codes:** 403, 404
- **Validation Rules:** none
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** No

### POST /projects/submissions/:id/evaluate
- **Authentication Required:** Yes
- **Authorization Required:** Resource owner (the submission's project's course's owning instructor) or content_editor/admin — same ownership-OR-editorial pattern as grading is conceptually an edit action on course-owned content, not a standalone permission
- **Request Parameters:** `id` (path — submission ID)
- **Request Body:** `scorePercent` (0-100), `passed` (boolean), `feedback` (required, non-empty)
- **Response Body:** created evaluation (`method: manual`, `status: completed`); the parent submission's `status` is updated to `evaluated` in the same transaction
- **Success Codes:** 201 Created
- **Error Codes:** 400, 403, 404, 409 (submission already has an evaluation — resubmit via a new attempt instead of overwriting evaluation history)
- **Validation Rules:** `scorePercent` 0-100; `feedback` required; one evaluation per submission (enforced by `ProjectEvaluation.submissionId`'s unique constraint, the actual last-line guard)
- **Rate Limits:** standard authenticated API limit
- **Audit Logging:** Yes — evaluation event, including score and evaluator

---

# API Naming Standards

- Resource paths are plural nouns (`/courses`, `/orders`), never verbs — actions on a resource are sub-paths (`/courses/:id/publish`), not query parameters or alternate verbs in the URL.
- Path segments are `kebab-case` where multi-word (`/forgot-password`); JSON field names in request/response bodies are `snake_case`, matching the database column naming convention (`11-DATABASE-BIBLE.md` §2) so no translation layer is needed to reason about a field across the stack.
- Nested resources reflect true ownership (`/courses/:courseId/modules/:moduleId/lessons`) only where the child cannot meaningfully exist without the parent in the request context; otherwise a flat top-level resource with a filter is preferred (`/enrollments?course_id=`) to avoid deeply nested URLs.
- `me` is the standard convention for "the authenticated caller's own resource" (`/users/me`, `/orders/me`) rather than requiring the client to know and pass its own user ID.
- Admin-only endpoint groups are prefixed `/admin` for groups that are exclusively administrative (Administration, and admin-only actions within otherwise-public groups), making the authorization boundary visible in the URL itself as a documentation aid — this is a convenience convention, not a substitute for the actual server-side authorization check.

---

# Versioning Strategy

- All endpoints are versioned via URL path prefix: `/api/v1/...`. No unversioned endpoint is ever exposed.
- A new major version (`/api/v2`) is introduced only for breaking changes to an existing endpoint's contract; additive changes (new optional fields, new endpoints) ship within the current version.
- Both the current and immediately prior major version are supported concurrently during a defined deprecation window (minimum 6 months) before a prior version is retired, giving `apps/web`, `apps/admin`, and any future `apps/mobile` release time to migrate.
- Version deprecation is communicated via a response header (`Deprecation`, `Sunset`) on every call to a deprecated version, not solely through documentation, so client applications receive an automated signal.

---

# Pagination Standard

- All list endpoints use cursor-based pagination (`cursor`, `limit` query parameters) rather than offset-based, avoiding the performance degradation and page-drift issues offset pagination causes at scale on large, frequently-changing tables.
- Default `limit` is 20, maximum `limit` is 100 — requests exceeding the maximum are clamped, not rejected.
- Every paginated response includes a consistent envelope: the item array, a `next_cursor` (null when no further pages exist), and, where inexpensive to compute, a `total_count` (omitted on very large tables where an exact count would be a performance cost disproportionate to its value).

---

# Filtering Standard

- Filters are expressed as query parameters matching the field name (`?status=published&category=ai-tools`), combined with implicit AND logic across distinct parameters.
- Only fields explicitly documented as filterable per endpoint are accepted — an unrecognized filter parameter is rejected with a 400, not silently ignored, so clients get a clear signal of a typo or unsupported filter rather than confusingly unfiltered results.
- Range filters use a consistent `_from`/`_to` suffix convention (`price_from`, `price_to`, `created_from`, `created_to`).
- Full-text search parameters (`q`) are routed to the dedicated search index (Meilisearch, `09-PLATFORM-ARCHITECTURE.md` §7) for catalog endpoints (Courses, Library, Marketplace, News), not a database `ILIKE` query, keeping search relevance and performance consistent platform-wide.

---

# Sorting Standard

- Sorting uses a single `sort` query parameter with a field name and optional `-` prefix for descending order (`?sort=-created_at`, `?sort=price_cents`).
- Each endpoint documents its own allowlist of sortable fields; an unsupported sort field is rejected with a 400.
- A stable default sort is always applied even when the client specifies no `sort` parameter (typically `-created_at` or `-published_at`), so pagination cursors remain consistent across requests.

---

# Error Response Standard

Every error response shares one consistent envelope, regardless of endpoint:

- `error.code` — a stable, machine-readable string (e.g., `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `QUOTA_EXCEEDED`), not just the HTTP status number, so client code can branch on error type reliably across API versions.
- `error.message` — a human-readable, user-safe summary; never an internal exception message or stack trace (`10-SECURITY-BIBLE.md` §13).
- `error.details` — optional, structured field-level validation errors where applicable (e.g., `[{ field: "email", issue: "invalid_format" }]`).
- `error.request_id` — a correlation ID matching the platform's structured logging (`09-PLATFORM-ARCHITECTURE.md` §19), so a user-reported error can be traced to its exact server-side log entry without exposing any internal detail in the response itself.
- HTTP status codes are used consistently with their standard meaning: 400 (validation), 401 (not authenticated), 403 (authenticated but not authorized), 404 (not found — or authorized-but-hidden, deliberately indistinguishable from true not-found where enumeration is a concern), 409 (conflict/invalid state transition), 422 (semantically invalid despite well-formed syntax), 429 (rate limited), 5xx (server-side fault, always logged and alerted).

---

# Authentication Flow

1. Client obtains an access token via `/auth/login`, `/auth/oauth/:provider/callback`, or completes MFA if challenged.
2. Access token (short-lived JWT, `10-SECURITY-BIBLE.md` §7) is sent as a `Bearer` token on every subsequent authenticated request; refresh token is held in an httpOnly cookie (web) or secure device storage (mobile), never accessible to client-side script.
3. When an access token expires, the client calls `/auth/refresh` (using the refresh token automatically via cookie) to obtain a new access token without requiring the user to re-enter credentials.
4. On refresh-token reuse detection or explicit logout, all tokens for the affected session (or all sessions, for `/auth/logout-all`) are revoked server-side; the client must re-authenticate from `/auth/login`.
5. Every API request — regardless of endpoint — passes through the same signature/expiry/revocation check (`10-SECURITY-BIBLE.md` §7) before reaching any business logic; there is no endpoint-specific auth bypass.

---

# Rate Limiting Strategy

- Enforced at the API gateway layer, before business logic, per `10-SECURITY-BIBLE.md` §12: tiered by per-IP, per-account, and per-endpoint-class.
- Standard tiers referenced throughout this document: **public API limit** (generous, unauthenticated browse traffic), **general authenticated API limit** (moderate, routine account actions), **admin API limit** (moderate, trusted but still bounded to prevent runaway automation), and endpoint-specific tighter limits called out explicitly (auth endpoints, AI requests, certificate verification, file uploads) where the endpoint carries elevated abuse or cost risk.
- Every rate-limited response includes `Retry-After` and standard `X-RateLimit-Limit`/`X-RateLimit-Remaining` headers so well-behaved clients can self-throttle proactively rather than repeatedly hitting the limit.
- Sustained rate-limit violations feed into the platform's abuse-monitoring pipeline (`12-AI-INTEGRATION-BIBLE.md` §10, `09-PLATFORM-ARCHITECTURE.md` §19), distinct from the immediate per-request 429 response.

---

# Idempotency Rules

- All state-changing endpoints that could plausibly be retried by a client after an ambiguous network failure (order creation, payment-adjacent actions) accept an optional `Idempotency-Key` header; a repeated request with the same key returns the original result rather than creating a duplicate resource.
- Webhook-driven endpoints (`/payments/webhooks/stripe`) are idempotent by construction — keyed on the provider's own event ID, so redundant webhook delivery (which providers do by design, to guarantee at-least-once delivery) never double-processes a payment.
- `DELETE` and revocation-style endpoints (`/auth/logout`, `/library/items/:id/bookmark`) are naturally idempotent by the semantics of their action — a repeated call reaches the same end state without error, per `15-SYSTEM-WORKFLOWS.md` §5's logout example.
- Idempotency keys are scoped per-user and expire after a bounded window (24 hours), after which the same key may be reused for a genuinely new request.

---

# Future API Expansion Strategy

- New endpoint groups (a future Community/Discussion API, a Vendor API for the multi-vendor marketplace per `09-PLATFORM-ARCHITECTURE.md` §13) are added as new top-level resource groups following every standard in this document — naming, pagination, error format, rate-limiting tiers — rather than introducing group-specific conventions.
- Mobile-specific needs (push-token registration, biometric-backed refresh) extend the Authentication group with new endpoints under the same `/auth` path, not a parallel mobile-only API surface — `packages/api-client` ensures web, admin, and mobile consume one contract.
- GraphQL remains deliberately out of scope per `09-PLATFORM-ARCHITECTURE.md` §6; if a future admin-dashboard data-shaping need genuinely outgrows REST, it is evaluated as a scoped addition (e.g., a single GraphQL endpoint for complex analytics queries) rather than a wholesale API-style migration.
- Every new endpoint is authored against this contract's eleven required fields (HTTP Method through Audit Logging) as a pre-implementation design step — this document is the specification new endpoints are reviewed against, not a one-time snapshot.
