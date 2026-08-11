// docs/16-API-CONTRACT.md §20 (Learning Paths, Phase 26). Verified against
// apps/api/src/modules/learning-paths/learning-paths.repository.ts.

import type { CourseSummary } from './courses';

export interface LearningPathSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  _count: { courses: number };
}

export interface LearningPathCourseEntry {
  id: string;
  learningPathId: string;
  courseId: string;
  position: number;
  createdAt: string;
  course: CourseSummary;
}

export interface LearningPathDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  courses: LearningPathCourseEntry[];
}

export interface ListLearningPathsQuery {
  cursor?: string;
  limit?: number;
}
