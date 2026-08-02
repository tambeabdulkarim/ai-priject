-- CreateTable
CREATE TABLE "courses"."enrollments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "purchase_id" UUID,
    "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "completion_percent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "coupon_id" UUID,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library"."downloads" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "library_item_id" UUID NOT NULL,
    "downloaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,

    CONSTRAINT "downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library"."bookmarks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "library_item_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."coupons" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "max_redemptions" INTEGER,
    "redeemed_count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."ai_usage" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "requests_used" INTEGER NOT NULL DEFAULT 0,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "quota_limit" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."ai_costs" (
    "id" UUID NOT NULL,
    "ai_request_id" UUID NOT NULL,
    "provider_cost_usd" DECIMAL(10,6) NOT NULL,
    "billed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "courses"."enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "courses"."enrollments"("user_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "marketplace"."orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "marketplace"."orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "marketplace"."orders"("status");

-- CreateIndex
CREATE INDEX "downloads_user_id_library_item_id_idx" ON "library"."downloads"("user_id", "library_item_id");

-- CreateIndex
CREATE INDEX "downloads_downloaded_at_idx" ON "library"."downloads"("downloaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_library_item_id_key" ON "library"."bookmarks"("user_id", "library_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "marketplace"."coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_expires_at_idx" ON "marketplace"."coupons"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "ai_usage_user_id_period_start_key" ON "ai"."ai_usage"("user_id", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "ai_costs_ai_request_id_key" ON "ai"."ai_costs"("ai_request_id");

-- CreateIndex
CREATE INDEX "ai_costs_billed_at_idx" ON "ai"."ai_costs"("billed_at");

-- AddForeignKey
ALTER TABLE "courses"."enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses"."enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "marketplace"."coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."downloads" ADD CONSTRAINT "downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."downloads" ADD CONSTRAINT "downloads_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library"."library_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library"."bookmarks" ADD CONSTRAINT "bookmarks_library_item_id_fkey" FOREIGN KEY ("library_item_id") REFERENCES "library"."library_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_usage" ADD CONSTRAINT "ai_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai"."ai_costs" ADD CONSTRAINT "ai_costs_ai_request_id_fkey" FOREIGN KEY ("ai_request_id") REFERENCES "ai"."ai_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
