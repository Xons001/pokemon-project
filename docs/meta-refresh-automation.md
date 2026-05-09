# Automatizacion de refresco del meta

## Objetivo

Mantener la capa competitiva actualizada sin reingerir todo el dataset a ciegas.

En este proyecto conviven dos ritmos distintos:

- `Pokemon Showdown data`
  Incluye `formats.js`, `formats-data.js`, `learnsets.json` y `data/sets/`.
  Cambia de forma irregular y puede moverse varias veces dentro del mismo mes.
- `Smogon stats`
  Publica snapshots mensuales por carpeta `YYYY-MM/`.
  Lo normal es que el snapshot salga el dia `1` del mes siguiente, con un pequeño retraso operativo.

## Recomendacion de frecuencia

- Ejecutar inspeccion inteligente cada `12 horas`.
- Dejar que el script decida si hace falta correr `showdown-format`, `showdown-tier`, `showdown-learnset`, `showdown-sample-set` o `showdown-usage`.
- No programar una ingesta mensual separada si ya usas el modo inteligente.
  El chequeo diario o cada 12 horas es suficiente y mas simple.

## Tabla de control

Se ha anadido la tabla `ingest_source_checkpoint` para guardar el estado observado y aplicado de cada fuente externa.

Campos principales:

- `sourceKey`
  Identificador estable de la fuente.
  Ejemplos: `showdown-format-bundle`, `showdown-learnsets`, `showdown-sample-sets`, `smogon-usage-monthly`.
- `sourceType`
  Tipo funcional de fuente, por ejemplo `showdown-data` o `smogon-stats`.
- `description`
  Descripcion corta para operaciones.
- `cadence`
  Cadencia recomendada, por ejemplo `cada 12h` o `mensual`.
- `lastObservedVersion`
  Ultima version remota que hemos visto.
  Para Showdown usamos `ISO datetime`.
  Para Smogon usamos el mes `YYYY-MM`.
- `lastObservedAt`
  Fecha de observacion.
- `lastAppliedVersion`
  Ultima version que realmente se aplico a la base.
- `lastAppliedAt`
  Fecha de la ultima aplicacion correcta.
- `metadata`
  Contexto libre para diagnostico.

## Script inteligente

Se ha anadido `npm run ingest:smart`.

Comportamiento:

1. Inspecciona upstream.
2. Compara contra checkpoints y contra el ultimo `usageStatMonthly.month` de la base.
3. Construye un plan de pasos recomendado.
4. Si pasas `--apply`, ejecuta solo los pasos necesarios.
5. Actualiza checkpoints observados y aplicados.

Uso:

```bash
npm run ingest:smart
npm run ingest:smart -- --json
npm run ingest:smart -- --apply
npm run ingest:smart -- --apply --force
```

## Regla de decision actual

- Si cambia `formats.js` o `formats-data.js`
  Ejecutar `showdown-format,showdown-tier`
- Si cambia `learnsets.json`
  Ejecutar `showdown-learnset`
- Si cambia el timestamp maximo de `data/sets/*.json`
  Ejecutar `showdown-sample-set`
- Si el ultimo snapshot remoto de Smogon es mayor que el ultimo `month` cargado en `usage_stat_monthly`
  Ejecutar `showdown-usage`

## DAG recomendado

Un solo DAG es suficiente si corre cada `12 horas`.

Flujo:

1. `inspect_meta_sources`
   Ejecuta `npm run ingest:smart -- --json`
2. `apply_meta_refresh`
   Ejecuta `npm run ingest:smart -- --apply`
3. `healthcheck_optional`
   Puede revisar que el ultimo checkpoint aplicado no se ha quedado atrasado demasiado tiempo

Ventajas:

- Menos complejidad que tener un DAG diario y otro mensual.
- Sigue reaccionando rapido a cambios de Showdown.
- Captura automaticamente el snapshot mensual de Smogon cuando aparezca.

## Cron alternativo

Si no quieres Airflow, puedes lanzar exactamente el mismo script desde `cron`.

Ejemplo:

```cron
0 */12 * * * cd /ruta/pokemon-project && npm run ingest:smart -- --apply >> /var/log/pokemon-project-ingest.log 2>&1
```

## Observabilidad minima recomendada

- Alertar si `smogon-usage-monthly.lastAppliedVersion` se queda a mas de `40 dias` del calendario actual.
- Alertar si una fuente `showdown-data` no se aplica en mas de `14 dias`.
- Guardar stdout y stderr del script.
- Exponer los checkpoints en una vista admin o en Prisma Studio para depurar rapido.

