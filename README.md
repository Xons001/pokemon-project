# Pokemon Project

Aplicacion web de Pokemon construida con Next.js que ya no consume PokeAPI directamente desde el frontend.

El flujo real del proyecto es:

```text
PokeAPI + Pokemon Showdown/Smogon
  -> scripts de ingest
  -> PostgreSQL
  -> Prisma
  -> backend interno de Next.js
  -> frontend
```

## Documentacion

La documentacion ampliada del proyecto esta en [docs/README.md](./docs/README.md).

Guia rapida:

- [docs/architecture.md](./docs/architecture.md): arquitectura, capas y flujo de datos
- [docs/database.md](./docs/database.md): modelo de datos, tablas, views y diagramas
- [docs/ingestion.md](./docs/ingestion.md): scripts de carga, orden de ingestion y resincronizacion
- [docs/deployment.md](./docs/deployment.md): entornos local, develop y production con Vercel + Neon
- [docs/api.md](./docs/api.md): rutas internas, Swagger y views expuestas

## Objetivo

El proyecto esta preparado para funcionar como una base propia de datos Pokemon y como cimiento para una capa competitiva y de usuario:

- Pokedex y consultas servidas desde tu propia base PostgreSQL
- ingest inicial y resincronizacion desde PokeAPI
- capa competitiva preparada para Showdown y Smogon
- tablas de usuario listas para Auth.js / NextAuth en una fase posterior
- frontend desacoplado de las APIs externas

## Stack

- Next.js 13 App Router
- React 18
- TypeScript incremental con `allowJs`
- Prisma ORM
- PostgreSQL
- Docker Compose para local
- ESLint

## Arquitectura

### Regla principal

El frontend no debe hacer `fetch` a PokeAPI ni a Showdown.

Todo pasa por esta cadena:

```text
fuentes externas -> ingest -> PostgreSQL -> Prisma -> rutas internas / server code -> UI
```

### Fuentes de datos

- PokeAPI: estructura canonica de Pokemon, especies, movimientos, tipos, items, formas, pokedex, evoluciones
- Pokemon Showdown: formatos, tiers, learnsets competitivos, sample sets
- Smogon Stats: uso mensual por formato y rating

### Capas del proyecto

- `prisma/`: esquema y migraciones de la base de datos
- `src/lib/`: cliente Prisma reusable y lectura de entorno
- `src/modules/pokemon/`: consultas y serializacion para la Pokedex
- `src/modules/pokedex/`: consultas relacionadas con pokedexes
- `src/modules/team/`: logica del type chart y analisis
- `src/modules/ingest/`: clientes, pasos y orquestacion de ingestion
- `app/api/`: API interna expuesta al frontend
- `app/components/`, `app/hooks/`, `app/lib/`: UI y consumo de la API interna

## Estado actual

La base ya esta preparada para:

- dominio principal de Pokemon
- tablas puente y learnsets por version/metodo/nivel
- pokedexes y entradas
- capa competitiva base de Showdown/Smogon
- tablas de auth y negocio de usuario para una fase posterior

Conteos locales de referencia para la carga completa:

- `pokemon_species`: `1025`
- `pokemon`: `1350`
- `pokemon_form`: `1578`
- `move`: `937`
- `item`: `2175`
- `pokemon_move_learn`: `618511`
- `competitive_format`: `448`
- `pokemon_format`: `34679`
- `usage_stat_monthly`: `75802`
- `sample_set`: `15486`
- `competitive_learnset_entry`: `321713`

En una base cloud gratuita de `develop` se puede cargar todo el dominio Pokemon y casi toda la capa competitiva, pero no el historico completo de `usage_stat_monthly`: en Neon free se alcanza el limite fisico de `512 MB`. Para ese entorno se usa una ingesta cloud-safe sin ese paso pesado.

## Organizacion del repositorio

