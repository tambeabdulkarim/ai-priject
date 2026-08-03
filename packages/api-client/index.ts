// Typed SDK wrapping the apps/api HTTP surface defined in
// docs/16-API-CONTRACT.md, shared by apps/web, apps/admin, and the future
// apps/mobile so no consumer re-implements API integration independently.
//
// Frontend Phase 2 (Foundation Layer) added Auth, Users ("me"), and Files.
// Frontend Phase 3 (Public Foundation Pages) added the PUBLIC read
// surface of News, Courses, and Library. Frontend Phase 4 (Authenticated
// User Experience) adds Notifications, Enrollments, Progress,
// Certificates, and Lessons, and extends Users with the real
// PATCH /users/me + change-password calls. Marketplace/AI/Admin/Settings
// resources are added alongside their own feature phases, per
// docs/FRONTEND-PHASE-1-API-ARCHITECTURE.md's parallel roadmap.

import { createRequestFn } from './src/core/request';
import type { ApiClientConfig } from './src/core/client-config';
import { createAuthResource } from './src/resources/auth';
import { createUsersResource } from './src/resources/users';
import { createFilesResource } from './src/resources/files';
import { createNewsResource } from './src/resources/news';
import { createCoursesResource } from './src/resources/courses';
import { createLibraryResource } from './src/resources/library';
import { createLessonsResource } from './src/resources/lessons';
import { createNotificationsResource } from './src/resources/notifications';
import { createEnrollmentsResource } from './src/resources/enrollments';
import { createProgressResource } from './src/resources/progress';
import { createCertificatesResource } from './src/resources/certificates';
import { createMediaResource } from './src/resources/media';
import { createAdminResource } from './src/resources/admin';
import { createSettingsResource } from './src/resources/settings';

export type { ApiClientConfig, ApiResult, RequestOptions } from './src/core/client-config';
export { ApiError, NetworkError, TimeoutError } from './src/core/errors';
export type { HttpMethod, RequestFn } from './src/core/request';
export type { AuthResource } from './src/resources/auth';
export type { UsersResource } from './src/resources/users';
export type { FilesResource, UploadFileParams } from './src/resources/files';
export type { NewsResource } from './src/resources/news';
export type { CoursesResource } from './src/resources/courses';
export type { LibraryResource } from './src/resources/library';
export type { LessonsResource } from './src/resources/lessons';
export type { NotificationsResource } from './src/resources/notifications';
export type { EnrollmentsResource } from './src/resources/enrollments';
export type { ProgressResource } from './src/resources/progress';
export type { CertificatesResource } from './src/resources/certificates';
export type { MediaResource } from './src/resources/media';
export type { AdminResource } from './src/resources/admin';
export type { SettingsResource } from './src/resources/settings';

export function createApiClient(config: ApiClientConfig) {
  const request = createRequestFn(config);
  return {
    auth: createAuthResource(request),
    users: createUsersResource(request),
    files: createFilesResource(request),
    news: createNewsResource(request),
    courses: createCoursesResource(request),
    library: createLibraryResource(request),
    lessons: createLessonsResource(request),
    notifications: createNotificationsResource(request),
    enrollments: createEnrollmentsResource(request),
    progress: createProgressResource(request),
    certificates: createCertificatesResource(request),
    media: createMediaResource(request),
    admin: createAdminResource(request),
    settings: createSettingsResource(request),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
