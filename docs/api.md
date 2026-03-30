# API interna

## Regla general

La UI no consulta PokeAPI ni Showdown. Todo pasa por la API interna de Next.js o por lectura de Prisma desde servidor.

## Endpoints actuales

### Pokemon

- `GET /api/pokemon`
- `GET /api/pokemon/[name]`
- `GET /api/pokemon/[name]/moves`

### Pokedex

- `GET /api/pokedex/[id]`

### Equipos

- `GET /api/team/type-chart`

### Views read-only

- `GET /api/views/pokemon-summary`
- `GET /api/views/pokemon-move-learn`
- `GET /api/views/pokedex-entries`
- `GET /api/views/competitive-overview`

## Swagger / OpenAPI

La documentacion navegable esta en:

```text
/api/docs
```

La especificacion JSON esta en:

```text
/api/openapi
```

## Objetivo de las views expuestas

Estas rutas sirven para:

- exploracion de datos
- reporting
- integraciones futuras
- reducir joins repetitivos en lecturas read-only

## Modulos relevantes

- `app/api/`
- `src/modules/pokemon/`
- `src/modules/pokedex/`
- `src/modules/team/`
- `src/modules/views/`
- `src/modules/openapi/spec.ts`

## Ejemplos

### Listar Pokemon

```text
GET /api/pokemon?page=1&pageSize=20
```

### Buscar un Pokemon por nombre

```text
GET /api/pokemon/bulbasaur
```

### Ver movimientos de un Pokemon

```text
GET /api/pokemon/bulbasaur/moves
```

### Leer la view resumen

```text
GET /api/views/pokemon-summary?search=bulbasaur
```

### Leer overview competitivo

```text
GET /api/views/competitive-overview?format=gen9ou
```

## Evolucion futura esperada

Cuando se active auth, aqui se anadiran rutas para:

- equipos de usuario
- favoritos
- builds guardadas
- preferencias