```text
app/
  api/
    pokedex/
    pokemon/
    team/
  components/
    home/
    teams/
    icons/
  hooks/
    usePokemonCatalog.js
    useTeamBuilder.js
  lib/
    api.js
    pokemon.js
    team-builder.js
  equipos/
  pokedex/
  globals.css
  layout.js
  page.js

prisma/
  migrations/
  schema.prisma

scripts/
  ingest.ts

src/
  lib/
    env.ts
    prisma.ts
  modules/
    ingest/
      pokeapi/
      showdown/
      steps/
      index.ts
      types.ts
    pokedex/
      queries.ts
    pokemon/
      contracts.ts
      format.ts
      queries.ts
    showdown/
      id.ts
      README.md
    team/
      queries.ts

docker-compose.yml
.env.example
tsconfig.json
```

## Capturas

Las capturas y PNG de apoyo del proyecto estan guardadas dentro del repositorio en:

```text
docs/screenshots/
```

Esto evita dejar archivos visuales sueltos fuera de `pokemon-project` y permite versionarlos junto al codigo.

## Base de datos

### Dominio principal Pokemon

Modelos principales:

- `Generation`
- `VersionGroup`
- `Version`
- `PokemonSpecies`
- `Pokemon`
- `PokemonForm`
- `Type`
- `Ability`
- `Stat`
- `Move`
- `MoveLearnMethod`
- `Machine`
- `EvolutionChain`
- `EvolutionLink`
- `Item`
- `Pokedex`
- `PokedexEntry`

Tablas puente principales:

- `PokemonType`
- `PokemonAbility`
- `PokemonStatValue`
- `PokemonMoveLearn`

### Capa competitiva

- `CompetitiveFormat`
- `CompetitiveTier`
- `PokemonFormat`
- `PokemonTierHistory`
- `UsageStatMonthly`
- `SampleSet`
- `BanlistEntry`
- `CompetitiveLearnsetEntry`

### Auth y usuario

Ya estan preparadas las tablas para una fase posterior con Prisma Adapter:

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `UserTeam`
- `UserTeamPokemon`
- `UserSavedBuild`
- `UserFavoritePokemon`
- `UserPreferences`

### Views SQL de lectura

Tambien se han anadido vistas SQL para consultas limpias y exploracion en DBeaver sin tener que navegar por tantas tablas puente o columnas de payload:

- `pokemon_summary_view`: resumen de un Pokemon en una sola fila con especie, generacion, tipos, habilidad principal y stats pivotados
- `pokemon_move_learn_view`: learnsets ya enriquecidos con nombre del Pokemon, movimiento, metodo y version
- `pokemon_pokedex_entry_view`: entradas de pokedex con especie, Pokemon por defecto, tipos y artwork
- `pokemon_competitive_overview_view`: vista competitiva por formato con tier, usage mas reciente y disponibilidad de sample sets

Estas views estan pensadas para lectura, reporting y depuracion. La escritura sigue pasando por Prisma sobre las tablas base.

## Requisitos

Necesitas tener instalado:

- Node.js 20 o superior
- npm
- Docker Desktop
- opcional: DBeaver para inspeccionar la base

## Configuracion local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear entorno

Copia `.env.example` a `.env`.

Variables por defecto:

```env
DATABASE_URL="postgresql://pokemon:pokemon@localhost:5432/pokemon_project?schema=public"
DIRECT_URL="postgresql://pokemon:pokemon@localhost:5432/pokemon_project?schema=public"

POSTGRES_DB="pokemon_project"
POSTGRES_USER="pokemon"
POSTGRES_PASSWORD="pokemon"
POSTGRES_PORT="5432"

POKEAPI_BASE_URL="https://pokeapi.co/api/v2"
POKEAPI_CONCURRENCY="4"
SHOWDOWN_DATA_BASE_URL="https://play.pokemonshowdown.com/data"
SHOWDOWN_CONCURRENCY="4"
SMOGON_STATS_BASE_URL="https://www.smogon.com/stats"
SMOGON_STATS_MONTH=""
SHOWDOWN_USAGE_INSERT_MODE="bulk"
POKEMON_PROJECT_META_REFRESH_PROFILE="full"
```

