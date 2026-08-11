-- CreateIndex
CREATE INDEX "courses_category_id_idx" ON "courses"."courses"("category_id");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "marketplace"."orders"("created_at");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "marketplace"."products"("category_id");
