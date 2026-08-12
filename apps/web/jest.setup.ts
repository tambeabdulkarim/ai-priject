// Required by apps/web/src/config/env.ts's fail-fast validation, which
// runs at module-import time (before any test's own setup code could run).
// A plain, valid placeholder — no real backend is contacted, every network
// call in these tests goes through a mocked global fetch.
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
