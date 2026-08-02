-- CreateTable
CREATE TABLE "auth"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by_id" UUID,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "auth"."user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_label" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "last_active_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."files" (
    "id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "scan_status" TEXT NOT NULL DEFAULT 'pending',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."ai_models" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "model_identifier" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "cost_per_1k_input_tokens" DECIMAL(10,6) NOT NULL,
    "cost_per_1k_output_tokens" DECIMAL(10,6) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "deprecated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."translations" (
    "id" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "auth"."role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "auth"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "auth"."user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "files_storage_key_key" ON "files"."files"("storage_key");

-- CreateIndex
CREATE INDEX "files_uploaded_by_id_idx" ON "files"."files"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "files_scan_status_idx" ON "files"."files"("scan_status");

-- CreateIndex
CREATE INDEX "ai_models_provider_id_idx" ON "ai"."ai_models"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "translations_language_id_key_key" ON "system"."translations"("language_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "system"."settings"("key");

-- AddForeignKey
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "files"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."authors" ADD CONSTRAINT "authors_avatar_file_id_fkey" FOREIGN KEY ("avatar_file_id") REFERENCES "files"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "auth"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "auth"."permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."role_permissions" ADD CONSTRAINT "role_permissions_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."files" ADD CONSTRAINT "files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_models" ADD CONSTRAINT "ai_models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "ai"."ai_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system"."translations" ADD CONSTRAINT "translations_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "system"."languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system"."settings" ADD CONSTRAINT "settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
