-- CreateTable
CREATE TABLE "generation" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mainRegion" TEXT,

    CONSTRAINT "generation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version_group" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "sortOrder" INTEGER,
    "rawPayload" JSONB,

    CONSTRAINT "version_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "version" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "versionGroupId" INTEGER NOT NULL,

    CONSTRAINT "version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_species" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "evolutionChainId" INTEGER,
    "baseHappiness" INTEGER,
    "captureRate" INTEGER,
    "colorName" TEXT,
    "formsSwitchable" BOOLEAN NOT NULL DEFAULT false,
    "genderRate" INTEGER,
    "growthRateName" TEXT,
    "habitatName" TEXT,
    "hasGenderDifferences" BOOLEAN NOT NULL DEFAULT false,
    "hatchCounter" INTEGER,
    "isBaby" BOOLEAN NOT NULL DEFAULT false,
    "isLegendary" BOOLEAN NOT NULL DEFAULT false,
    "isMythical" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,
    "shapeName" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "pokemon_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "baseExperience" INTEGER,
    "heightDecimetres" INTEGER,
    "weightHectograms" INTEGER,
    "sortOrder" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "officialArtworkUrl" TEXT,
    "spriteUrl" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_form" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "formName" TEXT,
    "formOrder" INTEGER,
    "isBattleOnly" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isMega" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "rawPayload" JSONB,

    CONSTRAINT "pokemon_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "rawPayload" JSONB,

    CONSTRAINT "type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ability" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "isMainSeries" BOOLEAN NOT NULL DEFAULT true,
    "rawPayload" JSONB,

    CONSTRAINT "ability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stat" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "gameIndex" INTEGER,
    "isBattleOnly" BOOLEAN NOT NULL DEFAULT false,
    "moveDamageClass" TEXT,

    CONSTRAINT "stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generationId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "accuracy" INTEGER,
    "effectChance" INTEGER,
    "power" INTEGER,
    "pp" INTEGER,
    "priority" INTEGER,
    "damageClassName" TEXT,
    "targetName" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "move_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "move_learn_method" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER,

    CONSTRAINT "move_learn_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine" (
    "id" INTEGER NOT NULL,
    "moveId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "versionGroupId" INTEGER NOT NULL,
    "rawPayload" JSONB,

    CONSTRAINT "machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_chain" (
    "id" INTEGER NOT NULL,
    "babyTriggerItemId" INTEGER,
    "rawPayload" JSONB,

    CONSTRAINT "evolution_chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_link" (
    "id" SERIAL NOT NULL,
    "evolutionChainId" INTEGER NOT NULL,
    "fromSpeciesId" INTEGER,
    "toSpeciesId" INTEGER NOT NULL,
    "evolutionTriggerName" TEXT,
    "triggerItemId" INTEGER,
    "minimumLevel" INTEGER,
    "gender" INTEGER,
    "heldItemId" INTEGER,
    "knownMoveId" INTEGER,
    "knownMoveTypeId" INTEGER,
    "locationName" TEXT,
    "minimumHappiness" INTEGER,
    "minimumBeauty" INTEGER,
    "minimumAffection" INTEGER,
    "needsOverworldRain" BOOLEAN NOT NULL DEFAULT false,
    "partySpeciesId" INTEGER,
    "partyTypeId" INTEGER,
    "relativePhysicalStats" INTEGER,
    "timeOfDay" TEXT,
    "tradeSpeciesId" INTEGER,
    "turnUpsideDown" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB,

    CONSTRAINT "evolution_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "cost" INTEGER,
    "flingPower" INTEGER,
    "flingEffectName" TEXT,
    "categoryName" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokedex" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isMainSeries" BOOLEAN NOT NULL DEFAULT true,
    "regionName" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "pokedex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokedex_entry" (
    "id" SERIAL NOT NULL,
    "pokedexId" INTEGER NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "entryNumber" INTEGER NOT NULL,

    CONSTRAINT "pokedex_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pokemon_type" (
    "pokemonId" INTEGER NOT NULL,
    "typeId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,

    CONSTRAINT "pokemon_type_pkey" PRIMARY KEY ("pokemonId","slot")
);

-- CreateTable
CREATE TABLE "pokemon_ability" (
    "pokemonId" INTEGER NOT NULL,
    "abilityId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pokemon_ability_pkey" PRIMARY KEY ("pokemonId","slot")
);

-- CreateTable
CREATE TABLE "pokemon_stat_value" (
    "pokemonId" INTEGER NOT NULL,
    "statId" INTEGER NOT NULL,
    "baseStat" INTEGER NOT NULL,
    "effort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pokemon_stat_value_pkey" PRIMARY KEY ("pokemonId","statId")
);

-- CreateTable
CREATE TABLE "pokemon_move_learn" (
    "id" SERIAL NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "moveId" INTEGER NOT NULL,
    "versionGroupId" INTEGER NOT NULL,
    "moveLearnMethodId" INTEGER NOT NULL,
    "levelLearnedAt" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pokemon_move_learn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_team" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "leaderSlot" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_team_pokemon" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "nickname" TEXT,
    "abilityId" INTEGER,
    "itemId" INTEGER,
    "notes" TEXT,
    "moveIds" JSONB,
    "buildData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_team_pokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saved_build" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "formatKey" TEXT,
    "abilityId" INTEGER,
    "itemId" INTEGER,
    "moveIds" JSONB,
    "evSpread" JSONB,
    "ivSpread" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_saved_build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_favorite_pokemon" (
    "userId" TEXT NOT NULL,
    "pokemonId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_favorite_pokemon_pkey" PRIMARY KEY ("userId","pokemonId")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "userId" TEXT NOT NULL,
    "locale" TEXT,
    "defaultPokedexId" INTEGER,
    "preferredVersionGroupId" INTEGER,
    "showShinySprites" BOOLEAN NOT NULL DEFAULT false,
    "data" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "generation_name_key" ON "generation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "version_group_name_key" ON "version_group"("name");

-- CreateIndex
CREATE INDEX "version_group_generationId_idx" ON "version_group"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "version_name_key" ON "version"("name");

-- CreateIndex
CREATE INDEX "version_versionGroupId_idx" ON "version"("versionGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_species_name_key" ON "pokemon_species"("name");

-- CreateIndex
CREATE INDEX "pokemon_species_generationId_idx" ON "pokemon_species"("generationId");

-- CreateIndex
CREATE INDEX "pokemon_species_evolutionChainId_idx" ON "pokemon_species"("evolutionChainId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_name_key" ON "pokemon"("name");

-- CreateIndex
CREATE INDEX "pokemon_speciesId_idx" ON "pokemon"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_form_name_key" ON "pokemon_form"("name");

-- CreateIndex
CREATE INDEX "pokemon_form_pokemonId_idx" ON "pokemon_form"("pokemonId");

-- CreateIndex
CREATE UNIQUE INDEX "type_name_key" ON "type"("name");

-- CreateIndex
CREATE INDEX "type_generationId_idx" ON "type"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "ability_name_key" ON "ability"("name");

-- CreateIndex
CREATE INDEX "ability_generationId_idx" ON "ability"("generationId");

-- CreateIndex
CREATE UNIQUE INDEX "stat_name_key" ON "stat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "move_name_key" ON "move"("name");

-- CreateIndex
CREATE INDEX "move_generationId_idx" ON "move"("generationId");

-- CreateIndex
CREATE INDEX "move_typeId_idx" ON "move"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "move_learn_method_name_key" ON "move_learn_method"("name");

-- CreateIndex
CREATE INDEX "machine_moveId_idx" ON "machine"("moveId");

-- CreateIndex
CREATE INDEX "machine_itemId_idx" ON "machine"("itemId");

-- CreateIndex
CREATE INDEX "machine_versionGroupId_idx" ON "machine"("versionGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "machine_moveId_itemId_versionGroupId_key" ON "machine"("moveId", "itemId", "versionGroupId");

-- CreateIndex
CREATE INDEX "evolution_chain_babyTriggerItemId_idx" ON "evolution_chain"("babyTriggerItemId");

-- CreateIndex
CREATE INDEX "evolution_link_evolutionChainId_idx" ON "evolution_link"("evolutionChainId");

-- CreateIndex
CREATE INDEX "evolution_link_fromSpeciesId_idx" ON "evolution_link"("fromSpeciesId");

-- CreateIndex
CREATE INDEX "evolution_link_toSpeciesId_idx" ON "evolution_link"("toSpeciesId");

-- CreateIndex
CREATE UNIQUE INDEX "item_name_key" ON "item"("name");

-- CreateIndex
CREATE UNIQUE INDEX "pokedex_name_key" ON "pokedex"("name");

-- CreateIndex
CREATE INDEX "pokedex_entry_speciesId_idx" ON "pokedex_entry"("speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "pokedex_entry_pokedexId_speciesId_key" ON "pokedex_entry"("pokedexId", "speciesId");

-- CreateIndex
CREATE UNIQUE INDEX "pokedex_entry_pokedexId_entryNumber_key" ON "pokedex_entry"("pokedexId", "entryNumber");

-- CreateIndex
CREATE INDEX "pokemon_type_typeId_idx" ON "pokemon_type"("typeId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_type_pokemonId_typeId_key" ON "pokemon_type"("pokemonId", "typeId");

-- CreateIndex
CREATE INDEX "pokemon_ability_abilityId_idx" ON "pokemon_ability"("abilityId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_ability_pokemonId_abilityId_key" ON "pokemon_ability"("pokemonId", "abilityId");

-- CreateIndex
CREATE INDEX "pokemon_stat_value_statId_idx" ON "pokemon_stat_value"("statId");

-- CreateIndex
CREATE INDEX "pokemon_move_learn_moveId_idx" ON "pokemon_move_learn"("moveId");

-- CreateIndex
CREATE INDEX "pokemon_move_learn_versionGroupId_idx" ON "pokemon_move_learn"("versionGroupId");

-- CreateIndex
CREATE INDEX "pokemon_move_learn_moveLearnMethodId_idx" ON "pokemon_move_learn"("moveLearnMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "pokemon_move_learn_pokemonId_moveId_versionGroupId_moveLear_key" ON "pokemon_move_learn"("pokemonId", "moveId", "versionGroupId", "moveLearnMethodId", "levelLearnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- CreateIndex
CREATE INDEX "user_team_userId_idx" ON "user_team"("userId");

-- CreateIndex
CREATE INDEX "user_team_pokemon_pokemonId_idx" ON "user_team_pokemon"("pokemonId");

-- CreateIndex
CREATE INDEX "user_team_pokemon_abilityId_idx" ON "user_team_pokemon"("abilityId");

-- CreateIndex
CREATE INDEX "user_team_pokemon_itemId_idx" ON "user_team_pokemon"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "user_team_pokemon_teamId_slot_key" ON "user_team_pokemon"("teamId", "slot");

-- CreateIndex
CREATE INDEX "user_saved_build_userId_idx" ON "user_saved_build"("userId");

-- CreateIndex
CREATE INDEX "user_saved_build_pokemonId_idx" ON "user_saved_build"("pokemonId");

-- CreateIndex
CREATE INDEX "user_favorite_pokemon_pokemonId_idx" ON "user_favorite_pokemon"("pokemonId");

-- CreateIndex
CREATE INDEX "user_preferences_defaultPokedexId_idx" ON "user_preferences"("defaultPokedexId");

-- CreateIndex
CREATE INDEX "user_preferences_preferredVersionGroupId_idx" ON "user_preferences"("preferredVersionGroupId");

-- AddForeignKey
ALTER TABLE "version_group" ADD CONSTRAINT "version_group_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "version" ADD CONSTRAINT "version_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "version_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_species" ADD CONSTRAINT "pokemon_species_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_species" ADD CONSTRAINT "pokemon_species_evolutionChainId_fkey" FOREIGN KEY ("evolutionChainId") REFERENCES "evolution_chain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon" ADD CONSTRAINT "pokemon_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_form" ADD CONSTRAINT "pokemon_form_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "type" ADD CONSTRAINT "type_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ability" ADD CONSTRAINT "ability_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move" ADD CONSTRAINT "move_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "move" ADD CONSTRAINT "move_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine" ADD CONSTRAINT "machine_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine" ADD CONSTRAINT "machine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine" ADD CONSTRAINT "machine_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "version_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_chain" ADD CONSTRAINT "evolution_chain_babyTriggerItemId_fkey" FOREIGN KEY ("babyTriggerItemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_evolutionChainId_fkey" FOREIGN KEY ("evolutionChainId") REFERENCES "evolution_chain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_fromSpeciesId_fkey" FOREIGN KEY ("fromSpeciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_toSpeciesId_fkey" FOREIGN KEY ("toSpeciesId") REFERENCES "pokemon_species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_triggerItemId_fkey" FOREIGN KEY ("triggerItemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_heldItemId_fkey" FOREIGN KEY ("heldItemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_knownMoveId_fkey" FOREIGN KEY ("knownMoveId") REFERENCES "move"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_knownMoveTypeId_fkey" FOREIGN KEY ("knownMoveTypeId") REFERENCES "type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_partySpeciesId_fkey" FOREIGN KEY ("partySpeciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_partyTypeId_fkey" FOREIGN KEY ("partyTypeId") REFERENCES "type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_link" ADD CONSTRAINT "evolution_link_tradeSpeciesId_fkey" FOREIGN KEY ("tradeSpeciesId") REFERENCES "pokemon_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokedex_entry" ADD CONSTRAINT "pokedex_entry_pokedexId_fkey" FOREIGN KEY ("pokedexId") REFERENCES "pokedex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokedex_entry" ADD CONSTRAINT "pokedex_entry_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "pokemon_species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_type" ADD CONSTRAINT "pokemon_type_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_type" ADD CONSTRAINT "pokemon_type_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_ability" ADD CONSTRAINT "pokemon_ability_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_ability" ADD CONSTRAINT "pokemon_ability_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "ability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_stat_value" ADD CONSTRAINT "pokemon_stat_value_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_stat_value" ADD CONSTRAINT "pokemon_stat_value_statId_fkey" FOREIGN KEY ("statId") REFERENCES "stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_move_learn" ADD CONSTRAINT "pokemon_move_learn_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_move_learn" ADD CONSTRAINT "pokemon_move_learn_moveId_fkey" FOREIGN KEY ("moveId") REFERENCES "move"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_move_learn" ADD CONSTRAINT "pokemon_move_learn_versionGroupId_fkey" FOREIGN KEY ("versionGroupId") REFERENCES "version_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pokemon_move_learn" ADD CONSTRAINT "pokemon_move_learn_moveLearnMethodId_fkey" FOREIGN KEY ("moveLearnMethodId") REFERENCES "move_learn_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team" ADD CONSTRAINT "user_team_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team_pokemon" ADD CONSTRAINT "user_team_pokemon_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "user_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team_pokemon" ADD CONSTRAINT "user_team_pokemon_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team_pokemon" ADD CONSTRAINT "user_team_pokemon_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "ability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_team_pokemon" ADD CONSTRAINT "user_team_pokemon_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_build" ADD CONSTRAINT "user_saved_build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_build" ADD CONSTRAINT "user_saved_build_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_build" ADD CONSTRAINT "user_saved_build_abilityId_fkey" FOREIGN KEY ("abilityId") REFERENCES "ability"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saved_build" ADD CONSTRAINT "user_saved_build_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_pokemon" ADD CONSTRAINT "user_favorite_pokemon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_favorite_pokemon" ADD CONSTRAINT "user_favorite_pokemon_pokemonId_fkey" FOREIGN KEY ("pokemonId") REFERENCES "pokemon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_defaultPokedexId_fkey" FOREIGN KEY ("defaultPokedexId") REFERENCES "pokedex"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_preferredVersionGroupId_fkey" FOREIGN KEY ("preferredVersionGroupId") REFERENCES "version_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
