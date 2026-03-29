# Pokemon Project

Aplicacion web construida con Next.js y React que consume [PokeAPI](https://pokeapi.co/) para ofrecer dos experiencias dentro del mismo proyecto:

- una **Pokedex interactiva** para explorar Pokemon
- una **pagina de equipos** para montar un equipo de 6 miembros y analizar su compatibilidad por tipos

## Que hace la app

### `/pokedex`

- Busca Pokemon por nombre, numero o tipo.
- Navega por el catalogo completo con paginacion.
- Selecciona un Pokemon y actualiza su ficha principal al instante.
- Muestra stats, tipos, altura, peso, bonus, movimientos por nivel y objetos posibles.

### `/equipos`

- Guarda un unico equipo de 6 Pokemon en `localStorage`.
- Permite construir el equipo seleccionando huecos y anadiendo Pokemon desde un buscador.
- Calcula la compatibilidad del equipo usando la tabla real de tipos de Pokemon.
- Muestra una matriz de efectividades para ver rapidamente que tipos son amenaza y cuales estan mejor cubiertos.

## Rutas principales

- `/` redirige automaticamente a `/pokedex`
- `/pokedex` muestra la Pokedex interactiva
- `/equipos` muestra el constructor y analisis del equipo
- `/pokedex/equipos` redirige a `/equipos` para mantener compatibilidad con la ruta antigua

## Tecnologias

- Next.js 13
- React 18
- CSS Modules + estilos globales base
- PokeAPI

## Como arrancarlo

Puesta en marcha rapida:

```bash
npm install
npm run dev
```

Cuando termine, abre:

```text
http://localhost:3000/pokedex
```

Resumen:

- `npm install` instala las dependencias del proyecto.
- `npm run dev` levanta el servidor de desarrollo.
- la app se recarga automaticamente cuando guardas cambios.

## Scripts disponibles

| Script | Que hace |
| --- | --- |
| `npm run dev` | Arranca la aplicacion en modo desarrollo en `localhost:3000`. |
| `npm run lint` | Revisa el codigo con ESLint. |
| `npm run build` | Genera la build de produccion. |
| `npm run start` | Levanta la build de produccion ya compilada. |

## Funcionalidades actuales

- Carga del catalogo completo de Pokemon desde PokeAPI.
- Paginacion para recorrer la Pokedex sin renderizar todo el catalogo a la vez.
- Busqueda por nombre, numero de Pokedex, tipo o datos ya presentes en cache.
- Ficha principal del Pokemon activo con stats reales y contenido enriquecido.
- Seccion de movimientos por nivel y objetos posibles para el Pokemon seleccionado.
- Constructor de un equipo unico de 6 slots persistido en el navegador.
- Matriz de compatibilidad por tipos para revisar debilidades, resistencias e inmunidades del equipo.
- Arquitectura separada por componentes, hooks y utilidades compartidas.

## Como esta organizada la app

```text
app/
  components/
    home/
      ConfirmationSection.js
      GalleryToolbar.js
      HomePage.js
      PokedexHub.js
      PokemonCardSection.js
      PokemonDetail.js
      PokemonGallery.js
      SearchPanel.js
      SiteHeader.js
    teams/
      TeamAnalysis.js
      TeamBuilderPage.js
      TeamWorkspace.js
    icons/
      MicIcon.js
      SearchIcon.js
  hooks/
    usePokemonCatalog.js
    useTeamBuilder.js
  lib/
    pokemon.js
    team-builder.js
  equipos/
    page.js
  pokedex/
    page.js
    equipos/
      page.js
  globals.css
  layout.js
  page.js
```

## Organizacion del codigo

- `app/page.js`: redirige a `/pokedex`.
- `app/pokedex/page.js`: entrada de la Pokedex.
- `app/equipos/page.js`: entrada de la pagina de equipos.
- `app/hooks/usePokemonCatalog.js`: carga, cache, busqueda y paginacion de la Pokedex.
- `app/hooks/useTeamBuilder.js`: estado del equipo, persistencia local y analisis de compatibilidad.
- `app/lib/pokemon.js`: helpers, constantes y transformacion de datos de PokeAPI.
- `app/lib/team-builder.js`: utilidades para construir y analizar el equipo por tipos.
- `app/components/home/*`: componentes visuales de la Pokedex.
- `app/components/teams/*`: componentes del constructor y la tabla de compatibilidad.
- `app/globals.css`: estilos base globales.

## API utilizada

Este proyecto usa [PokeAPI](https://pokeapi.co/).

Endpoints principales usados:

```text
https://pokeapi.co/api/v2/pokemon?limit={count}&offset=0
https://pokeapi.co/api/v2/pokemon/{id}
https://pokeapi.co/api/v2/type?limit=100
https://pokeapi.co/api/v2/type/{id}
```

Uso actual:

- el catalogo completo se usa para la galeria, la paginacion y el buscador
- `pokemon/{id}` se usa para obtener stats, tipos, altura, peso, habilidades, movimientos e imagenes
- los endpoints de `type` se usan para construir la matriz de compatibilidad del equipo

## Nota para Windows

Si `npm run build` falla con un error parecido a `EPERM ... .next\\trace`, normalmente significa que el servidor de desarrollo sigue abierto y bloqueando archivos dentro de `.next`.

En ese caso:

1. Para el servidor con `Ctrl + C`.
2. Vuelve a ejecutar:

```bash
npm run build
```

## Estado actual

El proyecto ya funciona como una Pokedex interactiva con datos reales y como una herramienta visual para analizar la quimica de un equipo Pokemon dentro del mismo repositorio.
