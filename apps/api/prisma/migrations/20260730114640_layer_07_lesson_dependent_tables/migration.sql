-- CreateTable
CREATE TABLE "courses"."lesson_files" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lesson_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses"."quizzes" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "passing_score_percent" INTEGER NOT NULL,
    "max_attempts" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_files_lesson_id_idx" ON "courses"."lesson_files"("lesson_id");

-- CreateIndex
CREATE INDEX "quizzes_lesson_id_idx" ON "courses"."quizzes"("lesson_id");

-- AddForeignKey
ALTER TABLE "courses"."lesson_files" ADD CONSTRAINT "lesson_files_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "courses"."lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."lesson_files" ADD CONSTRAINT "lesson_files_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."quizzes" ADD CONSTRAINT "quizzes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "courses"."lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
