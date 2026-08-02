-- CreateTable
CREATE TABLE "courses"."lesson_progress" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "progress_percent" INTEGER NOT NULL DEFAULT 0,
    "last_position_seconds" INTEGER,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."quiz_attempts" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "score_percent" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library"."reading_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "library_item_id" UUID NOT NULL,
    "last_position" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."certificates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ,
    "pdf_file_id" UUID,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_progress_lesson_id_idx" ON "courses"."lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_enrollment_id_lesson_id_key" ON "courses"."lesson_progress"("enrollment_id", "lesson_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_quiz_id_idx" ON "courses"."quiz_attempts"("user_id", "quiz_id");

-- CreateIndex
CREATE UNIQUE INDEX "reading_progress_user_id_library_item_id_key" ON "library"."reading_progress"("user_id", "library_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_enrollment_id_key" ON "courses"."certificates"("enrollment_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificate_number_key" ON "courses"."certificates"("certificate_number");

-- AddForeignKey
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "courses"."enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "courses"."lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "courses"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."reading_progress" ADD CONSTRAINT "reading_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."reading_progress" ADD CONSTRAINT "reading_progress_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library"."library_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "courses"."enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."certificates" ADD CONSTRAINT "certificates_pdf_file_id_fkey" FOREIGN KEY ("pdf_file_id") REFERENCES "files"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
