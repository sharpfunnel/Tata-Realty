-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "metaCapiError" TEXT,
ADD COLUMN     "metaCapiEventName" TEXT,
ADD COLUMN     "metaCapiSentAt" TIMESTAMP(3),
ADD COLUMN     "metaEventId" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "userAgent" TEXT;
