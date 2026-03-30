-- AlterTable
ALTER TABLE "pokemon" ADD COLUMN     "showdownId" TEXT;

-- AlterTable
ALTER TABLE "pokemon_species" ADD COLUMN     "showdownId" TEXT;

-- CreateTable
CREATE TABLE "competitive_format" (
    "id" TEXT NOT NULL,
    "formatKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "mod" TEXT,
    "gameType" TEXT,
    "teamType" TEXT,
    "challengeShow" BOOLEAN NOT NULL DEFAULT true,
    "searchShow" BOOLEAN NOT NULL DEFAULT true,
    "tournamentShow" BOOLEAN NOT NULL DEFAULT true,
    "rated" BOOLEAN NOT NULL DEFAULT true,
    "bestOfDefault" BOOLEAN,
    "ruleset" JSONB,
    "banlist" JSONB,
    "restricted" JSONB,
    "unbanlist" JSONB,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitive_format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_tier" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitive_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_format" (
    "id" TEXT NOT NULL,
    "competitiveFormatId" TEXT NOT NULL,
    "competitiveTierId" TEXT,
    "pokemonId" INTEGER,
    "speciesId" INTEGER,
    "showdownPokemonId" TEXT NOT NULL,
    "isSampleSetAvailable" BOOLEAN NOT NULL DEFAULT false,
    "isUsageTracked" BOOLEAN NOT NULL DEFAULT false,
    "latestUsageMonth" TEXT,
    "latestUsageRating" INTEGER,
    "latestUsagePercent" DOUBLE PRECISION,
    "isNonstandard" TEXT,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pokemon_format_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_tier_history" (
    "id" TEXT NOT NULL,
    "competitiveTierId" TEXT NOT NULL,
    "pokemonId" INTEGER,
    "speciesId" INTEGER,
    "showdownPokemonId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "snapshotKey" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "rawPayload" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pokemon_tier_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_stat_monthly" (
    "id" TEXT NOT NULL,
    "competitiveFormatId" TEXT NOT NULL,
    "pokemonId" INTEGER,
    "speciesId" INTEGER,
    "showdownPokemonId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "metagame" TEXT NOT NULL,
    "cutoffDeviation" INTEGER,
    "teamType" TEXT,
    "totalBattles" INTEGER,
    "rank" INTEGER,
    "usagePercent" DOUBLE PRECISION,
    "rawCount" DOUBLE PRECISION,
    "realCount" DOUBLE PRECISION,
    "weightedCount" DOUBLE PRECISION,
    "viabilityCeiling" JSONB,
    "abilities" JSONB,
    "items" JSONB,
    "moves" JSONB,
    "teraTypes" JSONB,
    "teammates" JSONB,
    "counters" JSONB,
    "spreads" JSONB,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usage_stat_monthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_set" (
    "id" TEXT NOT NULL,
    "competitiveFormatId" TEXT NOT NULL,
    "pokemonId" INTEGER,
    "speciesId" INTEGER,
    "showdownPokemonId" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "abilityName" TEXT,
    "itemName" TEXT,
    "nature" TEXT,
    "teraType" TEXT,
    "level" INTEGER,
    "happiness" INTEGER,
    "shiny" BOOLEAN,
    "gender" TEXT,
    "moves" JSONB NOT NULL,
    "evs" JSONB,
    "ivs" JSONB,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sample_set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banlist_entry" (
    "id" TEXT NOT NULL,
    "competitiveFormatId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banlist_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitive_learnset_entry" (
    "id" TEXT NOT NULL,
    "pokemonId" INTEGER,
    "speciesId" INTEGER,
    "moveId" INTEGER,
    "showdownPokemonId" TEXT NOT NULL,
    "showdownMoveId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "generation" INTEGER,
    "acquisitionMethod" TEXT,
    "levelLearnedAt" INTEGER,
    "eventIndex" INTEGER,
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitive_learnset_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "competitive_format_formatKey_key" ON "competitive_format"("formatKey");

-- CreateIndex
CREATE UNIQUE INDEX "competitive_tier_scope_key_key" ON "competitive_tier"("scope", "key");

-- CreateIndex
CREATE INDEX "pokemon_format_competitiveTierId_idx" ON "pokemon_format"("competitiveTierId");

-- CreateIndex
CREATE INDEX "pokemon_format_pokemonId_idx" ON "pokemon_format"("pokemonId");

-- CreateIndex
CREATE INDEX "pokemon_format_speciesId_idx" ON "pokemon_format"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_format_competitiveFormatId_showdownPokemonId_key" ON "pokemon_format"("competitiveFormatId", "showdownPokemonId");

-- CreateIndex
CREATE INDEX "pokemon_tier_history_competitiveTierId_idx" ON "pokemon_tier_history"("competitiveTierId");

-- CreateIndex
CREATE INDEX "pokemon_tier_history_pokemonId_idx" ON "pokemon_tier_history"("pokemonId");

-- CreateIndex
CREATE INDEX "pokemon_tier_history_speciesId_idx" ON "pokemon_tier_history"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_tier_history_showdownPokemonId_dimension_snapshotKe_key" ON "pokemon_tier_history"("showdownPokemonId", "dimension", "snapshotKey");

-- CreateIndex
CREATE INDEX "usage_stat_monthly_pokemonId_idx" ON "usage_stat_monthly"("pokemonId");

-- CreateIndex
CREATE INDEX "usage_stat_monthly_speciesId_idx" ON "usage_stat_monthly"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "usage_stat_monthly_competitiveFormatId_month_rating_showdow_key" ON "usage_stat_monthly"("competitiveFormatId", "month", "rating", "showdownPokemonId");

-- CreateIndex
CREATE INDEX "sample_set_pokemonId_idx" ON "sample_set"("pokemonId");

-- CreateIndex
CREATE INDEX "sample_set_speciesId_idx" ON "sample_set"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "sample_set_competitiveFormatId_showdownPokemonId_setName_key" ON "sample_set"("competitiveFormatId", "showdownPokemonId", "setName");

-- CreateIndex
CREATE UNIQUE INDEX "banlist_entry_competitiveFormatId_kind_value_key" ON "banlist_entry"("competitiveFormatId", "kind", "value");

-- CreateIndex
CREATE INDEX "competitive_learnset_entry_pokemonId_idx" ON "competitive_learnset_entry"("pokemonId");

-- CreateIndex
CREATE INDEX "competitive_learnset_entry_speciesId_idx" ON "competitive_learnset_entry"("speciesId");

-- CreateIndex
CREATE INDEX "competitive_learnset_entry_moveId_idx" ON "competitive_learnset_entry"("moveId");

-- CreateIndex
CREATE UNIQUE INDEX "competitive_learnset_entry_showdownPokemonId_showdownMoveId_key" ON "competitive_learnset_entry"("showdownPokemonId", "showdownMoveId", "sourceCode");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_showdownId_key" ON "pokemon"("showdownId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_species_showdownId_key" ON "pokemon_species"("showdownId");

-- AddForeignKey
ALTER TABLE "pokemon_format" ADD CONSTRAINT "pokemon_format_competitiveFormatId_fkey" FOREIGN KEY ("competitiveFormatId") REFERENCES "competitive_format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_format" ADD CONSTRAINT "pokemon_format_competitiveTierId_fkey" FOREIGN KEY ("competitiveTierId") REFERENCES "competitive_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_format" ADD CONSTRAINT "pokemon_format_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_format" ADD CONSTRAINT "pokemon_format_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_tier_history" ADD CONSTRAINT "pokemon_tier_history_competitiveTierId_fkey" FOREIGN KEY ("competitiveTierId") REFERENCES "competitive_tier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_tier_history" ADD CONSTRAINT "pokemon_tier_history_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_tier_history" ADD CONSTRAINT "pokemon_tier_history_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_stat_monthly" ADD CONSTRAINT "usage_stat_monthly_competitiveFormatId_fkey" FOREIGN KEY ("competitiveFormatId") REFERENCES "competitive_format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_stat_monthly" ADD CONSTRAINT "usage_stat_monthly_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_stat_monthly" ADD CONSTRAINT "usage_stat_monthly_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_set" ADD CONSTRAINT "sample_set_competitiveFormatId_fkey" FOREIGN KEY ("competitiveFormatId") REFERENCES "competitive_format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_set" ADD CONSTRAINT "sample_set_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_set" ADD CONSTRAINT "sample_set_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banlist_entry" ADD CONSTRAINT "banlist_entry_competitiveFormatId_fkey" FOREIGN KEY ("competitiveFormatId") REFERENCES "competitive_format"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_learnset_entry" ADD CONSTRAINT "competitive_learnset_entry_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_learnset_entry" ADD CONSTRAINT "competitive_learnset_entry_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitive_learnset_entry" ADD CONSTRAINT "competitive_learnset_entry_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "move"("id") ON DELETE SET NULL ON UPDATE CASCADE;
