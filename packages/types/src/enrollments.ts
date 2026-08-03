// docs/16-API-CONTRACT.md §6 (Enrollments). Verified against
// apps/api/src/modules/enrollments/enrollments.repository.ts.

import type { CourseSummary } from './courses';

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  orderItemId: string | null;
  enrolledAt: string;
  completedAt: string | null;
  completionPercent: number;
  status: 'active' | 'expired' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

/** GET /enrollments/me's real per-item shape — the enrollment joined with its full Course row (gives `course.slug`, needed to link into the course/learning pages). */
export interface EnrollmentWithCourse extends Enrollment {
  course: CourseSummary;
}

export interface ListEnrollmentsQuery {
  cursor?: string;
  limit?: number;
  status?: 'active' | 'expired' | 'refunded';
}
