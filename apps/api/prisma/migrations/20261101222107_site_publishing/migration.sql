/*
  Warnings:

  - You are about to drop the column `theme` on the `Site` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resumeId]` on the table `Site` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "portfolioTheme" JSONB;

-- AlterTable
ALTER TABLE "Site" DROP COLUMN "theme",
ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publishedData" JSONB,
ADD COLUMN     "publishedTheme" JSONB,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Site_resumeId_key" ON "Site"("resumeId");
