# Pokemon Project

Aplicacion web construida con Next.js y React que consume [PokeAPI](https://pokeapi.co/) para mostrar una Pokedex interactiva.

La app permite:

- Buscar Pokemon por nombre, numero o tipo.
- Navegar por el catalogo completo con paginacion.
- Seleccionar un Pokemon y ver su ficha principal actualizada al instante.
- Mostrar datos sacados del endpoint `pokemon/{id}` como `hp`, `attack`, `defense`, `special-attack`, `special-defense`, `speed`, `types`, `height`, `weight` y `abilities`.

## Tecnologias

- Next.js 13
- React 18
- CSS global
- PokeAPI

## Como arrancarlo

1. Entra en la carpeta del proyecto:

```bash
cd C:\RepositoriosJavascript\pokemon-project
```

2. Instala dependencias:

```bash
npm install
```

3. Arranca el servidor de desarrollo:

```bash
npm run dev
```

4. Abre el navegador en:

```text
http://localhost:3000
```

## Scripts disponibles

```bash
npm run dev
```

Levanta el proyecto en modo desarrollo.

```bash
npm run lint
```

Lanza ESLint para revisar el codigo.

```bash
npm run build
```

Genera la build de produccion.

```bash
npm run start
```

Arranca la build de produccion.

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

Endpoint principal usado para la ficha:

```text
https://pokeapi.co/api/v2/pokemon/{id}
```

## Estado actual

Ahora mismo el proyecto ya permite navegar por el catalogo y visualizar datos reales de Pokemon en una interfaz propia construida con React.
