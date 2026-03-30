DROP VIEW IF EXISTS pokemon_competitive_overview_view;
DROP VIEW IF EXISTS pokemon_pokedex_entry_view;
DROP VIEW IF EXISTS pokemon_move_learn_view;
DROP VIEW IF EXISTS pokemon_summary_view;

CREATE VIEW pokemon_summary_view AS
SELECT
  p."id" AS pokemon_id,
  p."name" AS pokemon_slug,
  ps."id" AS species_id,
  ps."name" AS species_slug,
  COALESCE(p."showdownId", ps."showdownId") AS showdown_id,
  g."id" AS generation_id,
  g."name" AS generation_name,
  p."isDefault" AS is_default,
  ps."isLegendary" AS is_legendary,
  ps."isMythical" AS is_mythical,
  type_data.primary_type,
  type_data.secondary_type,
  ability_data.primary_ability,
  stat_data.hp,
  stat_data.attack,
  stat_data.defense,
  stat_data.special_attack,
  stat_data.special_defense,
  stat_data.speed,
  stat_data.base_stat_total,
  CASE
    WHEN p."heightDecimetres" IS NOT NULL THEN ROUND((p."heightDecimetres"::numeric / 10), 1)
    ELSE NULL
  END AS height_m,
  CASE
    WHEN p."weightHectograms" IS NOT NULL THEN ROUND((p."weightHectograms"::numeric / 10), 1)
    ELSE NULL
  END AS weight_kg,
  p."baseExperience" AS base_experience,
  p."officialArtworkUrl" AS official_artwork_url,
  p."spriteUrl" AS sprite_url
FROM "pokemon" p
JOIN "pokemon_species" ps
  ON ps."id" = p."speciesId"
JOIN "generation" g
  ON g."id" = ps."generationId"
LEFT JOIN LATERAL (
  SELECT
    MAX(CASE WHEN pt."slot" = 1 THEN t."name" END) AS primary_type,
    MAX(CASE WHEN pt."slot" = 2 THEN t."name" END) AS secondary_type
  FROM "pokemon_type" pt
  JOIN "type" t
    ON t."id" = pt."typeId"
  WHERE pt."pokemonId" = p."id"
) AS type_data
  ON TRUE
LEFT JOIN LATERAL (
  SELECT
    COALESCE(
      MAX(CASE WHEN pa."slot" = 1 AND pa."isHidden" = FALSE THEN a."name" END),
      MAX(CASE WHEN pa."slot" = 1 THEN a."name" END),
      MAX(CASE WHEN pa."isHidden" = FALSE THEN a."name" END),
      MAX(a."name")
    ) AS primary_ability
  FROM "pokemon_ability" pa
  JOIN "ability" a
    ON a."id" = pa."abilityId"
  WHERE pa."pokemonId" = p."id"
) AS ability_data
  ON TRUE
LEFT JOIN LATERAL (
  SELECT
    MAX(CASE WHEN s."name" = 'hp' THEN psv."baseStat" END) AS hp,
    MAX(CASE WHEN s."name" = 'attack' THEN psv."baseStat" END) AS attack,
    MAX(CASE WHEN s."name" = 'defense' THEN psv."baseStat" END) AS defense,
    MAX(CASE WHEN s."name" = 'special-attack' THEN psv."baseStat" END) AS special_attack,
    MAX(CASE WHEN s."name" = 'special-defense' THEN psv."baseStat" END) AS special_defense,
    MAX(CASE WHEN s."name" = 'speed' THEN psv."baseStat" END) AS speed,
    COALESCE(SUM(psv."baseStat"), 0)::integer AS base_stat_total
  FROM "pokemon_stat_value" psv
  JOIN "stat" s
    ON s."id" = psv."statId"
  WHERE psv."pokemonId" = p."id"
) AS stat_data
  ON TRUE;

COMMENT ON VIEW pokemon_summary_view IS
  'Readable one-row-per-pokemon summary without raw payloads or bridge-table noise.';

CREATE VIEW pokemon_move_learn_view AS
SELECT
  pml."id" AS pokemon_move_learn_id,
  p."id" AS pokemon_id,
  p."name" AS pokemon_slug,
  ps."id" AS species_id,
  ps."name" AS species_slug,
  m."id" AS move_id,
  m."name" AS move_slug,
  t."name" AS move_type,
  vg."id" AS version_group_id,
  vg."name" AS version_group,
  mlm."id" AS move_learn_method_id,
  mlm."name" AS move_learn_method,
  pml."levelLearnedAt" AS level_learned_at,
  pml."sortOrder" AS sort_order
