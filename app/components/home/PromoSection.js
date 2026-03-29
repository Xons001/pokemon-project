import Image from 'next/image'
import { socialLinks } from '../../lib/pokemon'
import styles from './PromoSection.module.css'

const paletteClassMap = {
  water: styles.promoSectionWater,
  grass: styles.promoSectionGrass,
  fire: styles.promoSectionFire,
  ghost: styles.promoSectionGhost,
  electric: styles.promoSectionElectric,
  earth: styles.promoSectionEarth,
  psychic: styles.promoSectionPsychic,
  ice: styles.promoSectionIce,
  dark: styles.promoSectionDark,
  dragon: styles.promoSectionDragon,
  steel: styles.promoSectionSteel,
  neutral: styles.promoSectionNeutral,
}

export default function PromoSection({ pokemon }) {
  const sectionClassName = [styles.promoSection, paletteClassMap[pokemon.palette] || styles.promoSectionNeutral]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={sectionClassName}>
      <div className={styles.promoCopy}>
        <p className={styles.promoKicker}>Landing destacada</p>
        <h2>{pokemon.name}, listo para liderar tu equipo.</h2>
        <p>{pokemon.description}</p>
        <a href="#buscar" className={styles.promoButton}>
          Comenzar exploracion
        </a>
      </div>

      <div className={styles.promoVisual}>
        <div className={styles.promoOrbit} aria-hidden="true" />
        <Image src={pokemon.image} alt={`${pokemon.name} destacado`} width={520} height={520} className={styles.promoImage} />
      </div>

      <footer className={styles.promoFooter}>
        <p>Comparte tu Pokedex</p>
        <ul className={styles.promoSocials} aria-label="Redes sociales">
          {socialLinks.map((item) => (
            <li key={item}>
              <a href="/">{item}</a>
            </li>
          ))}
        </ul>
      </footer>
    </section>
  )
}
