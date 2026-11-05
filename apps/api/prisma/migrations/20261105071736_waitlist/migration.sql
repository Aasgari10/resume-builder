-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_product_createdAt_idx" ON "WaitlistEntry"("product", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_product_phone_key" ON "WaitlistEntry"("product", "phone");
