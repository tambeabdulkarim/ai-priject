-- CreateTable
CREATE TABLE "courses"."quiz_questions" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_questions_quiz_id_position_idx" ON "courses"."quiz_questions"("quiz_id", "position");

-- AddForeignKey
ALTER TABLE "courses"."quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "courses"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
