// docs/16-API-CONTRACT.md §4/§5 (Courses/Lessons). Verified against
// apps/api/src/modules/{courses/courses.repository.ts,lessons/lessons.repository.ts}.
//
// `CourseDetail`'s lesson `body` is `string | null` — the backend
// redacts it to `null` server-side for any non-preview lesson the
// viewer isn't entitled to (production-readiness audit fix). This
// frontend must render that `null` as "sign in / enroll to view", never
// treat it as an empty-but-viewable lesson.

export interface CourseSummary {
  id: string;
  instructorId: string;
  categoryId: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'in_review' | 'published' | 'archived';
  priceCents: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The redacted-aware lesson shape returned inside `CourseDetail.modules[].lessons[]` — distinct from `LessonSummary` (the metadata-only list endpoint), which never includes `body` at all. */
export interface CourseDetailLesson {
  id: string;
  moduleId: string;
  title: string;
  position: number;
  contentType: 'video' | 'text' | 'quiz';
  body: string | null;
  videoMediaId: string | null;
  durationSeconds: number | null;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleWithLessons {
  id: string;
  courseId: string;
  title: string;
  position: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lessons: CourseDetailLesson[];
}

export interface CourseDetail extends CourseSummary {
  modules: CourseModuleWithLessons[];
}

/** docs/16-API-CONTRACT.md GET .../lessons — metadata only, `body` never included regardless of viewer (fixed during the production-readiness audit to stop leaking it). */
export interface LessonSummary {
  id: string;
  title: string;
  contentType: 'video' | 'text' | 'quiz';
  durationSeconds: number | null;
  isPreview: boolean;
  position: number;
}

export interface ListCoursesQuery {
  cursor?: string;
  limit?: number;
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  q?: string;
}

// docs/16-API-CONTRACT.md POST /courses, PATCH /courses/:id — verified
// against apps/api/src/modules/courses/dto/{create-course,update-course}.dto.ts.
// `categoryId` is required and must reference an existing `Category` row,
// but NO endpoint anywhere in the real backend lists categories (verified:
// CategoriesModule has no controller at all; the only `/categories`-shaped
// route, `GET /marketplace/categories`, is Marketplace-scoped and out of
// this phase's bounds) — a real, reported gap, not invented around here.
export interface CreateCourseRequest {
  title: string;
  description?: string;
  categoryId: string;
  priceCents?: number;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  categoryId?: string;
  priceCents?: number;
}
