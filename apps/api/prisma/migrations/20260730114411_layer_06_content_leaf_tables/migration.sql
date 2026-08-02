-- CreateTable
CREATE TABLE "courses"."lessons" (
    "id" UUID NOT NULL,
    "module_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "content_type" TEXT NOT NULL,
    "body" TEXT,
    "video_media_id" UUID,
    "duration_seconds" INTEGER,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news"."comments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "news_id" UUID NOT NULL,
    "parent_comment_id" UUID,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lessons_module_id_position_idx" ON "courses"."lessons"("module_id", "position");

-- CreateIndex
CREATE INDEX "comments_news_id_idx" ON "news"."comments"("news_id");

-- CreateIndex
CREATE INDEX "comments_parent_comment_id_idx" ON "news"."comments"("parent_comment_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "news"."comments"("user_id");

-- AddForeignKey
ALTER TABLE "courses"."lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "courses"."modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."lessons" ADD CONSTRAINT "lessons_video_media_id_fkey" FOREIGN KEY ("video_media_id") REFERENCES "files"."media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."comments" ADD CONSTRAINT "comments_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"."news"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "news"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
