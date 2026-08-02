# 12 — AI Integration Bible

Status: Governing standard for every AI-powered capability on the Phoenix Platform (AI Tools directory recommendations, learning assistant, content-generation aids, search ranking, future expansions). Applies to the AI Gateway defined in `09-PLATFORM-ARCHITECTURE.md` §10 and every feature built on top of it. No feature integrates directly with an AI provider outside this Gateway.

---

## 1. AI Architecture Philosophy

- **One gateway, many features.** Every AI-powered capability on the platform is a thin feature built on top of a single internal AI Gateway — no feature ever holds a provider API key or calls a provider SDK directly.
- **Provider-agnostic by design.** The platform is never architecturally locked to a single AI vendor. Provider choice is a configuration and routing decision inside the Gateway, not something baked into feature code.
- **AI is assistive, not authoritative.** AI-generated output (recommendations, drafts, summaries) is treated as a suggestion requiring either explicit user action or human review before it becomes published, billed, or otherwise consequential platform content — the platform does not let an AI model autonomously take irreversible actions.
- **Cost and abuse are first-class concerns from day one**, not retrofitted after a bill spikes — every AI capability is metered and quota-enforced before it ships, not after.
- **Privacy-conscious by default.** User content sent to AI providers is minimized to what's operationally necessary, and users are told when their input is processed by AI.

---

## 2. Provider Abstraction

- The AI Gateway exposes a single internal interface (e.g., `generateCompletion`, `generateEmbedding`, `streamChat`) to the rest of the platform — feature code calls this interface and has no awareness of which underlying provider or model actually serviced the request.
- Provider-specific adapters live entirely inside the Gateway module; adding or replacing a provider means writing one new adapter, not touching every feature that uses AI.
- Model selection (which provider, which model tier) is a routing decision made inside the Gateway based on request type, cost tier, and current provider health — not hardcoded per feature.
- Prompts are templated and versioned centrally within the Gateway (§7), not duplicated inline across feature code, so a prompt-quality fix or provider-specific prompt adjustment is made once.

---

## 3. Supported AI Providers

- The Gateway is designed to support multiple concurrent providers (e.g., OpenAI, Anthropic, and a self-hosted/open-weight option for cost-sensitive or data-residency-sensitive workloads), selected per use case rather than platform-wide exclusivity to one vendor.
- Provider selection criteria per use case: output quality for the specific task, latency requirements (interactive chat vs. background batch generation), cost per request at the platform's expected volume, and data-handling/retention terms offered by the provider.
- New providers are onboarded through the same adapter pattern (§2) and undergo the same security/privacy review (§11, §12) as existing providers before being enabled for any production traffic.
- Provider credentials are managed exclusively through the platform's secrets manager (`10-SECURITY-BIBLE.md` §17), scoped to the Gateway service only — no other service holds provider API keys.

---

## 4. Failover Strategy

- Each AI capability is configured with a primary provider/model and one or more fallback providers/models, ranked by suitability for that specific task.
- The Gateway monitors provider health (error rate, latency) in near-real-time; a provider exceeding defined error/latency thresholds is automatically deprioritized in favor of its fallback for new requests, without requiring a manual deploy.
- Failover is transparent to the calling feature — the Gateway's response contract is identical regardless of which provider ultimately served the request, so feature code requires no special-casing for a failover event.
- A full-provider outage (primary and all fallbacks unavailable) degrades gracefully per feature: interactive features surface a clear "temporarily unavailable" state rather than an error page; non-interactive features (batch content aids) queue the request for retry rather than failing outright.
- Failover events are logged and alerted on (§10) so sustained reliance on a fallback provider is visible to the engineering team, not silently absorbed indefinitely.

---

## 5. Cost Tracking

- Every AI Gateway request is tagged with the requesting user ID, feature/use-case, provider, model, and token counts (input/output) at the point of response, and persisted for cost attribution.
- Cost is aggregated and surfaced on the admin dashboard (`09-PLATFORM-ARCHITECTURE.md` §16) broken down by feature and by time period, so cost anomalies (a feature suddenly consuming disproportionate spend) are visible quickly rather than discovered on a monthly provider invoice.
- Per-user and per-plan cost is tracked against the quota system (§9) — cost tracking and quota enforcement share the same underlying usage data rather than being maintained as two separate systems that can drift out of sync.
- Budget alerting thresholds are configured at the platform level (total daily/monthly spend) and trigger notification to engineering/finance stakeholders before a hard budget cap is reached, giving time to react before service degradation is needed.

---

## 6. Prompt Management

