# Airflow local

## Que veras aqui

- DAG principal: `ops/airflow/dags/pokemon_meta_refresh.py`
- UI local esperada: `http://localhost:8080`

Este Airflow no ejecuta `npm` dentro del contenedor. En su lugar llama a la API local de la app:

- `GET /api/ops/meta-refresh/status`
- `POST /api/ops/meta-refresh/apply`

Eso evita duplicar la logica de refresco dentro de Airflow.

## Requisitos

1. Tener la app Next levantada en `http://localhost:3000`
2. Tener PostgreSQL operativo
3. Tener Docker Desktop levantado

## Arranque

Desde la raiz del repo:

```bash
docker compose -f ops/airflow/docker-compose.yml up -d
```

Luego abre:

```text
http://localhost:8080
```

El DAG deberia aparecer con id:

```text
pokemon_meta_refresh
```

Por defecto se ejecuta los viernes a las 08:00 en la zona horaria del scheduler de Airflow (`0 8 * * 5`). Puedes cambiarlo con `POKEMON_PROJECT_DAG_SCHEDULE`.

## Como comprobar que funciona

1. Abre `/ops/meta-refresh` en la app y revisa el plan actual
2. Abre Airflow UI en `http://localhost:8080`
3. Busca el DAG `pokemon_meta_refresh`
4. Ejecuta primero `inspect_meta_sources`
5. Ejecuta despues `apply_meta_refresh`

Si la app esta levantada, Airflow vera el mismo estado que muestra la pantalla `/ops/meta-refresh`.

## Nota para Windows y macOS

El compose usa `host.docker.internal` para que el contenedor de Airflow llame a tu app local.

Si algun dia despliegas esto en Linux, tendras que ajustar `POKEMON_PROJECT_API_BASE_URL`.

## Como llevarlo a cloud

El DAG no actualiza una base de datos por si mismo.
Actualiza el entorno de la app al que apunta.

Eso significa:

- Si Airflow llama a tu app de `production`, se refresca la base de `production`.

Decision actual del proyecto: mantener solo el target estable de `production` para no sostener un entorno cloud de prueba permanente.
Los equipos del meta visibles en la UI se leen de VGenC bajo demanda con cache corta; el DAG refresca la base competitiva propia (`formats`, `tiers`, `learnsets`, sample sets y usage si el perfil es `full`).

### Variables utiles

- `POKEMON_PROJECT_API_BASE_URL`
  Para un solo target.
- `POKEMON_PROJECT_OPS_TOKEN`
  Token opcional para proteger `/api/ops/meta-refresh/*`.
- `POKEMON_PROJECT_TARGETS_JSON`
  Para configurar explicitamente el target si no quieres usar las variables simples.

Ejemplo de `POKEMON_PROJECT_TARGETS_JSON` para production:

```json
[
  {
    "name": "production",
    "apiBaseUrl": "https://tu-dominio.com",
    "schedule": "0 8 * * 5",
    "token": "production-secret"
  }
]
```

Con eso, Airflow generara:

- `pokemon_meta_refresh__production`

## Configuracion lista para Vercel Production

En este repo ya queda preparada una compose especifica:

```text
ops/airflow/docker-compose.vercel-targets.yml
```

Y un ejemplo de variables:

```text
ops/airflow/.env.vercel.example
```

Tal como esta ahora, usa esta URL por defecto:

- Production: `https://pokemon-project-six-gamma.vercel.app`

### Importante para la app

En Vercel debes definir estos secretos en `Production`:

- Production: `OPS_META_REFRESH_TOKEN`
- Opcional para visibilidad: `POKEMON_PROJECT_ENV_NAME`

Valores recomendados:

- Production -> `POKEMON_PROJECT_ENV_NAME=production`

### Arranque del stack de produccion

```bash
docker compose --env-file ops/airflow/.env.vercel -f ops/airflow/docker-compose.vercel-targets.yml up -d
```

La UI quedara en:

```text
http://localhost:8081
```

Y deberias ver:

- `pokemon_meta_refresh__production`

## Paso a paso real para este repo

### 1. Crear variables custom en Vercel

En `Settings > Environment Variables` crea estas variables manualmente.

Importante:

- `Key` es el nombre de la variable
- `Value` es su contenido

#### Production

- `OPS_META_REFRESH_TOKEN=<token production>`
- `POKEMON_PROJECT_ENV_NAME=production`
- `POKEMON_PROJECT_META_REFRESH_PROFILE=full`

### 2. Redeploy del entorno correcto

Para que la app desplegada lea esas variables, hay que redeployar.

- `Production`: el deployment de `main`

Un preview de una rama `feature/*` sirve para probar UI, pero no como target final del DAG.

### 3. Completar el `.env` de Airflow

Copia:

```text
ops/airflow/.env.vercel.example
```

a:

```text
ops/airflow/.env.vercel
```

y rellena:

- `POKEMON_PROJECT_PRODUCTION_OPS_TOKEN`

### 4. Arrancar Airflow

```bash
docker compose --env-file ops/airflow/.env.vercel -f ops/airflow/docker-compose.vercel-targets.yml up -d
```

### 5. Verificacion esperada

- `https://pokemon-project-six-gamma.vercel.app/api/ops/meta-refresh/status`
  Debe dejar de responder `404` una vez el codigo este en `main`
- Airflow debe mostrar:
  - `pokemon_meta_refresh__production`

## Nota importante sobre desarrollo en Vercel

Si tu base de desarrollo esta en Neon pero solo la usas desde `vercel dev` o `next dev`, eso no es un entorno cloud permanente.

Para automatizar desarrollo sin un entorno cloud permanente, ejecuta el script de ingesta directamente en local contra la `.env` correspondiente. El DAG estable queda reservado a produccion.

## Recomendacion operativa final

- `Production / main`:
  usa `POKEMON_PROJECT_META_REFRESH_PROFILE=full` para refrescar tambien la capa de usage de Smogon.

Si la base cloud de `develop` ya se ha llenado por cargas antiguas, puedes podarla con:

```bash
npm run prune:cloud-dev -- --apply --vacuum
```
