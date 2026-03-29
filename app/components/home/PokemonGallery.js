import Image from 'next/image'

export default function PokemonGallery({ displayedPokemon, selectedPokemon, onSelectPokemon, pokedexRef }) {
  return (
    <div className="gallery-strip" ref={pokedexRef} id="equipo" aria-label="Seleccion de Pokemon">
      {displayedPokemon.length ? (
        displayedPokemon.map((pokemon) => (
          <button
            key={pokemon.slug}
            type="button"
            className={`gallery-pill ${selectedPokemon.slug === pokemon.slug ? 'gallery-pill-active' : ''}`}
            onClick={() => onSelectPokemon(pokemon.slug)}
          >
            <span className="gallery-pill-thumb">
              <Image src={pokemon.thumb} alt={pokemon.name} width={88} height={88} loading="lazy" />
            </span>
            <span className="gallery-pill-copy">
              <strong>{pokemon.name}</strong>
              <small>{pokemon.id}</small>
            </span>
          </button>
        ))
      ) : (
        <div className="empty-state">
          <strong>No hay resultados</strong>
          <p>Prueba con otro nombre o numero.</p>
        </div>
      )}
    </div>
  )
}
