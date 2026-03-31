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

## Como llevarlo a cloud y a varias bases

El DAG no actualiza una base de datos por si mismo.
Actualiza el entorno de la app al que apunta.

Eso significa:

- Si Airflow llama a tu app de `staging`, se refresca la base de `staging`.
- Si Airflow llama a tu app de `production`, se refresca la base de `production`.

La forma recomendada es tener un DAG por entorno.

### Variables utiles

- `POKEMON_PROJECT_API_BASE_URL`
  Para un solo target.
- `POKEMON_PROJECT_OPS_TOKEN`
  Token opcional para proteger `/api/ops/meta-refresh/*`.
- `POKEMON_PROJECT_TARGETS_JSON`
  Para varios targets desde un solo archivo de DAG.

Ejemplo de `POKEMON_PROJECT_TARGETS_JSON`:

```json
[
  {
    "name": "staging",
    "apiBaseUrl": "https://staging.tu-dominio.com",
    "schedule": "0 */12 * * *",
    "token": "staging-secret"
  },
  {
    "name": "production",
    "apiBaseUrl": "https://tu-dominio.com",
    "schedule": "0 */12 * * *",
    "token": "production-secret"
  }
]
```

Con eso, Airflow generara:

- `pokemon_meta_refresh__staging`
- `pokemon_meta_refresh__production`

## Configuracion lista para tus dos entornos Vercel

En este repo ya queda preparada una compose especifica:

```text
ops/airflow/docker-compose.vercel-targets.yml
```

Y un ejemplo de variables:

```text
ops/airflow/.env.vercel.example
```

Tal como esta ahora, usa estas URLs por defecto:

- Preview `develop`: `https://pokemon-project-git-develop-xons001s-projects.vercel.app`
- Production: `https://pokemon-project.vercel.app`

### Importante para preview

La URL de preview esta protegida por Vercel Deployment Protection.
Por eso el compose envia tambien:

```text
x-vercel-protection-bypass
```

Necesitas poner el secreto real en:

```text
POKEMON_PROJECT_PREVIEW_VERCEL_BYPASS_SECRET
```

### Importante para la app

En Vercel debes definir estos secretos por entorno:

- Preview: `OPS_META_REFRESH_TOKEN`
- Production: `OPS_META_REFRESH_TOKEN`
- Opcional para visibilidad: `POKEMON_PROJECT_ENV_NAME`

Valores recomendados:

- Preview -> `POKEMON_PROJECT_ENV_NAME=preview`
- Production -> `POKEMON_PROJECT_ENV_NAME=production`

### Arranque del stack multi-entorno

```bash
docker compose --env-file ops/airflow/.env.vercel -f ops/airflow/docker-compose.vercel-targets.yml up -d
```

La UI quedara en:

```text
http://localhost:8081
```

Y deberias ver:

- `pokemon_meta_refresh__preview`
- `pokemon_meta_refresh__production`

## Paso a paso real para este repo

### 1. Crear variables custom en Vercel

En `Settings > Environment Variables` crea estas variables manualmente.

Importante:

- `Key` es el nombre de la variable
- `Value` es su contenido

#### Preview

- `OPS_META_REFRESH_TOKEN=<token preview>`
- `POKEMON_PROJECT_ENV_NAME=preview`

#### Production

- `OPS_META_REFRESH_TOKEN=<token production>`
- `POKEMON_PROJECT_ENV_NAME=production`

Los tokens de preview y production deben ser distintos.

### 2. Redeploy del entorno correcto

Para que la app desplegada lea esas variables, hay que redeployar.

- `Preview`: el deployment estable de `develop`
- `Production`: el deployment de `main`

Un preview de una rama `feature/*` no sirve como target final del DAG si Airflow apunta al preview estable de `develop`.

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

- `POKEMON_PROJECT_PREVIEW_OPS_TOKEN`
- `POKEMON_PROJECT_PRODUCTION_OPS_TOKEN`
- `POKEMON_PROJECT_PREVIEW_VERCEL_BYPASS_SECRET`

### 4. Sacar el bypass secret de Preview

Ese valor se obtiene en Vercel desde la proteccion del deployment de preview.
No es una env var normal de la app.

Airflow lo envia en el header:

```text
x-vercel-protection-bypass
```

### 5. Arrancar Airflow multi-entorno

```bash
docker compose --env-file ops/airflow/.env.vercel -f ops/airflow/docker-compose.vercel-targets.yml up -d
```

### 6. Verificacion esperada

- `https://pokemon-project.vercel.app/api/ops/meta-refresh/status`
  Debe dejar de responder `404` una vez el codigo este en `main`
- `https://pokemon-project-git-develop-xons001s-projects.vercel.app/api/ops/meta-refresh/status`
  Seguir devolviendo `401` desde fuera es normal mientras exista Deployment Protection
- Airflow debe mostrar:
  - `pokemon_meta_refresh__preview`
  - `pokemon_meta_refresh__production`

## Nota importante sobre desarrollo en Vercel

Si tu base de desarrollo esta en Neon pero solo la usas desde `vercel dev` o `next dev`, eso no es un entorno cloud permanente.

Para automatizar ese refresh tienes dos opciones:

1. Crear un entorno `staging` o `preview` estable que use esa base y apuntar un DAG a su URL.
2. Ejecutar el script de ingesta directamente en un runner que cargue la `.env` de desarrollo.

Para produccion, la opcion 1 suele ser la mas limpia.
