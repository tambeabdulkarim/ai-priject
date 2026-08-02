# 09 — Phoenix Platform Master Architecture

Status: Planning document only. No implementation in this phase. Homepage v1.0 is frozen and unaffected by anything below.

Design targets: millions of users, future native mobile apps, multi-language (ar/en, extensible), heavy AI integration, enterprise-grade security, long-term maintainability.

---

## 1. Folder Architecture

The Homepage was built as a single Next.js app (`src/app`, `src/components`, `src/lib`). That layout does not scale to the full platform (admin dashboard, mobile apps, shared design system, background workers). Target: a **monorepo** managed with Turborepo (or Nx), so the web app, admin app, and future mobile app share types, API clients, and UI primitives instead of duplicating them.

```
phoenix-platform/
├── apps/
│   ├── web/                    # Public + authenticated Next.js app (current Homepage lives here)
│   ├── admin/                  # Admin dashboard — separate Next.js app, separate deploy/auth surface
│   ├── api/                    # Backend service (NestJS) — REST/GraphQL, business logic
│   ├── workers/                # Background job processors (queues, video encoding, email, AI batch jobs)
│   └── mobile/                 # Future React Native (Expo) app — added when mobile work starts
├── packages/
│   ├── ui/                     # Shared design system (buttons, cards, the ph-* component library)
│   ├── config/                 # Shared eslint/tsconfig/tailwind-or-css tokens
│   ├── types/                  # Shared TypeScript types (API contracts, DB models as types)
│   ├── api-client/             # Typed SDK wrapping the backend API (used by web, admin, mobile)
│   ├── i18n/                   # Shared translation dictionaries + locale utilities
│   └── validation/             # Shared zod schemas (form validation + API request validation)
├── infra/
│   ├── terraform/              # IaC: databases, networking, storage buckets, CDN
│   └── docker/                 # Dockerfiles per service
├── docs/                       # This folder — architecture, ADRs, runbooks
└── turbo.json
```

Migration note: `apps/web` starts as the current Homepage codebase moved as-is; the monorepo shell is introduced without touching Homepage internals, so v1.0 stays frozen and intact.

---

## 2. Route Architecture

Next.js App Router, locale-prefixed (`/[lang]/...`), route groups separate concerns without affecting URLs:

```
app/[lang]/
├── (marketing)/                # Public, SEO-heavy, statically generated where possible
│   ├── page.tsx                # Homepage (frozen v1.0)
│   ├── about/
│   ├── pricing/
│   └── contact/
├── (catalog)/                  # Public browse, SSG/ISR
│   ├── tools/                  # AI tools directory
│   ├── courses/
│   ├── library/                # E-books
│   ├── marketplace/
│   └── news/
├── (auth)/                     # Sign in / sign up / reset — no shared chrome with app shell
│   ├── login/
│   ├── register/
│   └── reset-password/
├── (app)/                      # Authenticated area, guarded by middleware
│   ├── dashboard/
│   ├── courses/[courseId]/learn/
│   ├── library/[bookId]/read/
│   ├── profile/
│   ├── orders/
│   └── notifications/
└── (checkout)/                 # Isolated, minimal chrome, PCI-conscious
    └── checkout/[orderId]/

app/admin/                      # Fully separate Next.js app (apps/admin), own subdomain: admin.phoenix.app
app/api/                        # Only thin edge routes (webhooks, BFF glue) — business logic lives in apps/api
```

Route groups let marketing pages stay statically generated (fast, cacheable, SEO-first) while authenticated pages opt into dynamic rendering independently — one doesn't force the other.

---

## 3. Component Architecture

Three-tier model, enforced by folder location, not convention alone:

```
packages/ui/
├── primitives/        # Button, Input, Modal, Tooltip — no business logic, no data fetching
├── patterns/          # SearchBar, StatCard, PricingTable — composed from primitives, still dumb
└── theming/           # Design tokens (colors, spacing, radii) as CSS custom properties + TS constants

apps/web/src/
├── components/
│   └── [domain]/       # CourseCard, ToolCard, NewsCard — domain-aware, may fetch via hooks
├── features/
│   └── [feature]/       # courses/, tools/, checkout/ — a feature owns its components, hooks, API calls
└── app/                 # Route files only — thin, compose features
```

