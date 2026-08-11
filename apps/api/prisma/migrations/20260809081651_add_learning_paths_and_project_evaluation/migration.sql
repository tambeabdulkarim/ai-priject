-- CreateTable
CREATE TABLE "courses"."learning_paths" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."learning_path_courses" (
    "id" UUID NOT NULL,
    "learning_path_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_path_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."projects" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "source_lesson_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."project_submissions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT,
    "file_id" UUID,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."project_evaluations" (
    "id" UUID NOT NULL,
    "submission_id" UUID NOT NULL,
    "evaluator_id" UUID NOT NULL,
    "score_percent" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "feedback" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "evaluated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_paths_slug_key" ON "courses"."learning_paths"("slug");

-- CreateIndex
CREATE INDEX "learning_paths_status_idx" ON "courses"."learning_paths"("status");

-- CreateIndex
CREATE INDEX "learning_path_courses_learning_path_id_position_idx" ON "courses"."learning_path_courses"("learning_path_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "learning_path_courses_learning_path_id_course_id_key" ON "courses"."learning_path_courses"("learning_path_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_source_lesson_id_key" ON "courses"."projects"("source_lesson_id");

-- CreateIndex
CREATE INDEX "projects_course_id_position_idx" ON "courses"."projects"("course_id", "position");

-- CreateIndex
CREATE INDEX "project_submissions_project_id_idx" ON "courses"."project_submissions"("project_id");

-- CreateIndex
CREATE INDEX "project_submissions_user_id_idx" ON "courses"."project_submissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_submissions_project_id_user_id_attempt_number_key" ON "courses"."project_submissions"("project_id", "user_id", "attempt_number");

-- CreateIndex
CREATE UNIQUE INDEX "project_evaluations_submission_id_key" ON "courses"."project_evaluations"("submission_id");

-- AddForeignKey
ALTER TABLE "courses"."learning_path_courses" ADD CONSTRAINT "learning_path_courses_learning_path_id_fkey" FOREIGN KEY ("learning_path_id") REFERENCES "courses"."learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."learning_path_courses" ADD CONSTRAINT "learning_path_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."projects" ADD CONSTRAINT "projects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."projects" ADD CONSTRAINT "projects_source_lesson_id_fkey" FOREIGN KEY ("source_lesson_id") REFERENCES "courses"."lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."project_submissions" ADD CONSTRAINT "project_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "courses"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."project_submissions" ADD CONSTRAINT "project_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."project_submissions" ADD CONSTRAINT "project_submissions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."project_evaluations" ADD CONSTRAINT "project_evaluations_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "courses"."project_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."project_evaluations" ADD CONSTRAINT "project_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
