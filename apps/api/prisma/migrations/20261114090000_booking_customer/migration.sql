-- A booking or message can belong to the site's signed-in customer ("my bookings").
ALTER TABLE "SiteMessage" ADD COLUMN "customerId" TEXT;
CREATE INDEX "SiteMessage_customerId_idx" ON "SiteMessage"("customerId");
ALTER TABLE "SiteMessage" ADD CONSTRAINT "SiteMessage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ShopCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
