# Base de datos

## Objetivo del modelo

La base se ha disenado para separar tres dominios:

- estructura principal de Pokemon
- capa competitiva
- capa futura de usuarios y autenticacion

La fuente estructural principal es PokeAPI. La fuente competitiva es Pokemon Showdown y Smogon.

## Nombres a distinguir

Hay dos conceptos distintos:

- nombre visible del recurso cloud: por ejemplo `pokemon-project-dev-db` o `pokemon-project-prod-db`
- nombre logico de la base PostgreSQL: en Neon free actualmente es `neondb`

En local, la base es `pokemon_project`.

## Vista general por dominios

Este diagrama prioriza legibilidad. No intenta mostrar cada cardinalidad exacta; su objetivo es que se vea rapido como esta organizada la base.

![Vista general de la base de datos](./diagrams/database-overview.svg)

```mermaid
flowchart LR
  subgraph Structural["Dominio estructural"]
    generation["generation"]
    species["pokemon_species"]
    pokemon["pokemon"]
    form["pokemon_form"]
    move["move"]
    item["item"]
    pokedex["pokedex"]
  end

  subgraph Bridges["Tablas puente y soporte"]
    pokemonType["pokemon_type"]
    pokemonAbility["pokemon_ability"]
    pokemonStat["pokemon_stat_value"]
    pokemonMove["pokemon_move_learn"]
    evolution["evolution_chain + evolution_link"]
    machine["machine"]
    pokedexEntry["pokedex_entry"]
  end

  subgraph Competitive["Capa competitiva"]
    competitiveFormat["competitive_format"]
    competitiveTier["competitive_tier"]
    pokemonFormat["pokemon_format"]
    learnset["competitive_learnset_entry"]
    sampleSet["sample_set"]
    usage["usage_stat_monthly"]
  end

  subgraph User["Auth y negocio de usuario"]
    user["user"]
    auth["account / session / verification_token"]
    teams["user_team + user_team_pokemon"]
    builds["user_saved_build"]
    favorites["user_favorite_pokemon"]
    preferences["user_preferences"]
  end

  generation --> species --> pokemon --> form
  pokemon --> pokemonType
  pokemon --> pokemonAbility
  pokemon --> pokemonStat
  pokemon --> pokemonMove
  move --> pokemonMove
  item --> machine
  species --> evolution
  pokedex --> pokedexEntry --> species

  pokemon --> pokemonFormat
  species --> pokemonFormat
  competitiveFormat --> pokemonFormat
  competitiveTier --> pokemonFormat
  move --> learnset
  pokemon --> learnset
  species --> learnset
  competitiveFormat --> sampleSet
  pokemon --> sampleSet
  competitiveFormat --> usage
  pokemon --> usage

  user --> auth
  user --> teams
  user --> builds
  user --> favorites
  user --> preferences
  pokemon --> teams
  pokemon --> builds
  pokemon --> favorites
```

## Dominio principal Pokemon

Tablas principales:

- `generation`
- `version_group`
- `version`
- `pokemon_species`
- `pokemon`
- `pokemon_form`
- `type`
- `ability`
- `stat`
- `move`
- `move_learn_method`
- `machine`
- `evolution_chain`
- `evolution_link`
- `item`
- `pokedex`
- `pokedex_entry`

Tablas puente:

- `pokemon_type`
- `pokemon_ability`
- `pokemon_stat_value`
- `pokemon_move_learn`

Tablas con `rawPayload` relevante:

- `pokemon`
- `pokemon_species`
- `move`
- `ability`
- `item`
- `evolution_chain`
- `version_group`
- `pokedex`

## Mapa del dominio principal

![Diagrama del dominio principal](./diagrams/database-core.svg)

```mermaid
flowchart LR
  subgraph Reference["Catalogo base"]
    direction TB
    generation["generation"]
    versionGroup["version_group"]
    version["version"]
    type["type"]
    ability["ability"]
    stat["stat"]
    move["move"]
    moveLearnMethod["move_learn_method"]
    item["item"]
  end

  subgraph PokemonModel["Modelo Pokemon"]
    direction TB
    species["pokemon_species"]
    pokemon["pokemon"]
    form["pokemon_form"]
    pokemonType["pokemon_type"]
    pokemonAbility["pokemon_ability"]
    pokemonStat["pokemon_stat_value"]
    pokemonMove["pokemon_move_learn"]
  end

  subgraph Support["Evolucion y Pokedex"]
    direction TB
    evolutionChain["evolution_chain"]
    evolutionLink["evolution_link"]
    machine["machine"]
    pokedex["pokedex"]
    pokedexEntry["pokedex_entry"]
  end

  generation --> versionGroup --> version
  generation --> species --> pokemon --> form
  generation --> type
  generation --> ability
  generation --> move
  type --> move

  pokemon --> pokemonType --> type
  pokemon --> pokemonAbility --> ability
  pokemon --> pokemonStat --> stat
  pokemon --> pokemonMove
  move --> pokemonMove
  versionGroup --> pokemonMove
  moveLearnMethod --> pokemonMove

  evolutionChain --> species
  evolutionChain --> evolutionLink
  species --> evolutionLink
  item --> evolutionChain
  item --> evolutionLink
  move --> evolutionLink
  type --> evolutionLink

  item --> machine
  move --> machine
  versionGroup --> machine

  pokedex --> pokedexEntry --> species
```

