import Image from 'next/image'
import { useI18n } from '../i18n/LanguageProvider'
import styles from './PokedexHub.module.css'

export default function PokemonGallery({ displayedPokemon, selectedPokemon, onSelectPokemon, pokedexRef }) {
  const { t } = useI18n()

  return (
    <div className={styles.galleryStrip} ref={pokedexRef} id="equipo" aria-label={t('home.gallery.ariaLabel')}>
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
          <strong>{t('home.gallery.emptyTitle')}</strong>
          <p>{t('home.gallery.emptyDescription')}</p>
        </div>
      )}
    </div>
  )
}
