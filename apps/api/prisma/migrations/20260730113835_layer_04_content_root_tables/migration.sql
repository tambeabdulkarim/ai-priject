-- CreateTable
CREATE TABLE "courses"."courses" (
    "id" UUID NOT NULL,
    "instructor_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library"."library_items" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "price_cents" INTEGER,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "library_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."products" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "owner_id" UUID,
    "file_id" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news"."news" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."ai_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "model_id" UUID NOT NULL,
    "prompt_template_id" UUID,
    "feature" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "latency_ms" INTEGER,
    "prompt_redacted" TEXT,
    "response_redacted" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"."courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"."courses"("status");

-- CreateIndex
CREATE INDEX "courses_instructor_id_idx" ON "courses"."courses"("instructor_id");

-- CreateIndex
CREATE UNIQUE INDEX "library_items_slug_key" ON "library"."library_items"("slug");

-- CreateIndex
CREATE INDEX "library_items_status_idx" ON "library"."library_items"("status");

-- CreateIndex
CREATE INDEX "library_items_category_id_idx" ON "library"."library_items"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "marketplace"."products"("slug");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "marketplace"."products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"."news"("slug");

-- CreateIndex
CREATE INDEX "news_status_idx" ON "news"."news"("status");

-- CreateIndex
CREATE INDEX "news_published_at_idx" ON "news"."news"("published_at");

-- CreateIndex
CREATE INDEX "ai_requests_user_id_idx" ON "ai"."ai_requests"("user_id");

-- CreateIndex
CREATE INDEX "ai_requests_feature_idx" ON "ai"."ai_requests"("feature");

-- CreateIndex
CREATE INDEX "ai_requests_created_at_idx" ON "ai"."ai_requests"("created_at");

-- AddForeignKey
ALTER TABLE "courses"."courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "library"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."library_items" ADD CONSTRAINT "library_items_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "library"."authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."library_items" ADD CONSTRAINT "library_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "library"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."library_items" ADD CONSTRAINT "library_items_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "library"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."products" ADD CONSTRAINT "products_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."products" ADD CONSTRAINT "products_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."news" ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news"."news" ADD CONSTRAINT "news_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "news"."news_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_requests" ADD CONSTRAINT "ai_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_requests" ADD CONSTRAINT "ai_requests_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai"."ai_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_requests" ADD CONSTRAINT "ai_requests_prompt_template_id_fkey" FOREIGN KEY ("prompt_template_id") REFERENCES "ai"."prompt_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
