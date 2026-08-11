// docs/16-API-CONTRACT.md GET /lessons/:id — full content, entitlement-
// gated. Verified against apps/api/src/modules/lessons/lessons.repository.ts
// `findByIdWithModuleCourse` (`include: { module: { include: { course: true } } }`).
// Only reached (200, non-null `body`) when the backend has already
// resolved entitlement (preview, owner/editorial, or active enrollment);
// otherwise the endpoint itself 401s/403s — there is no "locked" variant
// of this response the way `CourseDetail`'s embedded lessons have,
// because this endpoint doesn't return anything at all if you're not
// entitled to view it.

export interface LessonContentCourse {
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

export interface LessonContentModule {
  id: string;
  courseId: string;
  title: string;
  position: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  course: LessonContentCourse;
}

export interface LessonContent {
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
  module: LessonContentModule;
  /**
   * Phase 28 addition — the id of this lesson's Quiz (contentType `quiz`
   * lessons only; `null` otherwise), so the frontend can call the new
   * `GET /progress/quizzes/:quizId`. Never includes question content —
   * that's a separate, entitlement-gated call.
   */
  quizId: string | null;
}

// docs/16-API-CONTRACT.md POST .../lessons, PATCH /lessons/:id, POST
// .../lessons/reorder — verified against
// apps/api/src/modules/lessons/dto/{create-lesson,update-lesson,reorder-lessons}.dto.ts.
// The plain (non-entitlement-wrapped) Lesson row these three mutations
// return — same shape as `CourseDetail`'s embedded lessons, defined
// separately here since this file is the Lessons-resource's own type
// module and CourseDetail's redaction-aware shape isn't quite the same
// contract (the mutation endpoints always return the real body, never a
// redacted `null`, since only the owning instructor/editorial role can
// reach them).
export interface LessonRecord {
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

export interface CreateLessonRequest {
  title: string;
  contentType: 'video' | 'text' | 'quiz';
  body?: string;
  videoMediaId?: string;
  isPreview?: boolean;
  durationSeconds?: number;
}

export interface UpdateLessonRequest {
  title?: string;
  body?: string;
  videoMediaId?: string;
  isPreview?: boolean;
  durationSeconds?: number;
}

export interface ReorderLessonsRequest {
  lessonIds: string[];
}
