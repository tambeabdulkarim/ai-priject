-- CreateTable
CREATE TABLE "courses"."modules" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news"."news_tag_assignments" (
    "news_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_tag_assignments_pkey" PRIMARY KEY ("news_id","tag_id")
);

-- CreateIndex
CREATE INDEX "modules_course_id_position_idx" ON "courses"."modules"("course_id", "position");

-- CreateIndex
CREATE INDEX "news_tag_assignments_tag_id_idx" ON "news"."news_tag_assignments"("tag_id");

-- AddForeignKey
ALTER TABLE "courses"."modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."news_tag_assignments" ADD CONSTRAINT "news_tag_assignments_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"."news"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."news_tag_assignments" ADD CONSTRAINT "news_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "news"."tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
