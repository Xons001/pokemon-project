# Despliegue y entornos

## Resumen

El proyecto trabaja con dos escenarios permanentes:

- local
- `main` / `production`

`develop` queda como rama de integracion, pero no como entorno cloud permanente para ahorrar recursos.

## Mapa de entornos

| Entorno | Runtime | Base de datos | Objetivo |
| --- | --- | --- | --- |
| Local | `npm run dev` en tu maquina | PostgreSQL Docker local | desarrollo diario y dataset completo |
| Production | deployment de `main` en Vercel | Neon `pokemon-project-prod-db` | entorno definitivo |

## Regla importante

Un merge a Git no crea bases de datos. Lo que hace es disparar deployments si el repositorio esta conectado a Vercel.

Por tanto:

- el merge o push a `develop` sirve para integracion de codigo, pero Vercel ignora el build de preview mediante `vercel.json`
- el merge de `main` despliega codigo en `Production`
- las bases tienen que existir y estar configuradas de antemano

La configuracion `ignoreCommand` ejecuta `scripts/vercel-ignore-preview.cjs`: los builds con `VERCEL_ENV=production` continuan y los demas se saltan para ahorrar recursos.

## Estado actual del proyecto

Queda como entorno estable:

- base cloud de produccion: `pokemon-project-prod-db`

La base cloud de desarrollo puede mantenerse solo como recurso local/remoto puntual, pero no deberia tener un DAG permanente apuntando a ella.

## Vercel + Neon

### Production

Variables relevantes:

- `DATABASE_URL`
- `DIRECT_URL`
- `OPS_META_REFRESH_TOKEN`
- `POKEMON_PROJECT_ENV_NAME=production`
- `POKEMON_PROJECT_META_REFRESH_PROFILE=full`

Aplicadas en:

- `Production`

## Comandos utiles

### Descargar variables cloud

```bash
npx vercel env pull .env.production.vercel --environment=production
```

### Aplicar migraciones

```bash
npx prisma migrate deploy
```

### Cargar datos en cloud free

```bash
npm run ingest:cloud
```

## Conectar DBeaver

### Local

- Host: `localhost`
- Port: `5432`
- Database: `pokemon_project`
- Username: `pokemon`
- Password: la definida en `.env`

### Cloud production

Usa los valores de `.env.production.vercel`, tambien con la URL directa y SSL `require`.

## Checklist de despliegue

## Variables custom para automatizacion

Estas dos variables no vienen dadas por Neon ni por Vercel.
Hay que crearlas manualmente:

- `OPS_META_REFRESH_TOKEN`
- `POKEMON_PROJECT_ENV_NAME`

Opcionalmente, si quieres ver la UI interna de `Ops` tambien en un deployment cloud, puedes activar:

- `POKEMON_PROJECT_ENABLE_OPS_UI=true`

Regla:

- `Key` = nombre de variable
- `Value` = contenido

Valor recomendado:

- `Production` -> `POKEMON_PROJECT_ENV_NAME=production`

## Visibilidad de Ops

La pantalla `/ops/meta-refresh` no deberia mostrarse a usuarios finales.

Comportamiento actual:

- en `local` se muestra para facilitar desarrollo
- en `production` queda oculta del header por defecto
- en `production` la ruta devuelve `404` salvo que actives `POKEMON_PROJECT_ENABLE_OPS_UI=true`

Importante:

- ocultar la UI no sustituye la proteccion de API
- las rutas `/api/ops/meta-refresh/*` siguen protegidas por `OPS_META_REFRESH_TOKEN`

## Que deployment cuenta para Airflow

Para este proyecto, Airflow no debe apuntar al preview de una rama `feature/*` ni al preview estable de `develop` mientras queramos ahorrar recursos.

El target correcto ahora es:

- `Production` estable de `main`

Si una feature branch tiene un preview propio, sirve para probar UI o funcionalidad, pero no como endpoint estable del DAG.

### Antes de mergear a `develop`

1. `npm run lint`
2. `npx tsc --noEmit`
3. comprobar que la base dev tiene migraciones aplicadas
4. comprobar que la base dev tiene datos cargados

### Antes de mergear a `main`

1. validar la rama `develop` en local o con preview temporal si decides abrirlo
2. comprobar variables de `Production` en Vercel
3. comprobar migraciones en la base prod
4. comprobar que la base prod este cargada con `npm run ingest:cloud` o `npm run ingest:all` segun capacidad
5. comprobar que las rutas `/api/ops/meta-refresh/status` y `/api/ops/meta-refresh/apply` existen en el deployment

## Limitacion actual de cloud free

Las bases gratuitas no deberian cargar `usage_stat_monthly` completo en entornos de desarrollo.

Consecuencia:

- las pantallas estructurales funcionan
- la capa competitiva ligera funciona
- el historico mensual de Smogon queda reservado para `production`, local o un plan con mas capacidad

## Estrategia recomendada desde ahora

- `Production / main`
  - `POKEMON_PROJECT_META_REFRESH_PROFILE=full`
  - refresca tambien `showdown-usage`

Si ademas quieres recortar el proyecto a un subconjunto fijo de metas, deja los `formatKey` activos en `src/modules/showdown/format-scope.ts`.

Con esa lista configurada:

- la ingesta de `showdown-format`, `showdown-sample-set` y `showdown-usage` ignora los formatos fuera del scope
- `showdown-format` elimina de la base los formatos competitivos que ya no esten permitidos
- el team builder solo expone los metas activos y ajusta el formato por defecto al primero disponible

Si una base de desarrollo ya se ha llenado por un intento anterior de usage, puedes podarla con:

```bash
npm run prune:cloud-dev -- --apply --vacuum
```

Eso borra `usage_stat_monthly`, limpia los flags de usage en `pokemon_format` e intenta recuperar storage con `VACUUM FULL`.

Si aun asi Neon sigue marcando el proyecto demasiado lleno, la opcion mas tranquila es eliminar o recrear esa base de desarrollo y usar solo produccion como entorno cloud permanente.

## Recomendacion futura

Cuando quieras que `main` tenga todo el dataset competitivo, lo recomendable es:

- mantener dev en una base ligera
- mover prod a una base PostgreSQL con mas almacenamiento
- entonces ejecutar `npm run ingest:all` en produccion
