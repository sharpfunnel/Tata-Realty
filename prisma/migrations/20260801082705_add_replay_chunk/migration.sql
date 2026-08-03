-- CreateTable
CREATE TABLE "ReplayChunk" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplayChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReplayChunk_sessionId_idx" ON "ReplayChunk"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReplayChunk_sessionId_seq_key" ON "ReplayChunk"("sessionId", "seq");

-- AddForeignKey
ALTER TABLE "ReplayChunk" ADD CONSTRAINT "ReplayChunk_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
