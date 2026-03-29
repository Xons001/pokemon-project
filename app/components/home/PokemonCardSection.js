import Image from 'next/image'
import { pokemonCardStats } from '../../lib/pokemon'
import sharedStyles from './shared.module.css'
import styles from './PokemonCardSection.module.css'

export default function PokemonCardSection({ pokemon, cardRef, eyebrow = 'Carta destacada' }) {
  return (
    <section className={styles.pokemonCardSection} ref={cardRef} id="ficha">
      <div className={styles.pokemonCardCopy}>
        <p className={sharedStyles.eyebrow}>{eyebrow}</p>
        <h2 className={sharedStyles.sectionTitle}>{pokemon.name}</h2>
        <p className={sharedStyles.sectionText}>{pokemon.description}</p>
      </div>

      <article className={styles.showcaseCard}>
        <Image
          src="/pokemon-card/fondoencabezado.svg"
          alt="Fondo decorativo"
          width={640}
          height={220}
          className={styles.showcaseCardHeader}
        />

        <div className={styles.showcaseCardBody}>
          <div className={styles.showcaseCardAvatar}>
            <Image src={pokemon.image} alt={pokemon.name} width={170} height={170} className={styles.showcaseCardAvatarImage} />
          </div>

          <h3 className={styles.showcaseCardTitle}>
            {pokemon.name} <span>{pokemon.id}</span>
          </h3>
          <p className={styles.showcaseCardText}>{pokemon.type}</p>
        </div>

        <div className={styles.showcaseCardFooter}>
          {pokemonCardStats.map((item) => (
            <div key={item.label} className={styles.showcaseCardStat}>
              <h4>{item.label}</h4>
              <div className={styles.showcaseCardStatIcon}>
                <Image src={item.image} alt={item.label} width={36} height={36} />
              </div>
              <span className={styles.showcaseCardStatValue}>{pokemon[item.key]}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
