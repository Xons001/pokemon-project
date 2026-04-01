import Image from 'next/image'
import styles from './PokedexHub.module.css'

export default function PokemonGallery({ displayedPokemon, selectedPokemon, onSelectPokemon, pokedexRef }) {
  return (
    <div className={styles.galleryStrip} ref={pokedexRef} id="equipo" aria-label="Seleccion de Pokemon">
      {displayedPokemon.length ? (
        displayedPokemon.map((pokemon) => (
          <button
            key={pokemon.slug}
            type="button"
            title={pokemon.name}
            className={[styles.galleryPill, selectedPokemon.slug === pokemon.slug ? styles.galleryPillActive : null]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelectPokemon(pokemon.slug)}
          >
            <span className={styles.galleryPillThumb}>
              <Image src={pokemon.thumb} alt={pokemon.name} width={88} height={88} loading="lazy" />
            </span>
            <span className={styles.galleryPillCopy}>
              <strong>{pokemon.name}</strong>
              <small>{pokemon.id}</small>
            </span>
          </button>
        ))
      ) : (
        <div className={styles.emptyState}>
          <strong>No hay resultados</strong>
          <p>Prueba con otro nombre o numero.</p>
        </div>
      )}
    </div>
  )
}
