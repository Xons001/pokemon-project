# Pokemon Project

Aplicacion web construida con Next.js y React que consume [PokeAPI](https://pokeapi.co/) para mostrar una Pokedex interactiva.

La app permite:

- Buscar Pokemon por nombre, numero o tipo.
- Navegar por el catalogo completo con paginacion.
- Seleccionar un Pokemon y ver su ficha principal actualizada al instante.
- Mostrar datos sacados del endpoint `pokemon/{id}` como `hp`, `attack`, `defense`, `special-attack`, `special-defense`, `speed`, `types`, `height`, `weight` y `abilities`.

## Funcionalidades actuales

- Carga del catalogo completo de Pokemon desde PokeAPI.
- Paginacion para recorrer el listado sin cargar toda la interfaz de golpe.
- Busqueda por nombre, numero de Pokedex, tipo o habilidad ya cargada en cache.
- Seleccion interactiva de Pokemon desde la galeria superior.
- Ficha principal que actualiza imagen, tipos, rol y stats al cambiar de Pokemon.
- Tarjeta destacada y bloque promocional reutilizando el Pokemon activo.
- Arquitectura separada por componentes, hook de datos y utilidades compartidas.

## Tecnologias

- Next.js 13
- React 18
- CSS global
- PokeAPI

## Como arrancarlo

Puesta en marcha rapida:

```bash
npm install
npm run dev
```

Cuando termine, abre:

```text
http://localhost:3000
```

Resumen:

- `npm install` instala las dependencias del proyecto.
- `npm run dev` levanta el servidor de desarrollo.
- La app se recarga automaticamente cuando guardas cambios.

## Scripts disponibles

| Script | Que hace |
| --- | --- |
| `npm run dev` | Arranca la aplicacion en modo desarrollo en `localhost:3000`. |
| `npm run lint` | Revisa el codigo con ESLint. |
| `npm run build` | Genera la build de produccion. |
| `npm run start` | Levanta la build de produccion ya compilada. |

## Nota para Windows

Si `npm run build` falla con un error parecido a `EPERM ... .next\\trace`, normalmente significa que el servidor de desarrollo sigue abierto y bloqueando archivos dentro de `.next`.

En ese caso:

1. Para el servidor con `Ctrl + C`.
2. Vuelve a ejecutar:

```bash
npm run build
```

## De que va la app

La pagina principal funciona como una Pokedex visual:

- Arriba hay un buscador con sugerencias rapidas.
- Debajo aparece una galeria paginada con Pokemon.
- Al seleccionar uno, la ficha principal cambia con sus datos reales.
- La misma seleccion se reutiliza tambien en la tarjeta destacada y en la seccion promocional inferior.

La idea del proyecto es mezclar una interfaz mas visual de portfolio con datos reales sacados de API.

## Estructura principal

```text
app/
  components/
    home/
      ConfirmationSection.js
      GalleryToolbar.js
      PokedexHub.js
      PokemonCardSection.js
      PokemonDetail.js
      PokemonGallery.js
      PromoSection.js
      SearchPanel.js
      SiteHeader.js
    icons/
      MicIcon.js
      SearchIcon.js
  hooks/
    usePokemonCatalog.js
  lib/
    pokemon.js
  globals.css
  layout.js
  page.js
```

## Organizacion del codigo

- `app/page.js`: pagina maestra que compone la home.
- `app/hooks/usePokemonCatalog.js`: hook con la logica de carga, busqueda, cache y paginacion.
- `app/lib/pokemon.js`: constantes, helpers y transformacion de datos de PokeAPI.
- `app/components/home/*`: componentes visuales de la home.
- `app/globals.css`: estilos globales del proyecto.

## API utilizada

Este proyecto usa [PokeAPI](https://pokeapi.co/).

Endpoints principales usados:

```text
https://pokeapi.co/api/v2/pokemon?limit={count}&offset=0
https://pokeapi.co/api/v2/pokemon/{id}
```

Uso actual:

- El catalogo completo se usa para construir la galeria y la paginacion.
- El endpoint `pokemon/{id}` se usa para obtener los datos del Pokemon activo.
- De ese endpoint se leen directamente los stats base, tipos, altura, peso, habilidades e imagenes.

## Estado actual

Ahora mismo el proyecto ya permite recorrer el catalogo completo, seleccionar Pokemon y visualizar datos reales en una interfaz propia construida con React y Next.js.
