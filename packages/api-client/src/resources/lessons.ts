import type {
  CreateLessonRequest,
  CreateModuleRequest,
  LessonContent,
  LessonRecord,
  ModuleRecord,
  ReorderLessonsRequest,
  UpdateLessonRequest,
} from '@phoenix/types';
import type { RequestFn } from '../core/request';

/**
 * docs/16-API-CONTRACT.md §5 (Lessons) — GET /lessons/:id is the only
 * documented endpoint here; module create/update, lesson create/update/
 * reorder are all real and verified against
 * apps/api/src/modules/lessons/lessons.controller.ts, but module
 * create/update is NOT documented anywhere in docs/16 (see
 * packages/types/src/modules.ts's header comment) — used because it's
 * real and required for Module/Lesson Management, flagged as a
 * documentation gap in this phase's report, not invented.
 *
 * There is no module-reorder endpoint (verified: none exists in the real
 * backend) — only lesson reorder is offered here, matching reality.
 */
export function createLessonsResource(request: RequestFn) {
  return {
    getContent: (id: string) => request<LessonContent>({ method: 'GET', path: `/lessons/${id}` }),

    createModule: (courseId: string, body: CreateModuleRequest) =>
      request<ModuleRecord>({ method: 'POST', path: `/courses/${courseId}/modules`, body }),

    updateModule: (courseId: string, moduleId: string, body: CreateModuleRequest) =>
      request<ModuleRecord>({ method: 'PATCH', path: `/courses/${courseId}/modules/${moduleId}`, body }),

    createLesson: (courseId: string, moduleId: string, body: CreateLessonRequest) =>
      request<LessonRecord>({ method: 'POST', path: `/courses/${courseId}/modules/${moduleId}/lessons`, body }),

    updateLesson: (id: string, body: UpdateLessonRequest) =>
      request<LessonRecord>({ method: 'PATCH', path: `/lessons/${id}`, body }),

    reorderLessons: (courseId: string, moduleId: string, body: ReorderLessonsRequest) =>
      request<LessonRecord[]>({
        method: 'POST',
        path: `/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
        body,
      }),
  };
}

export type LessonsResource = ReturnType<typeof createLessonsResource>;
