-- Trash for the shop panel: a deleted order, customer, comment or ticket is only marked, so it can be restored.
ALTER TABLE "ShopOrder" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ShopCustomer" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ShopReview" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "ShopTicket" ADD COLUMN "deletedAt" TIMESTAMP(3);
