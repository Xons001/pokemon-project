import Image from 'next/image'
import sharedStyles from './shared.module.css'
import styles from './PokedexHub.module.css'

const paletteClassMap = {
  water: styles.hubVisualWater,
  grass: styles.hubVisualGrass,
  fire: styles.hubVisualFire,
  ghost: styles.hubVisualGhost,
  electric: styles.hubVisualElectric,
  earth: styles.hubVisualEarth,
  psychic: styles.hubVisualPsychic,
  ice: styles.hubVisualIce,
  dark: styles.hubVisualDark,
  dragon: styles.hubVisualDragon,
  steel: styles.hubVisualSteel,
  neutral: styles.hubVisualNeutral,
}

export default function PokemonDetail({ pokemon, onViewCard, onFocusSearch }) {
  const visualClassName = [styles.hubVisual, paletteClassMap[pokemon.palette] || styles.hubVisualNeutral]
    .filter(Boolean)
    .join(' ')
  const primaryButtonClassName = [sharedStyles.primaryLink, styles.hubButton].join(' ')
  const secondaryButtonClassName = [sharedStyles.secondaryLink, styles.hubButton].join(' ')

  return (
    <article className={styles.hubDetail}>
      <div className={visualClassName}>
        <div className={styles.hubVisualTop}>
          <span className={styles.featuredChip}>Destacado</span>
          <span className={styles.featuredId}>{pokemon.id}</span>
        </div>

        <div className={styles.hubVisualImageWrap}>
          <Image src={pokemon.image} alt={pokemon.name} width={360} height={360} className={styles.hubVisualImage} priority />
        </div>

        <div className={styles.hubTypeList}>
          {pokemon.types.length ? pokemon.types.map((type) => <span key={type}>{type}</span>) : <span>Cargando</span>}
        </div>
      </div>

      <div className={styles.hubInfo}>
        <p className={sharedStyles.eyebrow}>Pokemon activo</p>
        <h3>{pokemon.name}</h3>
        <p className={styles.hubRole}>{pokemon.role}</p>
        <p className={styles.hubDescription}>{pokemon.description}</p>

        <div className={styles.hubMeta}>
          <div>
            <span>HP</span>
            <strong>{pokemon.hp}</strong>
          </div>
          <div>
            <span>Ataque</span>
            <strong>{pokemon.attack}</strong>
          </div>
          <div>
            <span>Velocidad</span>
            <strong>{pokemon.speed}</strong>
          </div>
          <div>
            <span>Defensa</span>
            <strong>{pokemon.defense}</strong>
          </div>
          <div>
            <span>Bonus</span>
            <strong>{pokemon.bonus}</strong>
          </div>
        </div>

        <div className={styles.hubDetailsGrid}>
          <div className={styles.detailBox}>
            <span>Altura</span>
            <strong>{pokemon.height} m</strong>
          </div>
          <div className={styles.detailBox}>
            <span>Peso</span>
            <strong>{pokemon.weight} kg</strong>
          </div>
          <div className={styles.detailBox}>
            <span>Tipo principal</span>
            <strong>{pokemon.type}</strong>
          </div>
          <div className={styles.detailBox}>
            <span>Id Pokedex</span>
            <strong>{pokemon.id}</strong>
          </div>
          <div className={styles.detailBox}>
            <span>Ataque especial</span>
            <strong>{pokemon.specialAttack}</strong>
          </div>
          <div className={styles.detailBox}>
            <span>Defensa especial</span>
            <strong>{pokemon.specialDefense}</strong>
          </div>
        </div>

        <div className={styles.hubActions}>
          <button type="button" className={primaryButtonClassName} onClick={onViewCard}>
            Ver ficha
          </button>
          <button type="button" className={secondaryButtonClassName} onClick={onFocusSearch}>
            Buscar otro
          </button>
        </div>
      </div>
    </article>
  )
}