FROM "pokemon_move_learn" pml
JOIN "pokemon" p
  ON p."id" = pml."pokemonId"
JOIN "pokemon_species" ps
  ON ps."id" = p."speciesId"
JOIN "move" m
  ON m."id" = pml."moveId"
JOIN "type" t
  ON t."id" = m."typeId"
JOIN "version_group" vg
  ON vg."id" = pml."versionGroupId"
JOIN "move_learn_method" mlm
  ON mlm."id" = pml."moveLearnMethodId";

COMMENT ON VIEW pokemon_move_learn_view IS
  'Readable learnset rows with pokemon, move, method and version-group names already joined.';

CREATE VIEW pokemon_pokedex_entry_view AS
SELECT
  pe."id" AS pokedex_entry_id,
  pd."id" AS pokedex_id,
  pd."name" AS pokedex_slug,
  pd."isMainSeries" AS is_main_series,
  pd."regionName" AS region_name,
  pe."entryNumber" AS entry_number,
  ps."id" AS species_id,
  ps."name" AS species_slug,
  default_pokemon."id" AS default_pokemon_id,
  default_pokemon."name" AS default_pokemon_slug,
  summary.primary_type,
  summary.secondary_type,
  summary.official_artwork_url
FROM "pokedex_entry" pe
JOIN "pokedex" pd
  ON pd."id" = pe."pokedexId"
JOIN "pokemon_species" ps
  ON ps."id" = pe."speciesId"
LEFT JOIN "pokemon" default_pokemon
  ON default_pokemon."speciesId" = ps."id"
 AND default_pokemon."isDefault" = TRUE
LEFT JOIN pokemon_summary_view summary
  ON summary.pokemon_id = default_pokemon."id";

COMMENT ON VIEW pokemon_pokedex_entry_view IS
  'Pokedex entries enriched with default pokemon identity, types and artwork.';

CREATE VIEW pokemon_competitive_overview_view AS
SELECT
  pf."id" AS pokemon_format_id,
  cf."formatKey" AS format_key,
  cf."name" AS format_name,
  ct."scope" AS tier_scope,
  ct."key" AS tier_key,
  ct."name" AS tier_name,
  pf."showdownPokemonId" AS showdown_pokemon_id,
  COALESCE(p."id", default_pokemon."id") AS pokemon_id,
  COALESCE(p."name", default_pokemon."name") AS pokemon_slug,
  ps."id" AS species_id,
  ps."name" AS species_slug,
  summary.primary_type,
  summary.secondary_type,
  pf."isSampleSetAvailable" AS is_sample_set_available,
  COALESCE(sample_data.sample_set_count, 0) AS sample_set_count,
  pf."isUsageTracked" AS is_usage_tracked,
  pf."latestUsageMonth" AS latest_usage_month,
  pf."latestUsageRating" AS latest_usage_rating,
  pf."latestUsagePercent" AS latest_usage_percent,
  pf."isNonstandard" AS is_nonstandard
FROM "pokemon_format" pf
JOIN "competitive_format" cf
  ON cf."id" = pf."competitiveFormatId"
LEFT JOIN "competitive_tier" ct
  ON ct."id" = pf."competitiveTierId"
LEFT JOIN "pokemon" p
  ON p."id" = pf."pokemonId"
LEFT JOIN "pokemon_species" ps
  ON ps."id" = COALESCE(pf."speciesId", p."speciesId")
LEFT JOIN "pokemon" default_pokemon
  ON default_pokemon."speciesId" = ps."id"
 AND default_pokemon."isDefault" = TRUE
LEFT JOIN pokemon_summary_view summary
  ON summary.pokemon_id = COALESCE(p."id", default_pokemon."id")
LEFT JOIN LATERAL (
  SELECT COUNT(*)::integer AS sample_set_count
  FROM "sample_set" ss
  WHERE ss."competitiveFormatId" = pf."competitiveFormatId"
    AND ss."showdownPokemonId" = pf."showdownPokemonId"
) AS sample_data
  ON TRUE;

COMMENT ON VIEW pokemon_competitive_overview_view IS
  'Competitive read model with format, tier, latest usage snapshot and sample-set availability.';
