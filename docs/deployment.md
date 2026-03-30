# Despliegue y entornos

## Resumen

El proyecto trabaja con tres escenarios:

- local
- `develop` / `preview`
- `main` / `production`

Cada uno puede apuntar a una base distinta.

## Mapa de entornos

| Entorno | Runtime | Base de datos | Objetivo |
| --- | --- | --- | --- |
| Local | `npm run dev` en tu maquina | PostgreSQL Docker local | desarrollo diario y dataset completo |
| Development | shell local con `.env.development.vercel` | Neon `pokemon-project-dev-db` | pruebas remotas y validacion |
| Preview | deployment de rama `develop` en Vercel | misma Neon dev | pruebas en web desplegada |
| Production | deployment de `main` en Vercel | Neon `pokemon-project-prod-db` | entorno definitivo |

## Regla importante

Un merge a Git no crea bases de datos. Lo que hace es disparar deployments si el repositorio esta conectado a Vercel.

Por tanto:

- el merge de `develop` despliega codigo en `Preview`
- el merge de `main` despliega codigo en `Production`
- las bases tienen que existir y estar configuradas de antemano

## Estado actual del proyecto

Ya estan creados y conectados:

- base cloud de desarrollo: `pokemon-project-dev-db`
- base cloud de produccion: `pokemon-project-prod-db`

Y las migraciones ya se han aplicado en ambas.

## Vercel + Neon

### Develop

Variables relevantes:

- `DATABASE_URL`
- `DIRECT_URL`

Aplicadas en:

- `Development`
- `Preview`

### Production

Variables relevantes:

- `DATABASE_URL`
- `DIRECT_URL`

Aplicadas en:

- `Production`

## Comandos utiles

### Descargar variables cloud

```bash
npx vercel env pull .env.development.vercel --environment=development
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

### Cloud develop

Usa los valores de `.env.development.vercel`, preferiblemente la URL directa (`DIRECT_URL` o `POSTGRES_URL_NON_POOLING`), no la pooler.

En Neon cloud recuerda:

- el nombre del recurso puede ser `pokemon-project-dev-db`
- el nombre real de la base suele ser `neondb`
- en DBeaver debes activar SSL con modo `require`

### Cloud production

Usa los valores de `.env.production.vercel`, tambien con la URL directa y SSL `require`.

## Checklist de despliegue

### Antes de mergear a `develop`

1. `npm run lint`
2. `npx tsc --noEmit`
3. comprobar que la base dev tiene migraciones aplicadas
4. comprobar que la base dev tiene datos cargados

### Antes de mergear a `main`

1. validar la rama `develop` desplegada
2. comprobar variables de `Production` en Vercel
3. comprobar migraciones en la base prod
4. comprobar que la base prod este cargada con `npm run ingest:cloud` o `npm run ingest:all` segun capacidad

## Limitacion actual de cloud free

Las bases gratuitas no cargan `usage_stat_monthly` completo.

Consecuencia:

- las pantallas estructurales funcionan
- la capa competitiva ligera funciona
- el historico mensual de Smogon queda reservado para local o para un plan con mas capacidad

## Recomendacion futura

Cuando quieras que `main` tenga todo el dataset competitivo, lo recomendable es:

- mantener dev en una base ligera
- mover prod a una base PostgreSQL con mas almacenamiento
- entonces ejecutar `npm run ingest:all` en produccion
