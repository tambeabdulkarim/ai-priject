# 11 — Database Bible

Status: Governing standard for all Phoenix data storage (PostgreSQL primary, Redis cache, object storage metadata, search indices). Applies to every schema designed under `09-PLATFORM-ARCHITECTURE.md` §7. Every new table, migration, and query is expected to conform to this document; deviations require an explicit, documented exception.

---

## 1. Database Philosophy

- **One logical source of truth.** PostgreSQL is the system of record for all durable business data. Redis and search indices are derived, rebuildable caches — never the only copy of authoritative data.
- **Explicit over implicit.** Schemas are designed to be understandable from the schema alone — meaningful names, documented relationships, no "magic" columns whose purpose requires tribal knowledge.
- **Design for change.** Every table anticipates its own evolution: nullable-by-default for new optional columns, no `SELECT *` reliance in application code, additive migrations preferred over destructive ones.
- **Data integrity belongs in the database.** Constraints (foreign keys, not-null, unique, check) are enforced at the schema level, not left solely to application-layer validation — application bugs should not be able to produce an inconsistent database.
- **Boring, proven technology.** PostgreSQL's relational model, transactions, and constraint system are relied on fully before reaching for specialized stores; a new storage technology is introduced only when a specific, demonstrated need (full-text search, high-frequency counters) isn't well served by Postgres.

---

## 2. Naming Conventions

- Tables: `snake_case`, plural nouns (`users`, `course_modules`, `order_items`).
- Columns: `snake_case`, singular (`email`, `created_at`, `course_id`).
- Primary keys: always named `id`.
- Foreign keys: `<referenced_table_singular>_id` (`user_id`, `course_id`) — unambiguous even when joined tables are read out of context.
- Join/pivot tables: both referenced table names, singular, alphabetical or logical order, separated by underscore (`role_permissions`, `user_roles`).
- Boolean columns: prefixed `is_`/`has_` (`is_published`, `has_certificate`).
- Timestamps: suffixed `_at` (`created_at`, `published_at`, `deleted_at`), always `timestamptz`, never bare `timestamp` (timezone-naive timestamps are prohibited — see §9).
- Enums: named `<table>_<column>_enum` where a native Postgres enum type is used, or a `check` constraint against a small fixed string set for values expected to change occasionally (roles, statuses) where an enum's migration cost is undesirable.
- Indexes: `idx_<table>_<column(s)>`; unique constraints: `uq_<table>_<column(s)>`; foreign key constraints: `fk_<table>_<referenced_table>`.

---

## 3. Schema Organization

- Postgres schemas (namespaces) group tables by domain, mirroring the `apps/api` module boundaries: `auth`, `courses`, `library`, `marketplace`, `news`, `notifications`, `admin`. The `public` schema is not used for application tables.
- Each domain schema is owned by a corresponding `apps/api` module — cross-schema foreign keys are permitted (e.g., `marketplace.orders.user_id → auth.users.id`) but cross-schema writes from outside the owning module are not; a module never directly writes another domain's tables, it calls that module's service layer.
- Database roles are scoped per schema where practical, following least-privilege (`10-SECURITY-BIBLE.md` §3) — the application's runtime connection role has DML rights on domain schemas it needs and no DDL rights at runtime under any circumstance; DDL only happens through the migration pipeline (§10) using a separate, more privileged, CI-only credential.

---

## 4. Table Standards

- Every table has: a primary key (§5), `created_at` and `updated_at` audit timestamps (§9), and, for user-facing mutable entities, a `deleted_at` for soft delete (§8).
- No table exceeds a reasonable column count as a design smell threshold (~25 columns) — a table approaching this is a signal to split out a related table rather than keep widening it.
- Every column is `NOT NULL` unless there is a specific, documented reason for nullability — nullable-by-default is not the starting assumption.
- Every column has an appropriate, minimal type: `text` over unnecessarily constrained `varchar(n)` unless a real business-rule length limit exists; `numeric` for money (never `float`/`double precision` for any currency value); `timestamptz` for all time values.
- Enumerated status/state columns document their full set of valid values in a code comment on the migration and in the corresponding `packages/types` definition — the database and the application type system never drift apart.

---

## 5. Relationship Standards

