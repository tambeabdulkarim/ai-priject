# 15 — System Workflows

Status: Official workflow reference for Phoenix. Describes how each major platform process moves through the system end to end — trigger through completion — governed by `09-PLATFORM-ARCHITECTURE.md` (architecture), `10-SECURITY-BIBLE.md` (security controls), `11-DATABASE-BIBLE.md`/`13-DATABASE-BLUEPRINT.md`/`14-DATABASE-RELATIONSHIPS.md` (data model), and `12-AI-INTEGRATION-BIBLE.md` (AI-specific workflows). This document describes behavior, not code.

---

## 1. User Registration

- **Trigger:** A visitor submits the registration form (email/password) or completes an OAuth provider consent flow.
- **Validation:** Email format and uniqueness (case-insensitive), password strength against the policy in `10-SECURITY-BIBLE.md` §4, breached-password check, required-field presence via the shared validation schema (`09-PLATFORM-ARCHITECTURE.md` §8).
- **Security Checks:** Rate limiting on the registration endpoint, CAPTCHA after repeated attempts from the same IP, identical response timing/shape regardless of whether the email already exists (`10-SECURITY-BIBLE.md` §2).
- **Database Tables Used:** `Users` (insert), `User_Roles` (default `learner` role grant), `Audit_Logs`.
- **API Modules:** AuthModule.
- **Background Jobs:** Email-verification-token generation and dispatch (async, does not block the registration response).
- **Notifications:** Welcome email + verification email (email channel only at this stage — in-app notifications require a session, which doesn't exist until first login).
- **Success Result:** Account created in an unverified state; user is either auto-logged-in with restricted access pending verification, or directed to check email, per product decision — either way, full platform access is gated on Email Verification (Workflow 2).
- **Failure Handling:** Validation errors returned field-by-field; duplicate-email attempts return the same generic response as success (enumeration prevention) but trigger a "someone tried to register with your email" notice to the existing account instead of creating a new one.
- **Audit Logging:** `Audit_Logs` entry for account creation, actor = the new user, source IP recorded.

---

## 2. Email Verification

- **Trigger:** User clicks the verification link containing a single-use token sent during Registration.
- **Validation:** Token exists, is unexpired, is unused, and matches the intended user record.
- **Security Checks:** Token is high-entropy and single-use; verification endpoint is rate-limited to prevent token brute-forcing; expired tokens are rejected outright, not silently extended.
- **Database Tables Used:** `Users` (update `email_verified_at`), `Audit_Logs`.
- **API Modules:** AuthModule.
- **Background Jobs:** none required synchronously; a cleanup job periodically purges long-expired, never-used verification tokens.
- **Notifications:** Confirmation notification (in-app, now that verification may coincide with first authenticated session) that the account is fully active.
- **Success Result:** `email_verified_at` set; full-access restrictions (if any were applied at registration) are lifted.
- **Failure Handling:** Expired/invalid token surfaces a clear re-send-verification option rather than a dead end; re-sending invalidates the previous token.
- **Audit Logging:** `Audit_Logs` entry for verification completion.

---

## 3. Login

- **Trigger:** User submits credentials (email/password) or completes OAuth, or requests a magic link.
- **Validation:** Credential format check; account status check (not suspended/deactivated).
- **Security Checks:** Password verified via constant-time Argon2id comparison; progressive lockout and per-IP/per-account rate limiting on repeated failures (`10-SECURITY-BIBLE.md` §2); MFA challenge issued if enrolled (`10-SECURITY-BIBLE.md` §5); account-enumeration-safe error messaging (generic "invalid credentials," never "no such user").
- **Database Tables Used:** `Users` (read), `User_Sessions` (insert), `Refresh_Tokens` (insert), `Audit_Logs`.
- **API Modules:** AuthModule.
- **Background Jobs:** none synchronous; anomaly detection (new device/location) may run async and trigger a follow-up security notification.
- **Notifications:** "New sign-in" email notification if the login is from an unrecognized device/location.
- **Success Result:** New `User_Sessions` row created, access token issued, refresh token issued and returned via httpOnly cookie (web) or secure storage (mobile) per `10-SECURITY-BIBLE.md` §8.
- **Failure Handling:** Generic invalid-credentials response; lockout state communicated only after threshold is crossed, with a clear retry-after indication; MFA failure returns to the MFA challenge step, not back to password entry.
- **Audit Logging:** Both successful and failed login attempts are logged (`10-SECURITY-BIBLE.md` §2) with outcome, IP, and user agent.

---

## 4. Refresh Token

- **Trigger:** The client's access token has expired (or is about to) and the client silently requests a new one using its refresh token.
- **Validation:** Refresh token hash matches a stored, unexpired, unrevoked, not-previously-used record.
- **Security Checks:** Reuse-detection — if the presented token was already marked used, the entire session family is revoked immediately and the user is forced to re-authenticate, treated as a signal of token theft (`10-SECURITY-BIBLE.md` §6, §8).
- **Database Tables Used:** `Refresh_Tokens` (read, update: mark used, insert new rotated token), `User_Sessions` (update `last_active_at`).
- **API Modules:** AuthModule.
- **Background Jobs:** none synchronous.
- **Notifications:** none under normal operation; a forced-revocation event (reuse detected) triggers a security-alert notification to the user.
- **Success Result:** New access token issued, refresh token rotated (old one invalidated, new one issued), session's activity timestamp updated.
- **Failure Handling:** Invalid/expired/reused token results in full session termination and a redirect to Login; the client never silently retries indefinitely — a single refresh failure ends the session client-side.
- **Audit Logging:** Reuse-detection events are logged as a security incident in `Audit_Logs`; routine successful rotations are not individually audit-logged (too high-volume, operationally uninteresting) but are covered by general request logging (`09-PLATFORM-ARCHITECTURE.md` §19).

---

## 5. Logout

- **Trigger:** User-initiated logout (single device) or "log out everywhere" action.
- **Validation:** Valid current session identified from the presented access/refresh token.
- **Security Checks:** Only the session owner (or an `admin` acting for security response) may revoke a session.
- **Database Tables Used:** `User_Sessions` (update: `revoked_at`), `Refresh_Tokens` (update: `revoked_at` for the session, or all sessions on "everywhere").
- **API Modules:** AuthModule.
- **Background Jobs:** none synchronous; revoked session/token rows are purged after their retention window by a scheduled cleanup job.
- **Notifications:** none for a normal self-initiated logout; "your account was logged out on all devices" notification when triggered as a security response (e.g., after a password change).
- **Success Result:** Session and associated refresh token(s) revoked; cookies cleared client-side.
- **Failure Handling:** Logout is treated as best-effort idempotent — attempting to log out an already-revoked session returns success, not an error, since the end state (no valid session) is already achieved.
- **Audit Logging:** Logged, particularly for "everywhere" logout, as it's often a security-response action.

---

## 6. Password Reset

- **Trigger:** User requests a reset via "forgot password," providing their email.
- **Validation:** Email format only at request time (no existence disclosure, per §1's enumeration prevention); at completion time, new password validated against the full password policy (`10-SECURITY-BIBLE.md` §4).
- **Security Checks:** Reset tokens are single-use, expire in 15 minutes, and issuing a new one invalidates all previous outstanding tokens for the account (`10-SECURITY-BIBLE.md` §4); rate limiting on the request endpoint prevents email-bombing a target account; completing a reset revokes all existing sessions/refresh tokens for the account as a precaution.
- **Database Tables Used:** `Users` (update `password_hash`), `User_Sessions` and `Refresh_Tokens` (mass revoke), `Audit_Logs`.
- **API Modules:** AuthModule.
- **Background Jobs:** reset-email dispatch (async).
- **Notifications:** Reset-request email (contains the token link) and a separate confirmation email once the password has actually been changed, distinct from the request email, so a user is alerted even if they didn't initiate the completion step themselves.
- **Success Result:** Password updated, all prior sessions revoked, user must log in fresh with the new password.
- **Failure Handling:** Expired/invalid/reused token routes back to a "request a new reset link" state; the request-step response is identical whether or not the email exists (enumeration prevention).
- **Audit Logging:** Both the request and the completion are logged as security-sensitive events.

---

## 7. User Profile Update

- **Trigger:** User edits profile fields (display name, avatar, locale, notification preferences) from their account settings.
- **Validation:** Field-level validation via the shared schema (display name length/character constraints, valid locale code, avatar file type/size); email-change specifically requires re-verification (routes through Workflow 2 again for the new address before it becomes active).
- **Security Checks:** Only the profile owner may update their own record (object-level authorization, `10-SECURITY-BIBLE.md` §3); sensitive field changes (email, and where applicable a linked-account change) require re-authentication (recent-password or MFA confirmation) even within an active session, to protect against a hijacked-but-not-fully-compromised session.
- **Database Tables Used:** `Users` (update), `Files` (if avatar changed — new upload referenced), `Audit_Logs`.
- **API Modules:** Users/Profile module (within AuthModule's broader identity domain).
- **Background Jobs:** avatar image variant generation (resize) if a new avatar file is uploaded, via `apps/workers`.
- **Notifications:** Confirmation of sensitive changes (email address change, password change) sent to both the old and new address where applicable.
- **Success Result:** Profile fields updated; cached denormalized copies of display name/avatar (if any exist for performance, e.g., on `Comments` or `News` author display) are invalidated/refreshed.
- **Failure Handling:** Field-level validation errors returned individually; a failed avatar upload leaves the previous avatar intact rather than clearing it.
- **Audit Logging:** Sensitive field changes (email, role — role changes are admin-only, see Workflow 21) are audit-logged; cosmetic field changes (display name, avatar) are not individually audit-logged, consistent with the audit scope defined in `10-SECURITY-BIBLE.md` §18.

---

## 8. Course Enrollment

- **Trigger:** User clicks "enroll" on a free course, or completes checkout for a paid course (this workflow covers the enrollment-creation step itself; paid-course payment is covered by Workflows 13–15).
- **Validation:** Course exists and is in `published` status; user does not already hold an active enrollment for the course; for paid courses, a corresponding successful `Payments`/`Order_Items` record exists.
- **Security Checks:** Enrollment creation for a paid course is only permitted from the server-side payment-confirmation path (Workflow 14), never directly from a client request — a client cannot self-grant a paid enrollment by calling the enrollment endpoint alone.
- **Database Tables Used:** `Enrollments` (insert), `Courses` (read), `Order_Items`/`Payments` (read, for paid courses), `Audit_Logs`.
- **API Modules:** CoursesModule.
- **Background Jobs:** none synchronous; enrollment-confirmation email dispatch is async.
- **Notifications:** "You're enrolled" notification (in-app + email), plus a notification to the instructor for courses with low enrollment counts where instructor visibility into new learners matters (product-configurable).
- **Success Result:** `Enrollments` row created in `active` status; user gains access to course content per the entitlement check described in `14-DATABASE-RELATIONSHIPS.md` Part 3.
- **Failure Handling:** Duplicate-enrollment attempts return the existing enrollment rather than erroring; enrollment attempted on an unpublished/archived course is rejected with a clear message.
- **Audit Logging:** Enrollment creation is logged with actor and course reference, particularly relevant for paid-course access-grant traceability.

---

## 9. Lesson Progress

- **Trigger:** Learner watches/reads a lesson; the client periodically reports progress (e.g., video playback position) or a completion event.
- **Validation:** The reporting user holds an active `Enrollments` row for the lesson's parent course; reported progress values are within valid bounds (0–100%, position within the media's actual duration).
- **Security Checks:** A user can only write progress for their own enrollment — object-level authorization prevents writing another user's progress; progress-reporting endpoints are rate-limited to prevent abuse (e.g., artificially inflating engagement metrics).
- **Database Tables Used:** `Lesson_Progress` (upsert), `Enrollments` (read; aggregate `completion_percent` updated).
- **API Modules:** CoursesModule.
- **Background Jobs:** High-frequency progress events are buffered in Redis and flushed to Postgres in batches (`11-DATABASE-BIBLE.md` §11, §12) rather than writing on every client ping.
- **Notifications:** Milestone notifications (e.g., "50% through this course") at product-defined thresholds; course-completion notification when the aggregate reaches 100% (which also triggers Workflow 11, Certificate Generation, if the course offers one).
- **Success Result:** `Lesson_Progress` and the parent `Enrollments.completion_percent` reflect current state.
- **Failure Handling:** Out-of-order or duplicate progress events are idempotently reconciled (latest-timestamp-wins), not treated as errors.
- **Audit Logging:** Not individually audit-logged (high-volume, non-security-sensitive); covered by general operational logging only.

---

## 10. Quiz Attempt

- **Trigger:** Learner submits answers to a quiz attached to a lesson.
- **Validation:** User holds an active enrollment; attempt count does not exceed `Quizzes.max_attempts` if set; submitted answer structure matches the expected question set.
- **Security Checks:** Scoring is computed entirely server-side from `Quiz_Questions.correct_answer` — the client never submits or influences a score value directly (`13-DATABASE-BLUEPRINT.md` Quiz_Attempts security notes); correct answers are never included in any response prior to submission.
- **Database Tables Used:** `Quiz_Attempts` (insert), `Quiz_Questions` (read, server-side only), `Quizzes` (read for attempt-limit/passing-score check).
- **API Modules:** CoursesModule.
- **Background Jobs:** none synchronous.
- **Notifications:** Result notification (pass/fail, score) delivered immediately in the response and optionally as a persistent in-app notification.
- **Success Result:** `Quiz_Attempts` row created with computed `score_percent` and `passed` flag; if passing this quiz is a prerequisite for course completion, `Lesson_Progress`/`Enrollments` completion state is updated accordingly.
- **Failure Handling:** Attempt-limit-exceeded is rejected before scoring occurs, with a clear message; malformed submissions (missing answers for required questions) are rejected with field-level detail rather than partially scored.
- **Audit Logging:** Not individually audit-logged for routine attempts; anomalous patterns (e.g., implausibly fast submission suggesting automated answer scraping) feed into abuse-monitoring, which is audit-logged as a security observation if flagged.

---

## 11. Certificate Generation

- **Trigger:** A course's completion criteria are met (final lesson/quiz completion pushes `Enrollments.completion_percent` to 100%, or an explicit "mark complete" action where applicable).
- **Validation:** Course is configured to issue certificates; the enrollment doesn't already have one; all required completion criteria (all lessons, passing quiz scores where required) are genuinely satisfied — re-validated server-side at generation time, not assumed from client-reported progress alone.
- **Security Checks:** Certificate generation is a server-initiated background action triggered by verified completion state, never a client-callable "give me a certificate" endpoint; the generated PDF and its public verification code are produced server-side only.
- **Database Tables Used:** `Certificates` (insert), `Enrollments` (read), `Files` (insert, for the generated PDF), `Audit_Logs`.
- **API Modules:** CoursesModule (triggers), FilesModule/`apps/workers` (PDF rendering).
- **Background Jobs:** Async PDF generation job (rendering the certificate document, uploading to storage, generating the unique `certificate_number`).
- **Notifications:** "Certificate earned" notification (in-app + email) with a link to view/download once generation completes.
- **Success Result:** `Certificates` row created, linked PDF stored, publicly verifiable via `certificate_number`.
- **Failure Handling:** If generation fails (rendering error, storage failure), the job is retried per the platform Retry Strategy (§ below); the learner's completion status itself is not blocked or rolled back by a certificate-generation failure — completion and certificate issuance are decoupled so a rendering bug never revokes earned progress.
- **Audit Logging:** Certificate issuance (and any rare revocation) is audit-logged given its role as a durable credential (`14-DATABASE-RELATIONSHIPS.md` Certificates entry).

---

## 12. Library Access

- **Trigger:** User opens a library item they've purchased/been granted (free items require no purchase, only that the item is published).
- **Validation:** For paid items, an entitlement check confirms a completed purchase (`Order_Items`/`Payments`) or an existing `Downloads`/access record; for free items, only publish-status is checked.
- **Security Checks:** File delivery is always via a signed, short-lived, session-bound URL (`10-SECURITY-BIBLE.md` §14, `09-PLATFORM-ARCHITECTURE.md` §12) — the underlying storage object is never directly reachable; light watermarking embeds the requesting user's ID into the served copy as a deterrent.
- **Database Tables Used:** `Library_Items` (read), `Downloads` (insert, per access event), `Reading_Progress` (read/upsert), `Files` (read, for signed URL resolution).
- **API Modules:** LibraryModule.
- **Background Jobs:** none synchronous for read access; watermark application may be a fast async/edge step depending on implementation approach, transparent to the user.
- **Notifications:** none for routine access.
- **Success Result:** Signed URL issued, `Downloads` event recorded, `Reading_Progress` tracked as reading proceeds (same pattern as Workflow 9).
- **Failure Handling:** Entitlement failure returns a clear "purchase required" state rather than a generic error; expired signed URLs are simply re-issued on the next access request, transparent to the user.
- **Audit Logging:** Download events are retained as entitlement/audit-relevant records (`14-DATABASE-RELATIONSHIPS.md` Downloads entry), not written to the security `Audit_Logs` table specifically unless flagged as anomalous (e.g., unusual download velocity suggesting credential sharing/scraping).

---

## 13. Marketplace Purchase

- **Trigger:** User completes checkout for one or more products (including, where applicable, a paid course or bundled library item routed through the Marketplace checkout flow).
- **Validation:** Cart/order items are re-validated against current `Products` status and price at checkout initiation (not trusted from client-cached cart state); coupon codes (if applied) are validated against `Coupons` expiry and remaining redemptions.
- **Security Checks:** Order total is computed and verified server-side, never trusted from the client; checkout endpoints are rate-limited; payment collection itself happens through the payment provider's hosted UI (Stripe Checkout/Elements), keeping card data off Phoenix infrastructure entirely (`10-SECURITY-BIBLE.md` §18).
- **Database Tables Used:** `Orders` (insert, `pending` status), `Order_Items` (insert, price-snapshotted), `Coupons` (read, redemption-count increment).
- **API Modules:** MarketplaceModule.
- **Background Jobs:** none synchronous at this stage — order creation is fast; payment confirmation is handled asynchronously via webhook (Workflow 14).
- **Notifications:** "Order received, awaiting payment confirmation" is typically not a separate user-facing notification (the checkout UI itself communicates this); the confirmation notification fires on Workflow 14's success.
- **Success Result:** `Orders` row in `pending` status, `Order_Items` created, user redirected to the payment provider's checkout session.
- **Failure Handling:** Stale price/unavailable product detected at validation is surfaced before payment collection begins, not after; abandoned (never-paid) orders are cleaned up per a scheduled job rather than lingering indefinitely.
- **Audit Logging:** Order creation is logged; full financial audit trail continues through Workflows 14/15.

---

## 14. Payment Success

- **Trigger:** The payment provider (Stripe) sends a signed webhook event confirming successful payment for a given order/payment intent.
- **Validation:** Webhook signature verified against the provider's signing secret (`10-SECURITY-BIBLE.md` §13) before the payload is trusted at all; the referenced order exists and is still in `pending` status (idempotency guard against duplicate webhook delivery).
- **Security Checks:** Order status is transitioned to `paid` **exclusively** from this verified server-to-server webhook path — never from any client-side "payment succeeded" callback alone, closing a well-known payment-fraud vector.
- **Database Tables Used:** `Payments` (insert/update `succeeded`), `Transactions` (insert, ledger entry), `Orders` (update status `paid`), `Enrollments`/entitlement tables (insert, per purchased item — triggers Workflow 8 for course products), `Audit_Logs`.
- **API Modules:** MarketplaceModule (webhook handler), CoursesModule/LibraryModule (entitlement grant, delegated per product type).
- **Background Jobs:** Entitlement fan-out (granting access to each purchased item) and receipt-email dispatch run async, decoupled from the webhook's own fast acknowledgment response (webhooks must be acknowledged quickly to avoid provider-side retry storms).
- **Notifications:** Order-confirmation/receipt email and in-app notification; per-product notifications where relevant (e.g., "you're enrolled" for a course product, chaining into Workflow 8's notification).
- **Success Result:** Order fully paid, all purchased entitlements granted, financial ledger updated.
- **Failure Handling:** If entitlement-granting fails after payment is confirmed (e.g., a transient error), the payment/order state remains `paid` (the customer is not penalized for an internal fault) and entitlement-granting is retried per the platform Retry Strategy until it succeeds, with alerting if it doesn't resolve within an expected window.
- **Audit Logging:** Full financial audit trail — payment confirmation, ledger entry, and entitlement grants are all logged with the webhook event ID for traceability back to the provider's own records.

---

## 15. Payment Failure

- **Trigger:** The payment provider sends a webhook indicating a failed or declined payment attempt, or the checkout session expires without completion.
- **Validation:** Same webhook-signature verification as Workflow 14.
- **Security Checks:** Failure handling does not expose detailed decline reasons that could aid card-testing fraud (e.g., "insufficient funds" vs. "invalid card number" distinctions are generalized in the user-facing message, even if more detail is available internally for fraud-review purposes).
- **Database Tables Used:** `Payments` (update `failed`), `Orders` (remains `pending` or transitions to a distinct `payment_failed` sub-state depending on product decision), `Audit_Logs`.
- **API Modules:** MarketplaceModule (webhook handler).
- **Background Jobs:** none required beyond standard notification dispatch.
- **Notifications:** "Payment could not be completed" notification with a retry-checkout link.
- **Success Result:** N/A (this is itself the failure path of Workflow 13) — the system reaches a clean, well-defined `failed` state rather than an ambiguous one.
- **Failure Handling:** Repeated failed attempts on the same order/account may trigger fraud-review flagging (rate-limit-style threshold) rather than unlimited retry; no entitlement is ever granted on a failed payment.
- **Audit Logging:** Failed payment attempts are logged, both for customer-support traceability and for fraud-pattern monitoring.

---

## 16. AI Request

- **Trigger:** A user-facing AI feature (learning assistant, content-generation aid) initiates a call to the AI Gateway.
- **Validation:** Request payload validated against the feature's expected input schema; the referenced `Prompt_Templates` version is active and not deprecated.
- **Security Checks:** Standard authentication/authorization for the calling user; per-user quota checked (`AI_Usage`, fail-closed before dispatch, `12-AI-INTEGRATION-BIBLE.md` §9); per-endpoint and per-session rate limiting (`12-AI-INTEGRATION-BIBLE.md` §10); user input is inserted into the prompt only through defined, escaped insertion points to resist prompt injection (`12-AI-INTEGRATION-BIBLE.md` §6).
- **Database Tables Used:** `AI_Usage` (read/increment), `AI_Requests` (insert, initial pending state), `Prompt_Templates` (read), `AI_Models`/`AI_Providers` (read, for routing).
- **API Modules:** AiModule (AI Gateway).
- **Background Jobs:** none synchronous for interactive (chat/streaming) requests; batch-style AI features (e.g., bulk content-generation aids) may be queued to `apps/workers`.
- **Notifications:** none at the request stage (notifications, if any, accompany the completed response — Workflow 17).
- **Success Result:** Request accepted, dispatched to the routed provider/model, quota decremented.
- **Failure Handling:** Quota-exceeded returns a clear, immediate rejection before any provider call is made (no cost incurred); malformed input is rejected with schema-validation detail.
- **Audit Logging:** Every request is logged to the dedicated `AI_Requests` usage log (`12-AI-INTEGRATION-BIBLE.md` §8); this is distinct from, and does not by itself write to, the security `Audit_Logs` table unless the request itself is flagged as a security-relevant event (e.g., a detected injection attempt).

---

## 17. AI Response

- **Trigger:** The AI provider returns a completion/response for a dispatched request (Workflow 16), or the Gateway's failover logic resolves a fallback response after a primary-provider failure.
- **Validation:** Structured-output responses are validated against the feature's expected schema before acceptance; free-form responses pass through a content-safety/moderation check (`12-AI-INTEGRATION-BIBLE.md` §7).
- **Security Checks:** The response is treated as untrusted data, not as an authenticated instruction — it is never used to construct a database query or trigger a privileged action without the same authorization checks a human-initiated request would require (`12-AI-INTEGRATION-BIBLE.md` §11); content intended for publication (e.g., an AI-drafted course description) is routed to human editorial review before going live, never auto-published.
- **Database Tables Used:** `AI_Requests` (update: status, token counts, latency, redacted content), `AI_Costs` (insert).
- **API Modules:** AiModule.
- **Background Jobs:** PII-redaction scan on logged content (`12-AI-INTEGRATION-BIBLE.md` §13) runs as part of the logging path, synchronously or near-synchronously before persistence.
- **Notifications:** For asynchronous/batch AI features, a completion notification informs the user their result is ready.
- **Success Result:** Validated response delivered to the calling feature/user; usage and cost data recorded.
- **Failure Handling:** Schema-invalid structured responses trigger one bounded retry against the provider before falling back to a graceful "unavailable" state (`12-AI-INTEGRATION-BIBLE.md` §7); a full provider/fallback exhaustion surfaces a clear degraded-state message rather than an opaque error.
- **Audit Logging:** Response outcome (success/error/moderation-blocked) is recorded in `AI_Requests`; a moderation-blocked outcome specifically is also surfaced to abuse-monitoring.

---

## 18. News Publishing

- **Trigger:** A `content_editor`/`admin` transitions a `News` article from `in_review` to `published`.
- **Validation:** Article has passed required editorial fields (title, body, category); body content has passed the sanitization pipeline (`10-SECURITY-BIBLE.md` §10).
- **Security Checks:** Only the editorial/admin roles hold the `news:publish` permission (`10-SECURITY-BIBLE.md` §3); the transition itself is authorized per-request, not merely gated by UI visibility.
- **Database Tables Used:** `News` (update status, `published_at`), `News_Categories`/`Tags` (read, association already established during drafting).
- **API Modules:** NewsModule (within apps/admin), search-index sync client.
- **Background Jobs:** Search-index update (Meilisearch) and CDN/ISR revalidation of the public news listing/detail pages (`09-PLATFORM-ARCHITECTURE.md` §14) triggered async on publish.
- **Notifications:** Optional subscriber notification (if the platform offers news subscriptions) dispatched to interested users.
- **Success Result:** Article publicly visible, indexed for search, statically cached pages revalidated.
- **Failure Handling:** A revalidation/index-sync failure does not block the publish transition itself (the article is published in the database regardless) but is retried and alerted on if not resolved promptly, since a published-but-not-indexed/cached article is a degraded, not broken, state.
- **Audit Logging:** Publish (and any later archive/unpublish) transitions are audit-logged with the acting editor.

---

## 19. File Upload

- **Trigger:** A user or admin initiates a file upload (avatar, course video, lesson resource, library e-book, product file).
- **Validation:** Requested content-type/size against the caller's role-based quota and limits (`10-SECURITY-BIBLE.md` §14) before a presigned URL is even issued.
- **Security Checks:** Upload happens via a presigned URL directly to object storage, never buffered through an application server; uploaded content is validated by magic-byte content inspection (not trusted extension/MIME) once received; the file is held in a quarantine state pending malware scan (`10-SECURITY-BIBLE.md` §15) before it is available to anyone other than the uploader.
- **Database Tables Used:** `Uploads` (insert, then update on completion), `Files` (insert, on finalized upload), `Media` (insert, if the file is video/audio).
- **API Modules:** FilesModule.
- **Background Jobs:** Malware scan, video transcoding (HLS) or image-variant generation, all async via `apps/workers`.
- **Notifications:** none for routine uploads; a failed scan/quarantine triggers a notification to the uploader (processing failed) and, on an actual positive malware detection, an alert to the security/admin team.
- **Success Result:** `Files` row marked `scan_status = clean`, available for attachment to its owning content record (lesson, library item, product, avatar).
- **Failure Handling:** Failed scans permanently quarantine the file and flag the account for review (`10-SECURITY-BIBLE.md` §15); failed transcoding/processing is retried per the platform Retry Strategy, with the file remaining unavailable for its intended use until processing succeeds.
- **Audit Logging:** Upload events are logged; a positive malware detection is specifically escalated as a security incident (`10-SECURITY-BIBLE.md` §19).

---

## 20. Notification Delivery

- **Trigger:** Any domain event that should notify a user (enrollment confirmed, certificate earned, order paid, comment reply, AI response ready, security alert, etc.) — this workflow is the shared delivery mechanism referenced by many of the workflows above.
- **Validation:** The event payload matches the expected shape for its notification type; the target user exists and has not disabled the relevant notification category.
- **Security Checks:** Notification content never includes sensitive data beyond what's appropriate for the delivery channel (no full payment details or tokens in an email body, per `13-DATABASE-BLUEPRINT.md` Notifications security notes); email/push delivery services are called with the platform's own scoped credentials, never exposing provider credentials to the triggering feature code.
- **Database Tables Used:** `Notifications` (insert, for the in-app channel).
- **API Modules:** NotificationsModule (consumer side of the event queue described in `09-PLATFORM-ARCHITECTURE.md` §17).
- **Background Jobs:** The core mechanism — producers publish an event to the queue; the `NotificationsWorker` consumes it, resolves user channel preferences, and fans out to email (SES/Postmark), in-app (`Notifications` table write), and future push (FCM/APNs) as applicable.
- **Notifications:** This workflow *is* the notification-delivery step referenced elsewhere; it has no further downstream notification of its own.
- **Success Result:** Notification delivered on every channel the user has opted into; in-app notification visible in the notification center.
- **Failure Handling:** A failure on one channel (e.g., email provider transient error) does not block delivery on other channels; failed deliveries are retried per the platform Retry Strategy; a channel that fails permanently (e.g., bounced email) is logged for the relevant support/ops review, not silently dropped.
- **Audit Logging:** Delivery of security-relevant notifications (password reset, login-from-new-device, session-revoked) is itself logged as part of the originating workflow's audit entry, not duplicated separately here.

---

## 21. Admin Approval

- **Trigger:** A generic pattern covering any content or action requiring admin/editorial sign-off before taking effect — course publish review, refund approval, user-ban confirmation, flagged-comment moderation decision.
- **Validation:** The item is in the expected pending/review state; the approving actor holds the specific permission for that action type (`course:publish`, `order:refund`, `user:ban`, etc., per `10-SECURITY-BIBLE.md` §3).
- **Security Checks:** Approval actions require the elevated admin session scope (`10-SECURITY-BIBLE.md` §3); MFA is already mandatory for any role capable of reaching this workflow (`10-SECURITY-BIBLE.md` §5); every approval/rejection decision is captured with a before/after diff.
- **Database Tables Used:** varies by action type — the relevant domain table (`Courses.status`, `Orders.status`, `Users.status`, `Comments.status`) plus `Audit_Logs` universally.
- **API Modules:** AdminModule, delegating the actual state change to the owning domain module (CoursesModule, MarketplaceModule, AuthModule, NewsModule) rather than mutating other domains' tables directly (`14-DATABASE-RELATIONSHIPS.md` Part 10, cross-schema write rule).
- **Background Jobs:** downstream effects of the approval (e.g., a refund approval triggering Workflow 14/15-adjacent payment-provider refund processing) are dispatched async.
- **Notifications:** The affected user (course instructor, purchaser, banned user) is notified of the decision and, where applicable, the stated reason.
- **Success Result:** The item's status transitions per the approved action; downstream effects (entitlement revocation, content going live, refund issued) proceed.
- **Failure Handling:** A rejected item returns to its prior state (or a distinct `rejected` state) with editorial feedback where applicable, rather than being deleted outright — preserving the submission for revision.
- **Audit Logging:** Every admin approval/rejection decision is unconditionally audit-logged — this workflow exists specifically because these are the platform's highest-consequence, most audit-critical actions.

---

## 22. Audit Logging

- **Trigger:** Any workflow above (or any other platform action) that meets the criteria for security/administrative significance defined in `10-SECURITY-BIBLE.md` §18 — this workflow describes the shared logging mechanism itself, referenced throughout this document rather than user-initiated on its own.
- **Validation:** The event includes the required minimum fields (actor, action, target, timestamp) before being accepted for write.
- **Security Checks:** The write path to `Audit_Logs` is the only path — no application role holds update/delete grants on this table (`14-DATABASE-RELATIONSHIPS.md` Audit_Logs entry, `10-SECURITY-BIBLE.md` §18); log writes themselves never contain raw passwords, full tokens, or unredacted sensitive payloads.
- **Database Tables Used:** `Audit_Logs` (insert only).
- **API Modules:** A shared logging utility called by every module, not a standalone user-facing module.
- **Background Jobs:** none — audit writes are synchronous with the triggering action (an action is not considered complete until its audit entry is durably written), to guarantee no gap between action and record.
- **Notifications:** none directly; certain audit event types (e.g., repeated failed admin-login attempts) feed into alerting rather than user notification.
- **Success Result:** An immutable, queryable record of the action exists.
- **Failure Handling:** If the audit write itself fails, the triggering action is treated as failed and rolled back where technically possible (for actions within a single database transaction, the audit insert is part of that same transaction) — the platform does not allow a security-significant action to succeed silently without its audit trail.
- **Audit Logging:** N/A (this workflow is the audit logging mechanism itself).

---

# Cross-System Workflow Map

```
Registration ─▶ Email Verification ─▶ Login ─┬▶ Refresh Token (repeats through session life)
                                                └▶ Logout

Login ─▶ Course Enrollment ─▶ Lesson Progress ─▶ Quiz Attempt ─▶ Certificate Generation
                    │                                              │
                    └────────────────────────▶ Notification Delivery (fires from every workflow above)

Login ─▶ Marketplace Purchase ─▶ Payment Success ─┬▶ Course Enrollment (if product = course)
                                                     ├▶ Library Access (if product = e-book/bundle)
                                                     └▶ Notification Delivery
                       └▶ Payment Failure ─▶ Notification Delivery

Login ─▶ AI Request ─▶ AI Response ─▶ (Notification Delivery, for async features)

Admin Approval ─▶ touches Course Publishing, News Publishing, Payment Failure→Refund, User status
                       └▶ Audit Logging (mandatory) ─▶ Notification Delivery (to affected user)

File Upload ─▶ feeds into Course authoring (Lesson_Files/Media), Library_Items, Products, avatars
                       └▶ Admin Approval (for content requiring review before going live)

News Publishing ─▶ Notification Delivery (optional subscriber notice)

Every workflow above ─▶ Audit Logging (where the action meets the security-significance bar, §10-SECURITY-BIBLE.md §18)
```

---

# Dependency Flow

- **Identity workflows (1–7) are prerequisite to every other workflow.** No Learning, Library, Marketplace, or AI workflow can execute without a valid authenticated session established via Workflow 3, refreshed via Workflow 4.
- **Payment workflows (13–15) gate entitlement-dependent workflows.** Course Enrollment (8) and Library Access (12) for paid content cannot complete independently of Payment Success (14) — they are downstream, not parallel, processes.
- **File Upload (19) is a prerequisite dependency for content-authoring workflows**, not a standalone user-facing feature — Course authoring, Library cataloguing, and Product listing all depend on a completed, scanned-clean file before that content can reach Admin Approval (21) or direct publication.
- **Notification Delivery (20) is a terminal, fan-out step for nearly every other workflow** — it has no downstream dependents of its own within this document; it is where each workflow's user-facing communication concludes.
- **Audit Logging (22) is a cross-cutting dependency, not a sequential step** — it executes synchronously alongside the triggering workflow's own database writes, rather than after or independently of them.
- **AI Request/Response (16–17) is architecturally independent of the Learning/Library/Marketplace domains** — no other workflow's success depends on the AI Gateway being available, by design (`12-AI-INTEGRATION-BIBLE.md` §1's assistive-not-authoritative principle), even though AI features may be embedded within those experiences.

---

# Failure Recovery Strategy

- **Idempotency first.** Any workflow that could plausibly be retried or duplicated (webhook delivery, notification dispatch, progress reporting) is designed to be safely repeatable without side effects beyond the intended single outcome — duplicate webhook events, duplicate progress pings, and duplicate notification-consumer runs all resolve to the same end state, not compounding errors.
- **Fail closed on security/financial workflows, fail open (gracefully degraded) on convenience workflows.** Quota checks (16), authorization checks (all), and payment confirmation (14) reject on any doubt rather than proceeding optimistically. Notification delivery (20) and AI response generation (17), by contrast, degrade to a clear "unavailable" state rather than blocking the broader user action that triggered them.
- **Decoupling of core state from side effects.** A payment succeeding (14) is never rolled back because a downstream notification or search-index update (18) fails — the authoritative state change and its side effects are separated so a side-effect failure never corrupts or reverses the primary business outcome; the side effect is retried independently until it succeeds.
- **Compensating actions over silent rollback for financial workflows.** A failed post-payment step is resolved by completing the missing step (retry) or by an explicit compensating action (e.g., a manual refund if entitlement genuinely cannot be granted), never by silently reversing a confirmed payment without a corresponding, logged financial action.
- **Human-in-the-loop for content ambiguity.** Workflows touching published content (Admin Approval, News Publishing) never auto-resolve an ambiguous or failed state by guessing — a failed publish attempt returns the content to its prior review state for explicit human re-action.

---

# Retry Strategy

- **Synchronous request paths (Login, Course Enrollment, Quiz Attempt) do not auto-retry server-side** — a failure is returned to the client immediately with enough information for the client (or user) to decide whether to retry; the platform does not silently re-attempt a user-initiated action without their knowledge.
- **Background jobs (transcoding, PDF generation, search indexing, notification fan-out) use exponential backoff with a bounded maximum attempt count** — e.g., an initial retry after a short delay, doubling on each subsequent failure, up to a defined ceiling (typically 5–8 attempts) before the job is moved to a dead-letter state for manual review rather than retried indefinitely.
- **Webhook-triggered workflows (Payment Success/Failure) rely on the provider's own retry behavior** in addition to the platform's internal idempotent processing — Phoenix acknowledges webhooks quickly and processes asynchronously, so a slow internal step never causes the provider to time out and unnecessarily re-send.
- **AI Gateway requests retry once, structurally**, against a schema-validation failure (§17) before falling back to an alternate provider (§4 of `12-AI-INTEGRATION-BIBLE.md`) — this is a bounded, fast retry distinct from the longer-window background-job retry pattern above, appropriate to an interactive request's latency expectations.
- **Dead-lettered jobs always alert the owning team** — a job that exhausts its retry budget is never silently dropped; it is logged, alerted on, and queued for manual intervention.

---

# Future Expansion Notes

- New workflows (a future Community/Discussion feature's post-and-reply flow, a Live-Session/Webinar scheduling workflow, vendor-payout processing once the multi-vendor marketplace ships per `09-PLATFORM-ARCHITECTURE.md` §13) follow the same ten-part documentation shape established in this document — Trigger through Audit Logging — before implementation begins, keeping the workflow reference complete as the platform grows.
- The Notification Delivery (20) and Admin Approval (21) patterns are intentionally generic/reusable — new domain events plug into the existing notification queue and the existing approval pattern rather than each new feature inventing its own delivery or review mechanism.
- Mobile-specific workflow variants (push-token registration, biometric-unlock-backed session refresh) will extend Workflows 3–5 once `apps/mobile` exists, rather than requiring a parallel workflow set — the underlying Auth/session model (`10-SECURITY-BIBLE.md` §6–§8) was designed with this extension in mind.
- As AI capability expands (`12-AI-INTEGRATION-BIBLE.md` §16), new AI-powered workflows are additive instances of the existing AI Request/Response pattern (16–17) against the same Gateway, not new integration patterns.
