-- CreateTable
CREATE TABLE "TemplateComment" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TemplateComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateCommentVote" (
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "TemplateCommentVote_pkey" PRIMARY KEY ("commentId","userId")
);

-- CreateIndex
CREATE INDEX "TemplateComment_templateId_createdAt_idx" ON "TemplateComment"("templateId", "createdAt");

-- CreateIndex
CREATE INDEX "TemplateComment_reply_createdAt_idx" ON "TemplateComment"("reply", "createdAt");

-- AddForeignKey
ALTER TABLE "TemplateComment" ADD CONSTRAINT "TemplateComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCommentVote" ADD CONSTRAINT "TemplateCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TemplateComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCommentVote" ADD CONSTRAINT "TemplateCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