- Prompts are treated as versioned configuration, stored and reviewed the same way code is (in version control, reviewed via pull request) — never edited ad hoc in a database or admin UI without a change record.
- Each prompt template is versioned; a feature references a specific prompt version, allowing safe iteration (a new prompt version can be tested against a subset of traffic before becoming the default) without silently changing behavior for all users mid-rollout.
- User-supplied input is inserted into prompts through clearly defined, escaped insertion points — never string-concatenated in a way that lets user input override system instructions (prompt injection surface is minimized structurally, not just through instruction wording).
- System-level instructions (the platform's persistent behavioral constraints — tone, safety boundaries, scope limits) are kept separate from user-turn content in every request, using the provider's role-separated message format where available, so user input cannot easily masquerade as a system instruction.

---

## 7. Response Validation

- AI provider responses are never passed directly to the client or persisted as-is without validation appropriate to their use: structured outputs (e.g., a generated quiz question set) are validated against a strict schema before acceptance; free-form outputs (chat responses) pass through a content-safety check before being shown to the user.
- Responses intended to become published platform content (course descriptions, generated summaries) require the same content-moderation pipeline applied to human-submitted content, plus a human review/approval step before publication — AI output does not bypass editorial controls.
- Malformed or schema-violating structured responses trigger a bounded retry (not an infinite loop) before falling back to a graceful failure state, rather than surfacing a broken result to the user.
- Hallucination risk is mitigated per use case: factual or instructional content generation is scoped with retrieval-grounding (providing the model relevant platform content as context) rather than relying on the model's unaided knowledge, wherever accuracy materially matters (e.g., referencing actual course content, not fabricated details).

---

## 8. AI Logging

- Every Gateway request/response pair is logged with: requesting user ID, feature, provider/model, prompt version, token counts, latency, and outcome (success/error/moderation-blocked) — consistent with the platform's general logging standard (`10-SECURITY-BIBLE.md` §18) but in a dedicated AI usage log distinct from general application logs.
- Full prompt and response content is logged for a limited retention window (shorter than general logs, per §14, given the sensitivity of conversational content) to support abuse investigation, quality monitoring, and debugging — access to full-content logs is restricted to a small authorized group, distinct from access to the aggregate usage/cost metrics.
- AI logs are never used as a substitute for the platform's security audit log (`10-SECURITY-BIBLE.md` §18) — AI-specific logging captures usage/quality signals; security-relevant actions taken via an AI-assisted flow are still separately recorded in the security audit trail.

---

## 9. User Quotas

- Every AI-powered feature has an explicit per-user quota (requests per day, or token budget per billing period), tiered by account plan — no AI capability is offered with unlimited, unmetered usage.
- Quota consumption is checked before a request is dispatched to a provider (fail closed, not after incurring cost) — a user over quota receives a clear, immediate quota-exceeded response rather than the request silently proceeding.
- Quota state is tracked in Redis for low-latency enforcement, with periodic reconciliation against the durable cost-tracking data (§5) to catch any drift.
- Quota resets follow the account's billing cycle boundary; unused quota does not accumulate indefinitely unless a specific plan explicitly offers rollover, which is a deliberate product decision, not a default behavior.
- Admin-capable roles have separate, generous internal-use quotas distinct from customer-facing plan quotas, still metered and logged (§8) to catch internal misuse or runaway automation.

---

## 10. Rate Limiting

- AI Gateway endpoints enforce their own rate limits distinct from, and generally stricter than, the platform's general API rate limits (`10-SECURITY-BIBLE.md` §12) — a burst of AI requests is more costly and more abuse-prone than a burst of ordinary read requests.
- Rate limiting operates independently of quota enforcement (§9): rate limits prevent short-term abusive bursts (protecting provider relationships and shared infrastructure), while quotas govern longer-term fair usage and cost — a user comfortably within their daily quota can still be rate-limited if requesting too rapidly in a short window.
- Streaming interactive features (chat-style) apply rate limiting at the session/connection level in addition to per-request limiting, preventing a single abusive session from monopolizing Gateway capacity.
- Sustained rate-limit violations from a given account are surfaced to the abuse-monitoring pipeline (§10 of `09-PLATFORM-ARCHITECTURE.md`'s logging architecture) for review, as they may indicate automated scraping or credential misuse rather than legitimate heavy use.

---

## 11. Security

- The AI Gateway is treated as a security-sensitive service under the full scope of `10-SECURITY-BIBLE.md` — authenticated, authorized, rate-limited, and logged like any other platform API, with no exception for being "just AI."
- Prompt injection is treated as a real attack surface: user input is never allowed to alter system-level instructions (§6), and any AI-generated output that could trigger a downstream action (e.g., "AI suggests publishing this content") requires the same authorization checks a human-initiated request would — an AI response is never treated as an authenticated, authorized instruction on its own.
- Outputs are not executed as code or used to construct database queries/system commands under any circumstance — AI output is data, handled with the same suspicion as any other untrusted input (`10-SECURITY-BIBLE.md` §1).
- Provider API credentials are scoped narrowly to the Gateway service and rotated on the platform's standard secrets rotation schedule (`10-SECURITY-BIBLE.md` §17).

---

## 12. Privacy

- Users are informed, in-product and in the privacy policy, when a feature sends their input to a third-party AI provider for processing — this is disclosed, not silent.
- Data sent to providers is minimized to what the specific request requires — full user profile or unrelated platform data is never bundled into a prompt "just in case" it's useful.
- Provider selection (§3) factors in each provider's data-retention and training-use terms; providers that retain or train on submitted data beyond the minimum necessary for serving the request are avoided for any request containing user-identifiable or sensitive content, in favor of providers offering zero-retention or non-training terms.
- Where technically offered by a provider, opt-out-of-training / zero-data-retention API modes are enabled by default for all Phoenix Gateway traffic — this is a platform-wide default, not a per-feature decision left to individual engineers.

---

## 13. PII Handling

- Prompts are constructed to avoid including personally identifiable information beyond what's functionally necessary for the specific AI task — a learning-assistant chat about course content does not need the user's email or payment history included in context.
- Where user-specific context genuinely is required (e.g., referencing the user's own course progress to personalize a response), it is passed as the minimum necessary structured fields, not as a raw dump of the user's profile record.
- Logged prompt/response content (§8) is scanned for common PII patterns (email addresses, phone numbers, payment-like number sequences) and redacted before persistence, balancing debuggability against unnecessary long-term storage of sensitive user input.
- Any AI-processed content that could contain sensitive personal disclosures (e.g., a user describing a personal situation to a learning assistant) is handled under the platform's standard sensitive-data handling rules (`10-SECURITY-BIBLE.md` §16, §18) for both the live request path and any logged copy.

---

## 14. Model Versioning

- Every Gateway request records the exact provider model identifier and version used to produce a response — model version is treated as part of the request's audit trail (§8), not an implementation detail left untracked.
- Model upgrades (a provider releasing a new model version) are rolled out deliberately: evaluated against the platform's existing prompt templates and validation rules (§6, §7) in staging before becoming the default in production, not auto-adopted the moment a provider ships a new version.
- Where output consistency matters for a specific feature (e.g., structured quiz generation with a strict schema), the Gateway can pin to a specific model version rather than always tracking "latest," with an explicit, reviewed process to advance the pin.
- Deprecated model versions are phased out on a schedule that gives dependent features time to validate against the replacement, coordinated through the same failover/routing configuration described in §2 and §4.

---

## 15. Monitoring

- Gateway-level dashboards track: request volume, latency (p50/p95/p99), error rate, and cost, broken down per provider and per feature — consistent with the platform's general observability standard (`09-PLATFORM-ARCHITECTURE.md` §19).
- Quality monitoring is distinct from operational monitoring: a sample of AI responses is periodically reviewed (automated heuristics plus human spot-checks) for relevance, safety, and accuracy regressions that wouldn't show up as an "error" in operational metrics but represent a degraded user experience.
- Alerting thresholds are defined for: elevated error rate on any provider, latency regression, quota/rate-limit trigger spikes (possible abuse signal), and cost trending outside expected bounds (§5) — each routes to the appropriate owning team rather than a single undifferentiated alert channel.
- AI-specific incidents (a provider outage, a prompt-injection attempt, a cost anomaly) follow the same Incident Response process defined in `10-SECURITY-BIBLE.md` §19, with the AI Gateway treated as any other critical platform service for response-severity purposes.

---

## 16. Future AI Expansion Strategy

- New AI-powered features are added by defining a new use case against the existing Gateway interface (§2) — the Gateway's provider-agnostic, quota-aware, logged foundation is built once and reused, so platform growth in AI capability is additive to existing infrastructure rather than requiring parallel integration work each time.
- Expansion candidates anticipated beyond initial launch scope include: deeper course-content generation tooling for instructors, AI-assisted search relevance tuning, personalized learning-path recommendations, and automated content-moderation assistance for user-generated reviews/comments — each evaluated against the same cost, quota, privacy, and validation standards in this document before being greenlit, not treated as exempt "experiments."
- Fine-tuning or hosting platform-specific models (rather than relying solely on general-purpose provider APIs) is a future option the architecture does not foreclose — the adapter pattern (§2) accommodates a self-hosted model as just another provider adapter when that investment is justified by scale or differentiation needs.
- Any AI capability that would take a consequential action with reduced human oversight (moving beyond "assistive," §1) requires an explicit architecture and security review before development begins, not just before launch — the assistive-by-default principle is a standing constraint on new feature design, not a one-time launch decision.
