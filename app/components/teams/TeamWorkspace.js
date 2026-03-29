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
  activeTeam,
  catalogCount,
  isCatalogLoading,
  isPokemonLoading,
  notice,
  onAddPokemon,
  onClearTeam,
  onRemovePokemon,
  onRenameTeam,
  onSelectSlot,
  searchQuery,
  searchResults,
  selectedSlotIndex,
  setSearchQuery,
  teamMembers,
}) {
  return (
    <section className={styles.workspace}>
      <div className={styles.topGrid}>
        <section className={styles.teamPanel}>
          <div className={styles.header}>
            <div>
              <p className={styles.kicker}>Equipo guardado</p>
              <input
                className={styles.nameInput}
                type="text"
                value={activeTeam?.name ?? ''}
                onChange={(event) => onRenameTeam(event.target.value)}
                placeholder="Nombre del equipo"
                aria-label="Nombre del equipo actual"
              />
            </div>

            <button type="button" className={styles.clearButton} onClick={onClearTeam}>
              Vaciar equipo
            </button>
          </div>

          <p className={styles.notice}>{notice}</p>

          <div className={styles.slotGrid}>
            {teamMembers.map((pokemon, index) => {
              const isActive = index === selectedSlotIndex

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
                    <p>Elige el hueco y anade un Pokemon desde el buscador.</p>
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
                    <div className={styles.slotTop}>
                      <span className={styles.slotIndex}>Hueco {index + 1}</span>
                      <span className={styles.slotDex}>{pokemon.id}</span>
                    </div>

                    <div className={styles.slotMain}>
                      <div className={styles.slotVisual}>
                        <Image src={pokemon.thumb} alt={pokemon.name} width={72} height={72} loading="lazy" />
                      </div>

                      <div className={styles.slotCopy}>
                        <strong>{pokemon.name}</strong>
                        <p>{pokemon.types.length ? pokemon.types.join(' / ') : 'Cargando tipos'}</p>
                      </div>
                    </div>
                  </button>

                  <div className={styles.slotActions}>
                    <button type="button" className={styles.slotSecondaryAction} onClick={() => onRemovePokemon(index)}>
                      Quitar
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className={styles.searchSection}>
          <div className={styles.searchHeader}>
            <div>
              <p className={styles.kicker}>Buscador del equipo</p>
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
                    <Image src={pokemon.thumb} alt={pokemon.name} width={64} height={64} loading="lazy" />
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
        </aside>
      </div>
    </section>
  )
}
