-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "browserVersion" TEXT,
ADD COLUMN     "connection" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "screenHeight" INTEGER,
ADD COLUMN     "screenWidth" INTEGER,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "viewportHeight" INTEGER,
ADD COLUMN     "viewportWidth" INTEGER;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "statusAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CtaEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ctaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "path" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CtaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field" TEXT,
    "path" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouseInteraction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "selector" TEXT,
    "label" TEXT,
    "path" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouseInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "path" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "line" INTEGER,
    "path" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CtaEvent_ctaId_type_idx" ON "CtaEvent"("ctaId", "type");

-- CreateIndex
CREATE INDEX "CtaEvent_sessionId_idx" ON "CtaEvent"("sessionId");

-- CreateIndex
CREATE INDEX "FormEvent_formId_type_idx" ON "FormEvent"("formId", "type");

-- CreateIndex
CREATE INDEX "FormEvent_sessionId_idx" ON "FormEvent"("sessionId");

-- CreateIndex
CREATE INDEX "MouseInteraction_type_idx" ON "MouseInteraction"("type");

-- CreateIndex
CREATE INDEX "MouseInteraction_sessionId_idx" ON "MouseInteraction"("sessionId");

-- CreateIndex
CREATE INDEX "PerformanceMetric_name_rating_idx" ON "PerformanceMetric"("name", "rating");

-- CreateIndex
CREATE INDEX "PerformanceMetric_sessionId_idx" ON "PerformanceMetric"("sessionId");

-- CreateIndex
CREATE INDEX "ErrorEvent_timestamp_idx" ON "ErrorEvent"("timestamp");

-- CreateIndex
CREATE INDEX "ErrorEvent_sessionId_idx" ON "ErrorEvent"("sessionId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- AddForeignKey
ALTER TABLE "CtaEvent" ADD CONSTRAINT "CtaEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormEvent" ADD CONSTRAINT "FormEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouseInteraction" ADD CONSTRAINT "MouseInteraction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMetric" ADD CONSTRAINT "PerformanceMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorEvent" ADD CONSTRAINT "ErrorEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
