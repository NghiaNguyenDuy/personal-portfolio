-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('RSS', 'ATOM', 'BLOG_INDEX', 'MANUAL');

-- AlterTable
ALTER TABLE "ExternalArticle"
ADD COLUMN "sourceId" TEXT,
ADD COLUMN "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "isSummaryCandidate" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "NewsSummary"
ADD COLUMN "articleCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "feedUrl" TEXT,
    "sourceType" "SourceType" NOT NULL DEFAULT 'BLOG_INDEX',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultTopicId" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "lastImportedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ExternalArticleToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ExternalArticleToNewsSummary" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_slug_key" ON "ContentSource"("slug");
CREATE UNIQUE INDEX "ContentSource_sourceUrl_key" ON "ContentSource"("sourceUrl");
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");
CREATE UNIQUE INDEX "_ExternalArticleToTag_AB_unique" ON "_ExternalArticleToTag"("A", "B");
CREATE INDEX "_ExternalArticleToTag_B_index" ON "_ExternalArticleToTag"("B");
CREATE UNIQUE INDEX "_ExternalArticleToNewsSummary_AB_unique" ON "_ExternalArticleToNewsSummary"("A", "B");
CREATE INDEX "_ExternalArticleToNewsSummary_B_index" ON "_ExternalArticleToNewsSummary"("B");

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_defaultTopicId_fkey" FOREIGN KEY ("defaultTopicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalArticle" ADD CONSTRAINT "ExternalArticle_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_ExternalArticleToTag" ADD CONSTRAINT "_ExternalArticleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ExternalArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ExternalArticleToTag" ADD CONSTRAINT "_ExternalArticleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ExternalArticleToNewsSummary" ADD CONSTRAINT "_ExternalArticleToNewsSummary_A_fkey" FOREIGN KEY ("A") REFERENCES "ExternalArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ExternalArticleToNewsSummary" ADD CONSTRAINT "_ExternalArticleToNewsSummary_B_fkey" FOREIGN KEY ("B") REFERENCES "NewsSummary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