Rule: primitives never import from `features/`; `features/` never import each other directly (cross-feature communication goes through shared state or events, not direct imports) — keeps the dependency graph acyclic as the codebase grows.

---

## 4. Authentication Architecture

- **Provider:** Auth.js (NextAuth) v5, or a custom auth service behind `apps/api` if mobile parity is needed sooner — recommendation: **custom auth service in `apps/api`** issuing JWT access tokens (short-lived, 15 min) + refresh tokens (httpOnly cookie for web, secure storage for mobile), since a mobile app can't share Next.js session cookies cleanly.
- **Methods:** email/password (Argon2id hashing), OAuth (Google, Apple — required for App Store mobile login), magic link for passwordless.
- **Session model:** stateless JWT for access; refresh tokens stored server-side (hashed) in Postgres so they can be revoked (logout-everywhere, breach response).
- **MFA:** TOTP-based, optional at launch, mandatory for admin/instructor roles.
- **Token flow:** `apps/api` is the single source of truth; `apps/web` and `apps/admin` talk to it via `packages/api-client`, never implement auth logic twice.

---

## 5. Authorization (Roles & Permissions)

RBAC with a permissions table, not hardcoded role checks scattered in components.

**Roles:** `guest`, `learner`, `instructor`, `content_editor`, `moderator`, `support`, `admin`, `superadmin`.

**Permission model:** `resource:action` strings (e.g. `course:publish`, `user:ban`, `news:edit`) mapped to roles in a DB table, not an enum in code — lets admins grant fine-grained access without a deploy.

```
roles ──< role_permissions >── permissions
users ──< user_roles >── roles          (many-to-many: a user can hold multiple roles)
```

