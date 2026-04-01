-- CreateTable
CREATE TABLE "ingest_source_checkpoint" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "description" TEXT,
    "cadence" TEXT,
    "lastObservedVersion" TEXT,
    "lastObservedAt" TIMESTAMP(3),
    "lastAppliedVersion" TEXT,
    "lastAppliedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingest_source_checkpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ingest_source_checkpoint_sourceKey_key" ON "ingest_source_checkpoint"("sourceKey");
