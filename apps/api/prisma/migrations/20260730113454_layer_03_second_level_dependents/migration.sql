-- CreateTable
CREATE TABLE "auth"."refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "previous_token_id" UUID,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "revoked_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link_url" TEXT,
    "read_at" TIMESTAMPTZ,
    "channel" TEXT NOT NULL,
    "source_event_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."uploads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_id" UUID,
    "presigned_url_issued_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_size_bytes" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."media" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "media_type" TEXT NOT NULL,
    "duration_seconds" INTEGER,
    "transcoding_status" TEXT NOT NULL DEFAULT 'pending',
    "hls_manifest_key" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files"."versions" (
    "id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "previous_file_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "replaced_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replaced_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."prompt_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "system_instructions" TEXT NOT NULL,
    "user_input_schema" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "auth"."refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_session_id_idx" ON "auth"."refresh_tokens"("session_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "auth"."refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "auth"."notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "auth"."notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "uploads_file_id_key" ON "files"."uploads"("file_id");

-- CreateIndex
CREATE INDEX "uploads_user_id_idx" ON "files"."uploads"("user_id");

-- CreateIndex
CREATE INDEX "uploads_status_idx" ON "files"."uploads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "media_file_id_key" ON "files"."media"("file_id");

-- CreateIndex
CREATE INDEX "media_transcoding_status_idx" ON "files"."media"("transcoding_status");

-- CreateIndex
CREATE INDEX "versions_file_id_idx" ON "files"."versions"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_name_version_key" ON "ai"."prompt_templates"("name", "version");

-- AddForeignKey
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."user_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_previous_token_id_fkey" FOREIGN KEY ("previous_token_id") REFERENCES "auth"."refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."uploads" ADD CONSTRAINT "uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."uploads" ADD CONSTRAINT "uploads_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."media" ADD CONSTRAINT "media_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."versions" ADD CONSTRAINT "versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "files"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."versions" ADD CONSTRAINT "versions_previous_file_id_fkey" FOREIGN KEY ("previous_file_id") REFERENCES "files"."files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files"."versions" ADD CONSTRAINT "versions_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
