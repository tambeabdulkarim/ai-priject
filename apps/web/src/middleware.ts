// Next.js only auto-detects middleware at exactly this path (src root) —
// it will NOT pick up a file inside src/middlewares/. Kept as a thin
// re-export so the actual implementation still lives in
// src/middlewares/middleware.ts per docs/FRONTEND-PHASE-1-API-
// ARCHITECTURE.md §3's folder convention.
export { middleware, config } from './middlewares/middleware';
