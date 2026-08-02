/*
  Warnings:

  - You are about to drop the column `purchase_id` on the `enrollments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses"."enrollments" DROP COLUMN "purchase_id",
ADD COLUMN     "order_item_id" UUID;

-- AddForeignKey
ALTER TABLE "courses"."enrollments" ADD CONSTRAINT "enrollments_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "marketplace"."order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