- Every foreign key is a real, enforced database foreign key constraint — "logical" relationships maintained only in application code are prohibited; the database is the enforcement point.
- One-to-many is the default modeling choice; many-to-many always goes through an explicit join table (never a comma-separated or JSON array column standing in for a relationship) so referential integrity, indexing, and additional relationship metadata (e.g., `role_permissions.granted_at`) are all possible.
- Polymorphic associations (a single column referencing multiple possible parent tables) are avoided — they cannot be enforced by a foreign key constraint. Where the business need is real (e.g., comments on both courses and news articles), separate join tables per parent type are used instead.
- Cascading behavior is explicit and deliberate per foreign key: `ON DELETE CASCADE` only where child rows have no meaning without the parent (e.g., `lesson_progress` rows cascade with their `lesson`); `ON DELETE RESTRICT` is the default elsewhere, forcing an explicit decision rather than silent data loss.

---

## 6. Primary Keys

- UUID (v7, time-ordered) is the standard primary key type platform-wide — globally unique without a central sequence, safe to generate client-side or in `apps/workers` before insertion, and doesn't leak sequential business volume (e.g., total user count) the way an auto-incrementing integer would.
- UUIDv7's time-ordered property is specifically chosen over UUIDv4 to avoid the index-fragmentation performance cost random UUIDs cause on the primary key's B-tree index at scale.
- Composite primary keys are used only for pure join tables with no independent identity of their own (e.g., `role_permissions(role_id, permission_id)`); any table with independent business meaning gets its own single `id` even if a natural composite key exists, since surrogate keys keep foreign-key references simpler across the schema.

---

## 7. Foreign Keys

- Always indexed (§8) — an unindexed foreign key column is a standing performance liability on every join and every parent-row delete/update check.
- Always constrained (`REFERENCES` with an explicit `ON DELETE`/`ON UPDATE` action, §5) — never left as a "convention only" relationship.
- Nullable foreign keys are permitted only where the relationship is genuinely optional (e.g., `courses.reviewed_by_id` before a course has been reviewed) and are documented as such.

---

## 8. Index Strategy

