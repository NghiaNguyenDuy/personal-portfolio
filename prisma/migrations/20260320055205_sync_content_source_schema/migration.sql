-- AlterTable
ALTER TABLE "_ExternalArticleToNewsSummary" ADD CONSTRAINT "_ExternalArticleToNewsSummary_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ExternalArticleToNewsSummary_AB_unique";

-- AlterTable
ALTER TABLE "_ExternalArticleToTag" ADD CONSTRAINT "_ExternalArticleToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ExternalArticleToTag_AB_unique";
