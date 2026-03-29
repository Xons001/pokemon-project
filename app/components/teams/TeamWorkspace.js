import Image from 'next/image'
import { formatDexNumber } from '../../lib/pokemon'
import styles from './TeamWorkspace.module.css'

const paletteAccents = {
  water: '#3b82f6',
  grass: '#32a852',
  fire: '#ef5350',
  ghost: '#7b61ff',
  electric: '#d9a500',
  earth: '#a16207',
  psychic: '#ec4899',
  ice: '#0284c7',
  dark: '#334155',
  dragon: '#4f46e5',
  steel: '#64748b',
  neutral: '#6b7280',
}

function getCardStyle(pokemon) {
  return {
    '--team-accent': paletteAccents[pokemon?.palette] ?? paletteAccents.neutral,
  }
}

export default function TeamWorkspace({
  activeTemplate,
  catalogCount,
  isCatalogLoading,
  isPokemonLoading,
  notice,
  onAddPokemon,
  onClearActiveTemplate,
  onRemovePokemon,
  onRenameActiveTemplate,
  onSelectSlot,
  onSetLeaderSlot,
  searchQuery,
  searchResults,
  selectedSlotIndex,
  setSearchQuery,
  teamMembers,
}) {
  return (
    <section className={styles.workspace}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Constructor de equipo</p>
          <input
            className={styles.nameInput}
            type="text"
            value={activeTemplate?.name ?? ''}
            onChange={(event) => onRenameActiveTemplate(event.target.value)}
            placeholder="Nombre de la plantilla"
            aria-label="Nombre de la plantilla activa"
          />
        </div>

        <button type="button" className={styles.clearButton} onClick={onClearActiveTemplate}>
          Vaciar equipo
        </button>
      </div>

      <p className={styles.notice}>{notice}</p>

      <div className={styles.slotGrid}>
        {teamMembers.map((pokemon, index) => {
          const isActive = index === selectedSlotIndex
          const isLeader = activeTemplate?.leaderSlot === index

          if (!pokemon) {
            return (
              <button
                key={`empty-slot-${index}`}
                type="button"
                className={[styles.slotCard, styles.slotEmpty, isActive ? styles.slotCardActive : null]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectSlot(index)}
              >
                <span className={styles.slotIndex}>Hueco {index + 1}</span>
                <strong>Selecciona un Pokemon</strong>
                <p>Usa el buscador inferior para completar la plantilla.</p>
              </button>
            )
          }

          return (
            <article
              key={`${pokemon.slug}-${index}`}
              className={[styles.slotCard, isActive ? styles.slotCardActive : null].filter(Boolean).join(' ')}
              style={getCardStyle(pokemon)}
            >
              <button type="button" className={styles.slotSelectArea} onClick={() => onSelectSlot(index)}>
                <span className={styles.slotIndex}>Hueco {index + 1}</span>
                <span className={styles.slotDex}>{pokemon.id}</span>

                <div className={styles.slotVisual}>
                  <Image src={pokemon.thumb} alt={pokemon.name} width={88} height={88} loading="lazy" />
                </div>

                <div className={styles.slotCopy}>
                  <strong>{pokemon.name}</strong>
                  <p>{pokemon.types.length ? pokemon.types.join(' / ') : 'Cargando tipos'}</p>
                </div>
              </button>

              <div className={styles.slotActions}>
                <button
                  type="button"
                  className={[styles.slotSecondaryAction, isLeader ? styles.slotLeaderActive : null]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => onSetLeaderSlot(index)}
                >
                  {isLeader ? 'Lider' : 'Marcar lider'}
                </button>
                <button type="button" className={styles.slotSecondaryAction} onClick={() => onRemovePokemon(index)}>
                  Quitar
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchHeader}>
          <div>
            <p className={styles.kicker}>Buscador de plantilla</p>
            <h3>Anade Pokemon al hueco activo</h3>
          </div>

          <span className={styles.catalogBadge}>
            {isCatalogLoading ? 'Cargando catalogo...' : `${catalogCount} Pokemon`}
          </span>
        </div>

        <label className={styles.searchBar} htmlFor="team-search">
          <input
            id="team-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Busca por nombre, numero o tipo"
          />
        </label>

        <p className={styles.helperText}>
          {isPokemonLoading
            ? 'Sincronizando los Pokemon del equipo para analizar compatibilidades...'
            : 'Haz clic en un resultado para colocarlo en el hueco seleccionado.'}
        </p>

        <div className={styles.searchResults}>
          {searchResults.length ? (
            searchResults.map((pokemon) => (
              <button
                key={pokemon.slug}
                type="button"
                className={styles.resultCard}
                onClick={() => onAddPokemon(pokemon.slug)}
              >
                <span className={styles.resultThumb}>
                  <Image src={pokemon.thumb} alt={pokemon.name} width={72} height={72} loading="lazy" />
                </span>

                <span className={styles.resultCopy}>
                  <strong>{pokemon.name}</strong>
                  <small>{pokemon.id ?? formatDexNumber(0)}</small>
                </span>
              </button>
            ))
          ) : (
            <p className={styles.emptyResults}>No hemos encontrado Pokemon para esa busqueda.</p>
          )}
        </div>
      </div>
    </section>
  )
}
