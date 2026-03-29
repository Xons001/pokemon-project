import Image from 'next/image'
import { pokemonCardStats } from '../../lib/pokemon'

export default function PokemonCardSection({ pokemon, cardRef }) {
  return (
    <section className="pokemon-card-section" ref={cardRef} id="ficha">
      <div className="pokemon-card-copy">
        <p className="eyebrow">Carta destacada</p>
        <h2 className="section-title">{pokemon.name}</h2>
        <p className="section-text">{pokemon.description}</p>
      </div>

      <article className="showcase-card">
        <Image
          src="/pokemon-card/fondoencabezado.svg"
          alt="Fondo decorativo"
          width={640}
          height={220}
          className="showcase-card-header"
        />

        <div className="showcase-card-body">
          <div className="showcase-card-avatar">
            <Image src={pokemon.image} alt={pokemon.name} width={170} height={170} className="showcase-card-avatar-image" />
          </div>

          <h3 className="showcase-card-title">
            {pokemon.name} <span>{pokemon.id}</span>
          </h3>
          <p className="showcase-card-text">{pokemon.type}</p>
        </div>

        <div className="showcase-card-footer">
          {pokemonCardStats.map((item) => (
            <div key={item.label} className="showcase-card-stat">
              <h4>{item.label}</h4>
              <div className="showcase-card-stat-icon">
                <Image src={item.image} alt={item.label} width={36} height={36} />
              </div>
              <span className="showcase-card-stat-value">{pokemon[item.key]}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
