// Shared TypeScript types for API contracts, consumed by apps/web,
// apps/admin, and the future apps/mobile. Populated incrementally,
// resource group by resource group, alongside packages/api-client —
// Frontend Phase 2 (Foundation Layer) added Auth/Users/Files. Frontend
// Phase 3 (Public Foundation Pages) added the public read surface of
// News/Courses/Library. Frontend Phase 4 (Authenticated User Experience)
// adds Notifications/Enrollments/Progress/Certificates/Lessons and
// extends Users with the real PATCH /users/me + change-password shapes.
// Marketplace/AI/Admin/Settings types are added when those features are
// actually built, per docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md's
// parallel roadmap — not stubbed ahead of need.

export * from './src/errors';
export * from './src/pagination';
export * from './src/auth';
export * from './src/users';
export * from './src/files';
export * from './src/news';
export * from './src/courses';
export * from './src/library';
export * from './src/lessons';
export * from './src/notifications';
export * from './src/enrollments';
export * from './src/progress';
export * from './src/certificates';
export * from './src/media';
export * from './src/modules';
export * from './src/moderation';
export * from './src/settings';
export * from './src/analytics';
