# Phoenix Content Library — Official Documentation Links

**Status:** Master blueprint, Phase 24. These are the **top-level, official documentation entry points** for the 20 platforms/tools this task named — the most stable part of any documentation site (root domains for major platforms rarely change) and therefore the highest-confidence links in this entire content library. **Deep-linked pages to specific articles (e.g. a specific API reference page) are more likely to move or be reorganized — verify the specific deep link at content-production time, per `quality-standards.md`; the root domains below are the reliable anchor.**

| Platform | Official documentation entry point |
|---|---|
| Microsoft Learn | https://learn.microsoft.com |
| Google Developers | https://developers.google.com |
| OpenAI | https://developers.openai.com/api/docs/overview *(corrected Phase 25 — `platform.openai.com/docs` now redirects here; live-verified)* |
| Anthropic | https://platform.claude.com/docs *(corrected Phase 25 — `docs.anthropic.com` no longer resolves directly; live-verified via anthropic.com)* |
| Meta for Developers | https://developers.facebook.com |
| AWS | https://docs.aws.amazon.com |
| Azure | https://learn.microsoft.com/azure (part of Microsoft Learn) |
| Google Cloud | https://cloud.google.com/docs |
| Docker | https://docs.docker.com |
| Kubernetes | https://kubernetes.io/docs |
| Linux Foundation | https://www.linuxfoundation.org (training: https://training.linuxfoundation.org) |
| MDN Web Docs | https://developer.mozilla.org |
| Python | https://docs.python.org |
| React | https://react.dev |
| Next.js | https://nextjs.org/docs |
| Node.js | https://nodejs.org/docs |
| PostgreSQL | https://www.postgresql.org/docs |
| Prisma | https://www.prisma.io/docs |
| Stripe | https://docs.stripe.com |
| GitHub | https://docs.github.com |

## Mapping to Categories

| Category | Primary documentation sources used |
|---|---|
| Artificial Intelligence, Machine Learning, Deep Learning | OpenAI, Anthropic, Google Developers |
| Prompt Engineering | OpenAI, Anthropic |
| Programming, Web Development | MDN, Python, React, Next.js, Node.js, GitHub |
| Cloud Computing, DevOps | AWS, Azure, Google Cloud, Docker, Kubernetes, Linux Foundation |
| Databases | PostgreSQL, Prisma |
| Cyber Security | MDN (web security sections), AWS/Azure/GCP security docs, Linux Foundation |
| Networking | Linux Foundation, MDN (HTTP sections) |
| Mobile Development | Meta for Developers (React Native's origin org), Google Developers (Android) |
| Business/Freelancing/Entrepreneurship/Productivity/Career Prep, UI/UX | not primarily documentation-driven categories — see `books.md`/`videos.md` for these instead |

## Verification Policy

Every URL above is a well-known, canonical top-level domain — high confidence. Per this library's standing policy (see `quality-standards.md`), a live link-check pass is still required before publish, since even root domains occasionally restructure (e.g. a platform consolidating docs under a new subdomain). This table should be re-verified at the start of every content-production phase in `content-roadmap.md`, not just once at authoring time.

## Duplication Check

Each platform appears once. Where two categories legitimately draw on the same platform (e.g. Kubernetes docs serve both Cloud Computing and DevOps), that's expected shared infrastructure, not a duplicate entry — noted explicitly in the mapping table above.
