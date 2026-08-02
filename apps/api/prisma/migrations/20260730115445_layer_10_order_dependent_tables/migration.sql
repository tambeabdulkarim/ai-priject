-- CreateTable
CREATE TABLE "marketplace"."order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace"."payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_payment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount_cents" INTEGER NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "marketplace"."order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "marketplace"."order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "marketplace"."payments"("provider_payment_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "marketplace"."payments"("order_id");

-- AddForeignKey
ALTER TABLE "marketplace"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "marketplace"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
