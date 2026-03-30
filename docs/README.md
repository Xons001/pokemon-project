# Documentacion

Esta carpeta concentra la documentacion operativa y tecnica del proyecto.

## Mapa de documentos

- [architecture.md](./architecture.md): vision general de la arquitectura, limites entre capas y organizacion del repositorio
- [database.md](./database.md): modelo de datos Pokemon, capa competitiva, auth futura, views SQL y diagramas Mermaid
- [ingestion.md](./ingestion.md): flujo de ingestion desde PokeAPI y Showdown/Smogon, scripts disponibles y estrategia de resincronizacion
- [deployment.md](./deployment.md): como funcionan los entornos `local`, `develop/preview` y `production`, incluyendo Vercel, Neon y DBeaver
- [api.md](./api.md): endpoints internos, Swagger/OpenAPI y vistas read-only expuestas por la app
- [diagrams/README.md](./diagrams/README.md): imagenes SVG de los diagramas y fuentes Mermaid
- `screenshots/`: capturas de la interfaz guardadas dentro del repositorio

## Lectura recomendada

Si alguien se incorpora al proyecto, este es el mejor orden:

1. [architecture.md](./architecture.md)
2. [database.md](./database.md)
3. [ingestion.md](./ingestion.md)
4. [deployment.md](./deployment.md)
5. [api.md](./api.md)

## Resumen rapido

El proyecto sigue esta regla:

```text
PokeAPI / Showdown / Smogon
  -> scripts de ingestion
  -> PostgreSQL
  -> Prisma
  -> backend interno de Next.js
  -> frontend
```

El frontend no debe llamar directamente a APIs externas.