- Enforcement happens in **two layers**: `apps/api` (source of truth, every endpoint checks permissions) and UI (`apps/web`/`apps/admin` hide actions the user can't perform — a UX convenience, never the security boundary).
- Admin dashboard additionally requires a distinct "admin session" scope on the JWT, so a stolen web session token alone can't reach admin endpoints.

---

## 6. API Architecture

- **Style:** REST, versioned (`/api/v1/...`), OpenAPI-documented from day one (contract-first, generates the TS client in `packages/api-client` automatically — keeps web/admin/mobile in sync without manual typing drift).
- **Service:** `apps/api` (NestJS) — modular by domain (`AuthModule`, `CoursesModule`, `ToolsModule`, `MarketplaceModule`, `NewsModule`, `AdminModule`), each with its own controller/service/repository layers.
- **GraphQL:** not adopted at launch — REST is simpler to cache at the CDN edge and easier to reason about for a small initial team; revisit if the admin dashboard's data-shaping needs get complex.
- **Next.js's role:** BFF only — Server Components fetch from `apps/api` directly (server-to-server, no public exposure of internal endpoints); Route Handlers are used only for things that must live at the edge (webhooks, OAuth callbacks).
- **Rate limiting:** per-IP and per-user, enforced at the API gateway layer (see §18).
- **Idempotency:** mutating endpoints (checkout, course enrollment) accept an `Idempotency-Key` header to make retries safe at scale.

---

## 7. Database Architecture

- **Primary store:** PostgreSQL (managed — RDS/Cloud SQL/Neon), one logical database, schema-per-domain (`auth`, `courses`, `marketplace`, `news`, `library`) for organizational clarity even though it's one physical instance initially.
- **ORM:** Prisma — schema-as-code, migrations tracked in git, type-safe queries shared via `packages/types`.
- **Caching:** Redis — session/token blocklists, rate-limit counters, hot-read caching (course catalog, tool listings), pub/sub for notifications.
- **Search:** Meilisearch (or OpenSearch at larger scale) for tools/courses/news full-text + faceted search — Postgres `ILIKE` doesn't scale past a few thousand rows.
- **Object storage:** S3-compatible (AWS S3 or Cloudflare R2) for uploaded files, course videos, e-book files, user avatars — never stored in Postgres.
- **Scaling path:** start single-primary + read replica; introduce connection pooling (PgBouncer) before it's needed; partition/shard only the tables that actually grow unbounded (e.g., `notifications`, `activity_logs`) once volume demands it — premature sharding is avoided.
- **Data isolation:** admin analytics run against a read replica, never the primary, so heavy reporting queries can't degrade user-facing latency.

---

## 8. State Management

- **Server state** (anything from the API — courses, tools, cart, profile): TanStack Query. Handles caching, revalidation, optimistic updates — the API is the source of truth, not client state.
- **Client-only UI state** (modal open/closed, mobile drawer, theme toggle): local `useState`/`useReducer`, or Zustand for state shared across distant components (e.g., cart drawer open state, auth user object hydrated once at layout level).
- **Forms:** React Hook Form + the shared `packages/validation` zod schemas — the same schema validates client-side and server-side (API also validates with the identical schema), eliminating drift between what the form allows and what the API accepts.
- **No Redux** — the server-state/client-state split above covers everything the platform needs without the boilerplate.

---

## 9. File Upload Architecture

- **Flow:** client requests a **presigned upload URL** from `apps/api` → uploads directly to S3/R2 from the browser → notifies the API on completion → API validates (size, MIME sniffing, not just extension) and persists metadata. Files never pass through the Next.js server or the API server's own memory — keeps upload throughput off the app servers entirely.
- **Processing pipeline** (async, via queue): virus/malware scan (ClamAV or a hosted scanner) → for video: transcoding to adaptive bitrate (HLS) via a worker in `apps/workers` → for images: resize/optimize variants → CDN invalidation.
- **Access control:** private buckets by default; served via signed, short-lived CDN URLs — e-book files and paid course videos are never publicly reachable by guessing a URL.
- **Limits:** per-role upload quotas (instructors get more than learners), per-file-type size caps enforced both client-side (fast feedback) and server-side (actual enforcement).

---

## 10. AI Tools Architecture

Two distinct concerns: the **AI Tools directory** (a catalog feature, mostly CRUD + search) and the **AI Gateway** (infrastructure for any feature that calls an LLM/AI provider).

- **AI Tools directory:** standard catalog data — tools, categories, reviews, "explore" links — stored in Postgres, indexed in Meilisearch. No different architecturally from the course/library catalogs.
- **AI Gateway** (`apps/api`'s `AiModule`, or a dedicated microservice if usage grows): a single internal abstraction in front of external providers (OpenAI, Anthropic, etc.) so features never call a provider SDK directly. Responsibilities:
  - Provider abstraction (swap/fallback providers without touching feature code)
  - Per-user and per-plan **usage metering** and quota enforcement (critical once this is user-facing and billed)
  - Prompt/response logging for abuse review and quality monitoring (with PII redaction)
  - Streaming response support (SSE/WebSocket) for chat-style features
  - Cost tracking per request, aggregated for admin dashboards
- **Where AI shows up on the platform:** course content generation aids (instructor-facing), a learning assistant (learner-facing chat), tool recommendation/search ranking. Each is a thin feature built on top of the AI Gateway, not a separate integration.

---

## 11. Course System Architecture

```
courses ──< modules ──< lessons ──< lesson_progress >── users
courses ──< enrollments >── users
courses ──< reviews >── users
lessons ──< quizzes ──< quiz_questions
enrollments ──> certificates (issued on completion)
```

- **Content types per lesson:** video (HLS via CDN), text/markdown, quiz, downloadable resource.
- **Progress tracking:** `lesson_progress` rows updated on watch/read events, aggregated into course-level `%` completion — read-heavy, so progress summaries are cached in Redis and only the raw events hit Postgres.
- **Certificates:** generated as PDFs (server-side render) on course completion, stored in object storage, verifiable via a public certificate-ID lookup page (no auth required — this is a credential learners share).
- **Instructor workflow:** draft → review → published states on `courses`, gated by the `content_editor`/`instructor` roles from §5.

---

## 12. Library Architecture

- **Catalog:** e-books with metadata (author, category, tags, format), same search/browse pattern as courses/tools.
- **Access model:** licensed reading, not raw file downloads — files served through a signed, time-limited, session-bound URL from the private bucket (§9), with basic watermarking (user ID embedded) as a deterrent rather than heavyweight DRM, which is disproportionate for this content type.
- **Reading progress:** `reading_progress` per user/book (last position, % complete), same caching pattern as course progress.

---

## 13. Marketplace Architecture

```
products ──< product_variants
orders ──< order_items >── products
orders ──> payments (Stripe)
users ──< purchases >── products   (grants access post-payment)
```

- **Products:** digital goods (templates, tool licenses, bundles) — no physical shipping/inventory concerns, simplifies the model considerably.
- **Payments:** Stripe (Checkout + Payment Intents), webhook-driven order fulfillment — the order is only marked paid and access granted after Stripe's webhook confirms payment server-side, never on client-side redirect alone (a well-known fraud vector if done wrong).
- **Delivery:** on successful payment, `purchases` row created → triggers signed download URL generation (§9) or unlocks the relevant course/library entry if the product is a bundle.
- **Future vendor marketplace** (third parties selling products): payouts via Stripe Connect — designed for later, not launch scope, but the `products` table's `owner_id` field is included now so it doesn't require a breaking migration later.

---

## 14. News System

- Editorial CMS-lite: `news_articles` with `draft`/`in_review`/`published` states, categories, tags, and a designated author (`content_editor`/`admin` role).
- Public delivery: statically generated + ISR (revalidate on publish via webhook from the admin dashboard) — news is read-heavy and benefits from CDN caching over dynamic rendering.
- No separate service — this is standard content managed through `apps/admin`, stored in Postgres, same pattern as courses.

---

## 15. User Profile System

- Core profile (`users` table): identity, avatar, locale/language preference, notification preferences.
- Extended, feature-owned data lives in **their own tables**, not bloating `users`: `enrollments` (courses owned by CoursesModule), `purchases` (owned by MarketplaceModule), `certificates`, `achievements`/badges (gamification, optional at launch).
- Public profile page shows an aggregate view assembled from these — read model, not a denormalized copy, to avoid sync bugs.

---

## 16. Admin Dashboard

- **Separate app** (`apps/admin`), separate subdomain (`admin.phoenix.app`), separate deploy pipeline — an admin XSS or dependency vuln can't leak into the public site's bundle, and it can be put behind additional network-level restrictions (IP allowlist, VPN) independent of the public app.
- **Modules:** user management (role assignment, bans), content moderation (courses/news/reviews queues), catalog management (tools/courses/products CRUD), order/refund management, analytics (revenue, DAU/MAU, course completion rates), AI usage/cost dashboard (§10).
- **Auth:** same identity provider as the main platform (§4), but requires the elevated "admin session scope" and MFA is mandatory for every admin-capable role.
- **Audit trail:** every admin mutation (ban a user, edit a course, issue a refund) writes to the audit log (§19) with actor, action, before/after diff.

---

## 17. Notifications

- **Channels:** in-app (bell icon + notification center), email (transactional + digest), push (mobile, once the app exists).
- **Architecture:** producers (any backend module — "course published," "order confirmed," "new reply") publish events to a queue (Redis Streams initially, SQS/BullMQ if volume demands it); a single `NotificationsWorker` consumes events, applies user preferences (which channels they've opted into), and fans out to the right delivery service (email via SES/Postmark, push via FCM/APNs later).
- **Why queue-based:** decouples "something happened" from "how it gets delivered" — new channels (SMS, WhatsApp) are added by writing a new consumer, not touching every feature that triggers notifications.
- **In-app storage:** `notifications` table per user, paginated, read/unread state, TTL-based archival to keep the hot table small.

---

## 18. Security Architecture

- **Transport:** TLS everywhere, HSTS enforced.
- **Headers:** strict CSP (no inline scripts without nonces), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` — set at the edge (CDN/reverse proxy), applied to every app.
- **Input validation:** every API boundary validated with the shared zod schemas (§8) — never trust client input, even from the first-party web app.
- **Secrets management:** no secrets in env files committed anywhere — a secrets manager (AWS Secrets Manager / Doppler), injected at deploy time, rotated on a schedule.
- **Rate limiting & abuse:** per-IP and per-account limits at the API gateway (login attempts, AI Gateway calls, search queries); CAPTCHA on auth flows after repeated failures.
- **Dependency hygiene:** automated vulnerability scanning (Dependabot/Snyk) in CI, blocking merges on critical CVEs.
- **PII handling:** encryption at rest for sensitive fields (Postgres column-level encryption or app-level encryption for things like phone numbers), data retention policy defined per data type, GDPR-style export/delete-my-data endpoints designed in from the start rather than retrofitted.
- **Payment data:** never touches Phoenix's own servers — Stripe Elements/Checkout handles card data directly, keeping the platform out of PCI-DSS scope beyond SAQ-A.

---

## 19. Logging Architecture

- **Structured logs:** JSON logs from every service (`apps/api`, `apps/workers`), correlation ID propagated from the incoming request through every downstream call — lets one user-reported bug be traced end-to-end.
- **Centralization:** shipped to a log aggregator (Grafana Loki, or a hosted option like Datadog/Better Stack) — not just `console.log` in production.
- **Error tracking:** Sentry (or equivalent) on every app — web, admin, api, workers — with source maps uploaded so stack traces are readable.
- **Audit logs:** a distinct, append-only log (separate from general app logs) for security-relevant and admin actions (§16) — retained longer, access-restricted to a smaller admin subset than general logs.
- **Metrics:** OpenTelemetry instrumentation → dashboards for request latency, error rate, queue depth, DB connection pool saturation — the operational signals needed to know something's wrong before users report it.

---

## 20. Backup Strategy

- **Database:** automated daily full snapshots + continuous WAL archiving for point-in-time recovery (PITR) — target RPO (max acceptable data loss) of 5 minutes, RTO (max acceptable downtime to restore) of under 1 hour.
- **Object storage:** versioning enabled on all buckets (protects against accidental overwrite/delete); cross-region replication for the buckets holding paid content (course videos, purchased e-books) — losing purchased content a user paid for is a business-critical failure mode.
- **Testing:** scheduled restore drills (quarterly) against a sandbox environment — a backup that's never been restored isn't a verified backup.
- **Retention:** 30 days of daily snapshots, 12 months of monthly snapshots, aligned with the data retention policy in §18.

---

## 21. Deployment Strategy

- **CI/CD:** GitHub Actions — lint, type-check, test, build on every PR; deploy on merge to `main` (staging) and on tagged release (production).
- **Environments:** `local` → `staging` (production-like, seeded data, used for QA and stakeholder review) → `production`. No direct-to-prod deploys.
- **Hosting:**
  - `apps/web` and `apps/admin`: Vercel (or equivalent edge platform) — matches how the Homepage already deploys, gets CDN/edge caching and preview deployments for free.
  - `apps/api` and `apps/workers`: containerized (Docker), deployed to a managed container platform (AWS ECS Fargate / Railway / Fly.io) — needs long-running processes and background job workers that don't fit a serverless-only model.
  - Database/Redis/search: managed services, not self-hosted, in the same region as the API for latency.
- **Infrastructure as Code:** Terraform for all cloud resources — no manual console changes, every environment reproducible from git.
- **Release strategy:** blue-green or canary deploys for `apps/api` (health-checked before traffic cutover); feature flags (e.g., LaunchDarkly or a lightweight in-house flag table) for gradually rolling out risky features (new AI capabilities, marketplace payments) without a full deploy-based rollback.
- **Rollback:** every deploy is a tagged, immutable artifact — rollback is redeploying the previous tag, not reverting code and rebuilding.

---

## Cross-Cutting Notes

- **Scalability path:** the architecture above is deliberately "boring" at launch (single Postgres primary, REST, monorepo, managed services) and scales by adding read replicas, caching layers, and splitting services out of the monorepo as real bottlenecks appear — not by over-engineering for millions of users before there are thousands.
- **Mobile readiness:** the `packages/api-client` + `packages/types` + `packages/validation` split exists specifically so a future `apps/mobile` (React Native/Expo) consumes the same typed API client the web app uses, rather than reimplementing API integration from scratch.
- **i18n readiness:** `packages/i18n` generalizes the current `ar`/`en` dictionary pattern already used on the Homepage into a shared package other apps (admin, mobile) draw from, so adding a third language is a translation-file change, not a code change.
- **Next step:** once this architecture is approved, the recommended sequence is (1) stand up the monorepo shell around the existing Homepage app with zero behavior change, (2) stand up `apps/api` with just the Auth module, (3) build one vertical slice end-to-end (e.g., Courses) to validate the pattern before replicating it across the remaining domains.
