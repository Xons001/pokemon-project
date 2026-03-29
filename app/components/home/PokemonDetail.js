import Image from 'next/image'

export default function PokemonDetail({ pokemon, onViewCard, onFocusSearch }) {
  return (
    <article className="hub-detail">
      <div className={`hub-visual hub-visual-${pokemon.palette}`}>
        <div className="hub-visual-top">
          <span className="featured-chip">Destacado</span>
          <span className="featured-id">{pokemon.id}</span>
        </div>

        <div className="hub-visual-image-wrap">
          <Image src={pokemon.image} alt={pokemon.name} width={360} height={360} className="hub-visual-image" priority />
        </div>

        <div className="hub-type-list">
          {pokemon.types.length ? pokemon.types.map((type) => <span key={type}>{type}</span>) : <span>Cargando</span>}
        </div>
      </div>

      <div className="hub-info">
        <p className="eyebrow">Pokemon activo</p>
        <h3>{pokemon.name}</h3>
        <p className="hub-role">{pokemon.role}</p>
        <p className="hub-description">{pokemon.description}</p>

        <div className="hub-meta">
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

        <div className="hub-details-grid">
          <div className="detail-box">
            <span>Altura</span>
            <strong>{pokemon.height} m</strong>
          </div>
          <div className="detail-box">
            <span>Peso</span>
            <strong>{pokemon.weight} kg</strong>
          </div>
          <div className="detail-box">
            <span>Tipo principal</span>
            <strong>{pokemon.type}</strong>
          </div>
          <div className="detail-box">
            <span>Id Pokedex</span>
            <strong>{pokemon.id}</strong>
          </div>
          <div className="detail-box">
            <span>Ataque especial</span>
            <strong>{pokemon.specialAttack}</strong>
          </div>
          <div className="detail-box">
            <span>Defensa especial</span>
            <strong>{pokemon.specialDefense}</strong>
          </div>
        </div>

        <div className="hub-actions">
          <button type="button" className="primary-link hub-button" onClick={onViewCard}>
            Ver ficha
          </button>
          <button type="button" className="secondary-link hub-button" onClick={onFocusSearch}>
            Buscar otro
          </button>
        </div>
      </div>
    </article>
  )
}
