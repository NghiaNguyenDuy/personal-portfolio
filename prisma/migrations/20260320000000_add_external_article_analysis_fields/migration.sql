-- AlterTable
ALTER TABLE "ExternalArticle"
ADD COLUMN "analysisStatus" TEXT,
ADD COLUMN "analysisProvider" TEXT,
ADD COLUMN "analyzedAt" TIMESTAMP(3),
ADD COLUMN "analysisError" TEXT;