Si `SMOGON_STATS_MONTH` esta vacio, la ingestion intentara usar el ultimo snapshot mensual disponible.

### 3. Levantar PostgreSQL en local

```bash
npm run db:up
```

### 4. Generar cliente Prisma

```bash
npm run prisma:generate
```

### 5. Aplicar migraciones

Si ya existen las migraciones del repositorio, aplica:

```bash
npx prisma migrate deploy
```

Si estas desarrollando cambios nuevos en el esquema:

```bash
npm run prisma:migrate:dev -- --name nombre_del_cambio
```

### 6. Cargar datos en la base

Ingestion completa:

```bash
npm run ingest:all
```

Solo dominio base de PokeAPI:

```bash
npm run ingest:core
```

Solo capa competitiva:

```bash
npm run ingest:showdown
```

Ingesta recomendada para una base cloud gratuita:

```bash
npm run ingest:cloud
```

Tambien puedes lanzar pasos concretos:

```bash
npm run ingest -- --steps=generation,version-group,version
npm run ingest -- --steps=showdown-format,showdown-tier
npm run ingest -- --steps=pokemon --limit=50
```

### 7. Arrancar la app

```bash
npm run dev
```

Abre:

```text
http://localhost:3000/pokedex
```

## Scripts disponibles

| Script | Descripcion |
| --- | --- |
| `npm run dev` | Arranca Next.js en desarrollo. |
| `npm run build` | Genera la build de produccion. |
| `npm run start` | Arranca la build de produccion. |
| `npm run lint` | Ejecuta ESLint. |
| `npm run db:up` | Levanta PostgreSQL local con Docker Compose. |
| `npm run db:down` | Para y desmonta los contenedores. |
| `npm run db:logs` | Muestra logs del contenedor PostgreSQL. |
| `npm run prisma:generate` | Genera el cliente Prisma. |
| `npm run prisma:migrate:dev` | Crea/aplica una migracion de desarrollo. |
| `npm run prisma:studio` | Abre Prisma Studio. |
| `npm run ingest` | Ejecuta el orquestador general de ingestion. |
| `npm run ingest:core` | Ingesta el dominio estructural desde PokeAPI. |
| `npm run ingest:showdown` | Ingesta la capa competitiva desde Showdown/Smogon. |
| `npm run ingest:cloud` | Ingesta compatible con una base cloud gratuita; omite `showdown-usage` para no reventar el limite de almacenamiento. |
| `npm run ingest:cloud-dev` | Alias del modo cloud gratuito mantenido por compatibilidad. |
| `npm run ingest:all` | Ejecuta todos los pasos en orden. |

## Entornos cloud

### Develop en la nube

El proyecto ya esta enlazado a Vercel y tiene una base PostgreSQL gratuita de Neon conectada para `development` y `preview`.

Flujo recomendado:

```bash
npx vercel env pull .env.development.vercel --environment=development
```

Despues puedes usar esa base cloud desde tu maquina cargando ese fichero de entorno y ejecutando:

```bash
npx prisma migrate deploy
npm run ingest:cloud
```

Notas importantes:

- `DIRECT_URL` tambien debe existir en cloud para que Prisma pueda migrar correctamente.
- `SHOWDOWN_USAGE_INSERT_MODE="bulk"` es el modo normal para local o una base cloud con capacidad suficiente.
- Si alguna vez quieres forzar insercion mas conservadora de `usage_stat_monthly`, puedes usar `SHOWDOWN_USAGE_INSERT_MODE="sequential"`, aunque sera mas lenta.
- En Neon free no cabe la carga completa de `usage_stat_monthly`; para `develop` se deja fuera a proposito.
- Usa `POKEMON_PROJECT_META_REFRESH_PROFILE="lean"` en `Preview / develop` y `POKEMON_PROJECT_META_REFRESH_PROFILE="full"` en `Production / main`.
- Si una base cloud de `develop` ya se lleno por usage parcial, puedes podarla con `npm run prune:cloud-dev -- --apply --vacuum`.

