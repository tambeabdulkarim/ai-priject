-- CreateTable
CREATE TABLE "marketplace"."transactions" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "provider_reference" TEXT,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_payment_id_idx" ON "marketplace"."transactions"("payment_id");

-- CreateIndex
CREATE INDEX "transactions_recorded_at_idx" ON "marketplace"."transactions"("recorded_at");

-- AddForeignKey
ALTER TABLE "marketplace"."transactions" ADD CONSTRAINT "transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "marketplace"."payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
