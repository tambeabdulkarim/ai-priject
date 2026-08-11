// docs/16-API-CONTRACT.md PUT /learning-paths/:id/courses — array order
// becomes `position`; duplicate IDs rejected here (400) as a fast,
// client-facing check, with the database's own unique constraint
// (LearningPathCourse @@unique([learningPathId, courseId])) as the actual
// last-line guard.

import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetLearningPathCoursesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  courseIds!: string[];
}
