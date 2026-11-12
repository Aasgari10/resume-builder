-- CreateEnum
CREATE TYPE "SiteMessageKind" AS ENUM ('BOOKING', 'CONTACT', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "SiteMessageStatus" AS ENUM ('NEW', 'SEEN', 'CONFIRMED', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "SiteMessage" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "kind" "SiteMessageKind" NOT NULL,
    "status" "SiteMessageStatus" NOT NULL DEFAULT 'NEW',
    "code" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "subject" TEXT,
    "text" TEXT,
    "service" TEXT,
    "date" TEXT,
    "time" TEXT,
    "guests" INTEGER,
    "page" TEXT,
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SiteMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteMessage_code_key" ON "SiteMessage"("code");

-- CreateIndex
CREATE INDEX "SiteMessage_siteId_kind_createdAt_idx" ON "SiteMessage"("siteId", "kind", "createdAt");

-- AddForeignKey
ALTER TABLE "SiteMessage" ADD CONSTRAINT "SiteMessage_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