## Capa competitiva

Tablas principales:

- `competitive_format`
- `competitive_tier`
- `pokemon_format`
- `pokemon_tier_history`
- `usage_stat_monthly`
- `sample_set`
- `banlist_entry`
- `competitive_learnset_entry`

## Diagrama de la capa competitiva

![Diagrama de la capa competitiva](./diagrams/database-competitive.svg)

```mermaid
flowchart LR
  subgraph FormatCatalog["Catalogo competitivo"]
    direction TB
    competitiveFormat["competitive_format"]
    competitiveTier["competitive_tier"]
    banlistEntry["banlist_entry"]
  end

  subgraph FormatMapping["Mapeo por formato"]
    direction TB
    pokemonFormat["pokemon_format"]
    tierHistory["pokemon_tier_history"]
  end

  subgraph CompetitiveData["Datos competitivos"]
    direction TB
    sampleSet["sample_set"]
    learnset["competitive_learnset_entry"]
    usage["usage_stat_monthly"]
  end

  subgraph Canonical["Dominio canonico"]
    direction TB
    pokemon["pokemon"]
    species["pokemon_species"]
    move["move"]
  end

  competitiveFormat --> pokemonFormat
  competitiveTier --> pokemonFormat
  competitiveTier --> tierHistory
  competitiveFormat --> banlistEntry

  pokemon --> pokemonFormat
  species --> pokemonFormat
  pokemon --> tierHistory
  species --> tierHistory

  competitiveFormat --> sampleSet
  pokemon --> sampleSet
  species --> sampleSet

  competitiveFormat --> usage
  pokemon --> usage
  species --> usage

  pokemon --> learnset
  species --> learnset
  move --> learnset
```

## Auth y capa de usuario

Tablas preparadas:

- `user`
- `account`
- `session`
- `verification_token`
- `user_team`
- `user_team_pokemon`
- `user_saved_build`
- `user_favorite_pokemon`
- `user_preferences`

## Diagrama de auth y negocio de usuario

![Diagrama de auth y negocio de usuario](./diagrams/database-user-auth.svg)

```mermaid
flowchart LR
  subgraph Auth["Auth base"]
    direction TB
    user["user"]
    account["account"]
    session["session"]
    verificationToken["verification_token"]
  end

  subgraph Preferences["Preferencias"]
    direction TB
    userPreferences["user_preferences"]
    pokedex["pokedex"]
    versionGroup["version_group"]
  end

  subgraph Team["Equipos"]
    direction TB
    userTeam["user_team"]
    userTeamPokemon["user_team_pokemon"]
  end

  subgraph Saved["Guardado personal"]
    direction TB
    userSavedBuild["user_saved_build"]
    userFavoritePokemon["user_favorite_pokemon"]
  end

  subgraph PokemonDomain["Dominio Pokemon"]
    direction TB
    pokemon["pokemon"]
    ability["ability"]
    item["item"]
  end

  user --> account
  user --> session
  user --> userPreferences
  user --> userTeam --> userTeamPokemon
  user --> userSavedBuild
  user --> userFavoritePokemon

  pokedex --> userPreferences
  versionGroup --> userPreferences

  pokemon --> userTeamPokemon
  ability --> userTeamPokemon
  item --> userTeamPokemon

  pokemon --> userSavedBuild
  ability --> userSavedBuild
  item --> userSavedBuild

  pokemon --> userFavoritePokemon
```

## Views SQL de lectura

Las views se crearon para no depender siempre de joins complejos en DBeaver o en lecturas read-only:

| View | Uso |
| --- | --- |
| `pokemon_summary_view` | Resumen por Pokemon con stats pivotados, tipos y habilidad principal |
| `pokemon_move_learn_view` | Learnsets enriquecidos con movimiento, metodo y version |
| `pokemon_pokedex_entry_view` | Entradas de pokedex con Pokemon por defecto, artwork y tipos |
| `pokemon_competitive_overview_view` | Resumen competitivo por formato, tier y sample sets |

## Indices y claves importantes

- `pokemon.name`, `pokemon_species.name`, `move.name`, `ability.name`, `item.name`: `unique`
- `pokemon_type`, `pokemon_ability`, `pokemon_stat_value`: claves compuestas para evitar duplicados
- `pokemon_move_learn`: `unique` por Pokemon, movimiento, version, metodo y nivel
- `pokemon_format`: `unique` por formato y `showdownPokemonId`
- `usage_stat_monthly`: `unique` por formato, mes, rating y `showdownPokemonId`

## Limitacion conocida en cloud free

Las bases gratuitas en Neon no soportan el dataset completo de `usage_stat_monthly` dentro del limite de almacenamiento actual del proyecto. Por eso:

- local puede cargar el dataset completo
- cloud `develop` y `production` usan una carga ligera sin `usage_stat_monthly`

La parte estructural, los learnsets y los sample sets si quedan cargados en cloud.
