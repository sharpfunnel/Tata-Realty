-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "entryPath" TEXT,
ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "metaAdId" TEXT,
ADD COLUMN     "metaAdsetId" TEXT,
ADD COLUMN     "metaCampaignId" TEXT,
ADD COLUMN     "msclkid" TEXT,
ADD COLUMN     "placement" TEXT,
ADD COLUMN     "rawParams" JSONB,
ADD COLUMN     "referrer" TEXT,
ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT,
ADD COLUMN     "utmTerm" TEXT;

-- CreateIndex
CREATE INDEX "Session_utmSource_utmMedium_utmCampaign_idx" ON "Session"("utmSource", "utmMedium", "utmCampaign");

-- CreateIndex
CREATE INDEX "Session_metaCampaignId_idx" ON "Session"("metaCampaignId");