### Main / produccion

Para `main`, la recomendacion es crear una segunda base gestionada y separada de la de `develop`.

En produccion deberias hacer:

- una base distinta para no mezclar pruebas con datos reales
- `npx prisma migrate deploy`
- `npm run ingest:all` solo si la base tiene capacidad para el dataset completo, incluyendo `showdown-usage`
- variables de entorno propias de `production` en Vercel

## API interna

Rutas expuestas actualmente:

- `GET /api/pokemon`
- `GET /api/pokemon/[name]`
- `GET /api/pokemon/[name]/moves`
- `GET /api/team/type-chart`
- `GET /api/pokedex/[id]`
- `GET /api/views/pokemon-summary`
- `GET /api/views/pokemon-move-learn`
- `GET /api/views/pokedex-entries`
- `GET /api/views/competitive-overview`
- `GET /api/openapi`
- `GET /api/docs`

Estas rutas consultan PostgreSQL via Prisma y son las que consume el frontend.

### Swagger / OpenAPI

La documentacion navegable esta disponible en:

```text
http://localhost:3000/api/docs
```

La especificacion OpenAPI en JSON esta disponible en:

```text
http://localhost:3000/api/openapi
```

El Swagger documenta tanto la API funcional de la app como los endpoints read-only sobre las views SQL.

## Conexion desde DBeaver

Valores por defecto para local:

- Host: `localhost`
- Port: `5432`
- Database: `pokemon_project`
- Username: `pokemon`
- Password: `pokemon`

Cadena completa:

```text
postgresql://pokemon:pokemon@localhost:5432/pokemon_project?schema=public
```

## Flujo de trabajo recomendado

Para arrancar un entorno local desde cero:

```bash
npm install
Copy-Item .env.example .env
npm run db:up
npm run prisma:generate
npx prisma migrate deploy
npm run ingest:all
npm run dev
```

Si ya tienes la BD creada y solo quieres actualizar datos:

```bash
npm run ingest:all
```

Si solo quieres desarrollo UI sobre datos ya cargados:

```bash
npm run dev
```

Si quieres probar localmente contra la base cloud de `develop`:

```bash
npx vercel env pull .env.development.vercel --environment=development
```

Luego carga esas variables en tu shell y ejecuta:

```bash
npx prisma migrate deploy
npm run dev
```

## Notas de implementacion

- El frontend ya no hace llamadas directas a PokeAPI.
- Prisma se reutiliza desde `src/lib/prisma.ts` para evitar multiples instancias del cliente.
- Los scripts de ingest usan `upsert` en tablas base y resincronizacion controlada en tablas derivadas.
- En tablas grandes se guarda `rawPayload` para poder reparsear o ampliar campos mas adelante.
- La capa competitiva combina datos de Showdown con estadisticas mensuales de Smogon.
- La base cloud gratuita de `develop` esta pensada para validacion funcional y pruebas de integracion, no para alojar todo el historico competitivo pesado.

## Despliegue futuro

La arquitectura ya esta preparada para:

- mover PostgreSQL a un servicio gestionado
- usar variables de entorno separadas por entorno
- ejecutar migraciones en produccion
- anadir Auth.js / NextAuth con Google
- almacenar equipos, favoritos y builds persistidos por usuario
- mantener una base gratuita ligera en `develop` y otra mas amplia para `main`

## Verificacion rapida

Comandos utiles para comprobar que todo esta sano:

```bash
npm run lint
npx tsc --noEmit
npx prisma validate
```

## Problemas comunes

### El frontend arranca pero no hay datos

Probablemente falta ejecutar:

```bash
npm run ingest:all
```

### DBeaver no conecta

Revisa que PostgreSQL este levantado:

```bash
docker compose ps
```

### Prisma no encuentra la base

Comprueba que `.env` existe y que `DATABASE_URL` apunta al puerto correcto.
