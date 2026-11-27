-- Site build orders placed from the editor, with a message thread between the customer and the admin.

-- CreateEnum
CREATE TYPE "SiteOrderStatus" AS ENUM ('NEW', 'REVIEWING', 'BUILDING', 'DELIVERED', 'CANCELED');

-- CreateTable
CREATE TABLE "SiteOrder" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resumeId" TEXT,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "business" TEXT,
    "note" TEXT,
    "design" JSONB NOT NULL,
    "status" "SiteOrderStatus" NOT NULL DEFAULT 'NEW',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "unreadByUser" BOOLEAN NOT NULL DEFAULT false,
    "unreadByAdmin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteOrder_code_key" ON "SiteOrder"("code");

-- CreateIndex
CREATE INDEX "SiteOrder_userId_createdAt_idx" ON "SiteOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SiteOrder_status_createdAt_idx" ON "SiteOrder"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SiteOrder" ADD CONSTRAINT "SiteOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteOrder" ADD CONSTRAINT "SiteOrder_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;