- Every foreign key column is indexed by default, without exception.
- Additional indexes are added deliberately based on actual query patterns (columns used in `WHERE`, `ORDER BY`, and `JOIN` clauses that aren't already covered by a foreign key index), not speculatively on every column.
- Composite indexes follow the query's actual filter order (most selective / equality-filtered column first, range-filtered columns last) rather than being added in schema-definition order out of habit.
- Partial indexes are used for the common case of filtering on a status alongside soft-delete (`WHERE deleted_at IS NULL`) — smaller, faster indexes than indexing the full table when the majority of queries only care about "live" rows.
- Full-text search is not implemented via Postgres `tsvector` indexes for catalog browsing (tools/courses/news) — that responsibility belongs to the dedicated search index (Meilisearch, `09-PLATFORM-ARCHITECTURE.md` §7) — Postgres indexes here stay focused on transactional access patterns, not search relevance ranking.
- Index usage is reviewed periodically against `pg_stat_user_indexes`; unused indexes are removed (every index has a write-cost even when never read) and missing indexes are identified from slow-query logs, not guessed.

---

## 9. Audit Fields

- `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()` (maintained via a trigger or the ORM's automatic update hook, never left to application code to remember) are mandatory on every table.
- `created_by_id` / `updated_by_id` (nullable foreign keys to `auth.users`) are added on tables where "who made this change" is operationally meaningful — primarily admin-managed content (courses, news articles, products) — not on every table indiscriminately.
- All timestamps are stored in UTC (`timestamptz` handles this natively) — locale/timezone conversion is strictly a presentation-layer concern, never a storage-layer one.
- Security- and compliance-relevant audit trails (role changes, admin actions, financial transactions) additionally write to the append-only audit log described in `10-SECURITY-BIBLE.md` §18, distinct from the per-row `updated_at`/`updated_by_id` convenience fields — the audit log captures full history, the row-level fields only capture the latest state.

---

## 10. Migration Strategy

- Schema changes are managed exclusively through versioned Prisma migrations, committed to version control — no manual schema edits against any environment, staging or production, under any circumstance.
- Migrations are additive-first: a breaking change (renaming/removing a column the application still reads) is split into multiple deploys — add the new structure, migrate/dual-write, cut the application over, then remove the old structure in a later migration — so a deploy is never blocked on a migration completing, and rollback of an application deploy doesn't require a database rollback.
- Every migration is reversible where technically possible (a corresponding `down` migration); destructive migrations that cannot be cleanly reversed require a documented backup checkpoint immediately before execution.
- Migrations run automatically as a distinct CI/CD pipeline step before the new application version receives traffic, using the elevated CI-only migration credential (§3) — the runtime application credential never has schema-alteration rights.
- Large data backfills (touching millions of rows) are run as batched, throttled background jobs via `apps/workers`, never as a single long-running migration transaction that could hold locks and degrade production traffic.

---

## 11. Performance Strategy

- Query performance is validated against realistic data volumes in staging before shipping, not assumed safe from small local development datasets.
- N+1 query patterns are treated as bugs — the ORM's relation-loading/batching features are used deliberately for any list view that renders related data.
- Connection pooling (PgBouncer, transaction mode) sits in front of Postgres once concurrent connection counts from `apps/api` and `apps/workers` combined approach the database's native connection limit — introduced ahead of actual exhaustion, not reactively after an outage.
- Hot, frequently-read, rarely-changing data (published course catalog listings, tool directory) is cached in Redis with explicit, short TTLs and event-driven invalidation on write, reducing primary database read load for the platform's highest-traffic queries.
- Slow query logging is enabled in every environment above local development; queries exceeding a defined threshold are surfaced in the logging/metrics pipeline (`09-PLATFORM-ARCHITECTURE.md` §19) for regular review, not left undiscovered until they cause an incident.

---

## 12. Scaling Strategy

- **Vertical first:** the managed Postgres instance is scaled up (CPU/RAM/IOPS) as the first, simplest lever — avoids premature architectural complexity.
- **Read replicas next:** introduced once read traffic (catalog browsing, analytics, admin reporting) meaningfully exceeds what the primary should absorb alongside write traffic; read-heavy, latency-tolerant queries (admin dashboards, §7 of `09-PLATFORM-ARCHITECTURE.md`) are routed to replicas first.
- **Partitioning/sharding last, and only where justified:** tables with genuinely unbounded growth and a clear, stable partition key (`notifications` and `activity_logs` by time; potentially `lesson_progress` by user-hash at very large scale) are candidates for partitioning once volume data justifies it — this is not implemented speculatively at launch.
- **Caching absorbs read pressure before the database schema is restructured for scale** — Redis-layer caching (§11) is the first response to read-latency problems; schema-level sharding is the last resort, reserved for confirmed, sustained bottlenecks that caching cannot address.
- Cross-region read replicas are considered only once the user base has a meaningful geographic distribution that single-region latency demonstrably affects — not built ahead of that need.

---

## 13. Backup Strategy

Full detail lives in `09-PLATFORM-ARCHITECTURE.md` §20 and `10-SECURITY-BIBLE.md` §20; the database-specific summary:

- Continuous WAL archiving enables point-in-time recovery to any second within the retention window, not just to the last daily snapshot.
- Daily full snapshots, retained 30 days; monthly snapshots retained 12 months.
- Snapshots and WAL archives are stored encrypted, in a separate access-controlled location from the primary database credentials.
- Restore drills are performed quarterly against a sandbox environment and the result (success/failure, time-to-restore) is logged — an unverified backup is treated as if it does not exist.

---

## 14. Data Retention

- Retention periods are defined per data category, not applied uniformly:
  - **Account/profile data:** retained for the life of the account; deleted (§ below) within 30 days of a verified account-deletion request.
  - **Financial/order records:** retained for the statutory minimum required for tax/accounting compliance in operating jurisdictions (typically 7 years), regardless of account deletion status — legal retention requirements override user deletion requests for this category specifically, and this exception is disclosed in the privacy policy.
  - **Security/audit logs:** retained a minimum of 1 year for security investigation purposes, longer where compliance requirements demand it.
  - **General application/operational logs:** retained 90 days, sufficient for operational debugging without indefinite accumulation.
  - **AI Gateway prompt/response logs:** retained per `12-AI-INTEGRATION-BIBLE.md` §8, shorter than general data given the sensitivity of conversational content.
- "Delete my data" requests (GDPR/CCPA-style) are honored by hard-deleting or irreversibly anonymizing personal fields across all owning tables within the defined SLA, with the exception of legally-required financial records (anonymized where the record itself must be kept but the identifying link need not be).

---

## 15. Archiving Policy

- Tables with high write volume and low long-term query need (`notifications`, `activity_logs`, superseded `lesson_progress` events) are archived, not deleted outright — moved to cold, cheaper storage (a dedicated archive schema, or exported to object storage as compressed batches) once past an operational-relevance age (e.g., 12 months).
- Archived data remains restorable/queryable on demand for compliance or investigation purposes but is excluded from the primary schema's day-to-day indexes and query plans, keeping the hot tables lean.
- Archiving runs as a scheduled `apps/workers` job, batched and throttled the same way large migrations are (§10), never as a blocking operation against the live schema.
- The archiving policy is reviewed alongside the data retention policy (§14) — data reaching the end of its retention period is deleted outright rather than archived indefinitely; archiving extends operational table performance, it does not override the retention/deletion schedule.
