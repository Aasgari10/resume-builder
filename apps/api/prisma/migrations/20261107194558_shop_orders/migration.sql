-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'SENT', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "ShopOrder" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'NEW',
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT,
    "note" TEXT,
    "items" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "shipping" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopOrder_code_key" ON "ShopOrder"("code");

-- CreateIndex
CREATE INDEX "ShopOrder_siteId_createdAt_idx" ON "ShopOrder"("siteId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
