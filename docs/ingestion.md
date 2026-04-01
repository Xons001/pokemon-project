# Ingestion

## Objetivo

Los scripts de ingestion convierten datos externos en registros propios normalizados dentro de PostgreSQL. Es la pieza que rompe la dependencia del frontend con PokeAPI.

## Fuentes

- `PokeAPI`: especies, Pokemon, movimientos, items, tipos, evoluciones, pokedexes
- `Pokemon Showdown`: formatos, tiers, sample sets y learnsets competitivos
- `Smogon Stats`: uso mensual por formato y rating

## Ubicacion del codigo

- `scripts/ingest.ts`
- `src/modules/ingest/index.ts`
- `src/modules/ingest/types.ts`
- `src/modules/ingest/pokeapi/`
- `src/modules/ingest/showdown/`
- `src/modules/ingest/steps/`

## Orden principal de ingestion

El orden actual del orquestador es:

1. `generation`
2. `version-group`
3. `version`
4. `type`
5. `stat`
6. `ability`
7. `move-learn-method`
8. `item`
9. `move`
10. `evolution-chain`
11. `pokemon-species`
12. `pokemon`
13. `pokemon-form`
14. `machine`
15. `pokemon-bridges`
16. `pokedex`
17. `showdown-format`
18. `showdown-tier`
19. `showdown-learnset`
20. `showdown-sample-set`
21. `showdown-usage`

## Scripts disponibles

| Script | Uso |
| --- | --- |
| `npm run ingest` | Ejecuta el orquestador general |
| `npm run ingest:core` | Solo dominio estructural desde PokeAPI |
| `npm run ingest:showdown` | Solo capa competitiva |
| `npm run ingest:cloud` | Carga cloud-safe sin `showdown-usage` |
| `npm run ingest:all` | Todo el flujo, incluido `showdown-usage` |

## Flujos recomendados

### Local completo

```bash
npm run db:up
npx prisma migrate deploy
npm run ingest:all
```

Este es el flujo recomendado para tener el dataset mas completo posible.

### Cloud gratuita

```bash
npx prisma migrate deploy
npm run ingest:cloud
```

Este flujo omite `showdown-usage`, porque el historico completo de `usage_stat_monthly` excede el limite del plan gratuito.

## Estrategia de persistencia

Los scripts usan una mezcla de:

- `upsert` en tablas base donde hay una clave estable
- resincronizacion por entidad padre en tablas derivadas
- `createMany` para cargas masivas
- guardado de `rawPayload` cuando es util conservar el JSON original

## Variables relevantes

| Variable | Uso |
| --- | --- |
| `POKEAPI_BASE_URL` | Base URL de PokeAPI |
| `POKEAPI_CONCURRENCY` | Paralelismo de ingest estructural |
| `SHOWDOWN_DATA_BASE_URL` | Base URL de datos de Showdown |
| `SHOWDOWN_CONCURRENCY` | Paralelismo de algunas lecturas competitivas |
| `SMOGON_STATS_BASE_URL` | Base URL de stats mensuales |
| `SMOGON_STATS_MONTH` | Fuerza un snapshot mensual concreto |
| `SHOWDOWN_USAGE_INSERT_MODE` | `bulk` o `sequential` para la insercion de `usage_stat_monthly` |
| `POKEMON_PROJECT_META_REFRESH_PROFILE` | `full` o `lean` para decidir si el refresh automatico incluye `showdown-usage` |

## Resincronizacion

La ingestion esta pensada para poder repetirse.

Reglas practicas:

- si cambian datos estructurales, vuelve a correr `npm run ingest:core`
- si cambian formatos, tiers o sample sets, vuelve a correr los pasos competitivos correspondientes
- si algun entorno cloud se recrea desde cero, aplica migraciones y despues `npm run ingest:cloud`

## Problemas comunes

### `Prisma` valida pero la app no tiene datos

Seguramente faltan scripts de ingestion. Ejecuta:

```bash
npm run ingest:all
```

o en cloud free:

```bash
npm run ingest:cloud
```

### Error de memoria o tamano en Neon free

Lo normal es que ocurra con `showdown-usage`. Solucion esperada:

- no cargar ese paso en cloud gratuita
- reservar `npm run ingest:all` para local o una base cloud con mas capacidad

### Quiero procesar un subconjunto

Puedes limitar recursos o pasos:

```bash
npm run ingest -- --steps=pokemon --limit=50
npm run ingest -- --steps=showdown-format,showdown-tier
```
