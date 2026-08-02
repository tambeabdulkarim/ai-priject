-- CreateTable
CREATE TABLE "auth"."audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" UUID,
    "before_state" JSONB,
    "after_state" JSONB,
    "ip_address" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."logs" (
    "id" UUID NOT NULL,
    "level" TEXT NOT NULL,
    "source_service" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system"."backups" (
    "id" UUID NOT NULL,
    "backup_type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "storage_location" TEXT NOT NULL,
    "taken_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMPTZ,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "auth"."audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_type_target_id_idx" ON "auth"."audit_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "audit_logs_occurred_at_idx" ON "auth"."audit_logs"("occurred_at");

-- CreateIndex
CREATE INDEX "logs_occurred_at_idx" ON "system"."logs"("occurred_at");

-- CreateIndex
CREATE INDEX "logs_source_service_idx" ON "system"."logs"("source_service");

-- CreateIndex
CREATE INDEX "backups_taken_at_idx" ON "system"."backups"("taken_at");

-- CreateIndex
CREATE INDEX "backups_verification_status_idx" ON "system"."backups"("verification_status");

-- AddForeignKey
ALTER TABLE "auth"."audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
