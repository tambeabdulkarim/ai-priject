-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ai";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "courses";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "files";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "library";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketplace";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "news";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "system";

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ,
    "password_hash" TEXT,
    "display_name" TEXT NOT NULL,
    "avatar_file_id" UUID,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."permissions" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library"."categories" (
    "id" UUID NOT NULL,
    "parent_category_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news"."news_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "news_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library"."authors" (
    "id" UUID NOT NULL,
    "linked_user_id" UUID,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_file_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."ai_providers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."languages" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news"."tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "auth"."users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "auth"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "auth"."permissions"("key");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "library"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_category_id_idx" ON "library"."categories"("parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_categories_slug_key" ON "news"."news_categories"("slug");

-- CreateIndex
CREATE INDEX "authors_linked_user_id_idx" ON "library"."authors"("linked_user_id");

-- CreateIndex
CREATE INDEX "ai_providers_status_idx" ON "ai"."ai_providers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "system"."languages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "news"."tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "news"."tags"("slug");

-- AddForeignKey
ALTER TABLE "library"."categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "library"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."authors" ADD CONSTRAINT "authors_linked_user_id_fkey" FOREIGN KEY ("linked_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
