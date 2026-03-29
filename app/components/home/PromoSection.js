import Image from 'next/image'
import { socialLinks } from '../../lib/pokemon'

export default function PromoSection({ pokemon }) {
  return (
    <section className={`promo-section promo-section-${pokemon.palette}`}>
      <div className="promo-copy">
        <p className="promo-kicker">Landing destacada</p>
        <h2>{pokemon.name}, listo para liderar tu equipo.</h2>
        <p>{pokemon.description}</p>
        <a href="#buscar" className="promo-button">
          Comenzar exploracion
        </a>
      </div>

      <div className="promo-visual">
        <div className="promo-orbit" aria-hidden="true" />
        <Image src={pokemon.image} alt={`${pokemon.name} destacado`} width={520} height={520} className="promo-image" />
      </div>

      <footer className="promo-footer">
        <p>Comparte tu Pokedex</p>
        <ul className="promo-socials" aria-label="Redes sociales">
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
