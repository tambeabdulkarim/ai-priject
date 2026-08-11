// docs/16-API-CONTRACT.md §21 (Projects, Phase 26). Verified against
// apps/api/src/modules/projects/{projects.repository.ts,projects.service.ts}.

export interface ProjectSourceLesson {
  id: string;
  title: string;
}

export interface Project {
  id: string;
  courseId: string;
  sourceLessonId: string | null;
  title: string;
  description: string | null;
  /** Populated for standalone projects; null for lesson-linked projects — the brief lives in the linked Lesson's body instead (never duplicated). */
  instructions: string | null;
  status: 'draft' | 'published' | 'archived';
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  sourceLesson: ProjectSourceLesson | null;
}

export interface ProjectEvaluation {
  id: string;
  submissionId: string;
  evaluatorId: string;
  scorePercent: number;
  passed: boolean;
  feedback: string;
  method: 'manual' | 'automated';
  status: 'completed' | 'disputed';
  evaluatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSubmissionProjectRef {
  id: string;
  title: string;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  userId: string;
  content: string | null;
  fileId: string | null;
  attemptNumber: number;
  status: 'submitted' | 'evaluated';
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSubmissionWithEvaluation extends ProjectSubmission {
  evaluation: ProjectEvaluation | null;
  project: ProjectSubmissionProjectRef;
}

export interface SubmitProjectRequest {
  content?: string;
  fileId?: string;
}

export interface EvaluateSubmissionRequest {
  scorePercent: number;
  passed: boolean;
  feedback: string;
}

export interface ListSubmissionsQuery {
  cursor?: string;
  limit?: number;
  projectId?: string;
  status?: string;
}
