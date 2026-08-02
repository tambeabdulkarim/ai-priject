-- DropForeignKey
ALTER TABLE "courses"."enrollments" DROP CONSTRAINT "enrollments_order_item_id_fkey";

-- AddForeignKey
ALTER TABLE "courses"."enrollments" ADD CONSTRAINT "enrollments_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "marketplace"."order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