## Cloud y multiples bases de datos

La automatizacion no deberia pensar en "bases de datos" directamente, sino en "entornos".

Cada entorno de la app tiene su propio `DATABASE_URL` y, por tanto, su propia base:

- `local`
- `production`

La forma limpia de operar esto es:

1. Exponer `/api/ops/meta-refresh/status`
2. Exponer `/api/ops/meta-refresh/apply`
3. Proteger ambas rutas con un token compartido cuando el entorno sea publico
4. Crear un DAG por entorno permanente que apunte a la URL correcta de la app

Ejemplo:

- DAG `pokemon_meta_refresh__production` -> `https://tu-app.com`

Asi, cada DAG actualiza solo su propia base.

En este proyecto, a fecha de `9 de mayo de 2026`, el unico target cloud permanente es:

- `production`: `https://pokemon-project-six-gamma.vercel.app`

Nota actual:

- `production` responde `200`
- los previews de rama se ignoran con `vercel.json` para ahorrar recursos
- Airflow no debe apuntar a `develop` ni a previews temporales

### Caso especial: base de desarrollo en la nube

Si usas una base de desarrollo en Neon pero solo la montas desde `next dev` o `vercel dev`, no existe un endpoint cloud estable al que Airflow pueda llamar.

En ese caso tienes dos opciones validas:

- Crear temporalmente un `staging` si necesitas una prueba cloud puntual
- Ejecutar el script de ingesta directamente con la `.env` de desarrollo en un runner programado

En general:

- `production` -> mejor con DAG contra una URL desplegada
- `development` puro -> mejor con local o job directo por `.env`

## Checklist corto de activacion en Vercel

1. Crear en `Preview`:
   - `OPS_META_REFRESH_TOKEN`
   - `POKEMON_PROJECT_ENV_NAME=preview`
   - `POKEMON_PROJECT_META_REFRESH_PROFILE=lean`
2. Crear en `Production`:
   - `OPS_META_REFRESH_TOKEN`
   - `POKEMON_PROJECT_ENV_NAME=production`
   - `POKEMON_PROJECT_META_REFRESH_PROFILE=full`
3. Redeployar `develop` para el preview estable
4. Redeployar `main` para production cuando el codigo ya este mergeado
5. Copiar `ops/airflow/.env.vercel.example` a `ops/airflow/.env.vercel`
6. Rellenar:
   - `POKEMON_PROJECT_PREVIEW_OPS_TOKEN`
   - `POKEMON_PROJECT_PRODUCTION_OPS_TOKEN`
   - `POKEMON_PROJECT_PREVIEW_VERCEL_BYPASS_SECRET`
7. Levantar Airflow multi-entorno

Si `production` responde `404` en `/api/ops/meta-refresh/status`, el problema no es el token: el codigo todavia no esta desplegado en `main`.

## Riesgos conocidos

- Showdown puede actualizar varias piezas el mismo dia.
  Por eso se compara por fuente, no por una sola fecha global.
- Smogon puede retrasar algun snapshot puntual.
  El script no falla por eso: simplemente no ve un mes nuevo y no ingiere usage.
- Si fuerzas `SMOGON_STATS_MONTH`, el script usa ese mes como objetivo.
  Esto sirve para backfills, pero conviene desactivarlo despues.

## Perfil recomendado por entorno

Para no llenar la base cloud de `develop`, este proyecto soporta perfiles de refresco:

- `full`
  Ejecuta tambien `showdown-usage`.
- `lean`
  Nunca ejecuta `showdown-usage`, aunque exista un mes nuevo en Smogon.

Ademas, si quieres limitar `showdown-usage` a unos pocos metas concretos, puedes usar:

- `SHOWDOWN_USAGE_TARGET_FORMATS=gen9ou,gen9uu,gen9monotype`

Cuando esta variable existe:

- solo se ingieren snapshots mensuales de esos formatos
- `usage_stat_monthly` elimina cualquier usage de formatos fuera de esa lista
- `pokemon_format` desmarca `isUsageTracked` fuera de esos formatos, pero conserva los sample sets

En este proyecto, si `production` no define `SHOWDOWN_USAGE_TARGET_FORMATS`, se aplica por defecto:

- `gen9ou`
- `gen9uu`
- `gen9monotype`

Regla recomendada:

- `Preview / develop` -> `POKEMON_PROJECT_META_REFRESH_PROFILE=lean`
- `Production / main` -> `POKEMON_PROJECT_META_REFRESH_PROFILE=full`
