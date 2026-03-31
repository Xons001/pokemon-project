import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { formatDexNumber } from '../../lib/pokemon'
import TeamStatEditor from './TeamStatEditor'
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

const moveTypeAccents = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
}

const lightMoveTypeText = new Set(['normal', 'electric', 'grass', 'ice', 'ground', 'bug', 'steel'])

function getCardStyle(pokemon) {
  return {
    '--team-accent': paletteAccents[pokemon?.palette] ?? paletteAccents.neutral,
  }
}

function getMoveTypeStyle(typeKey) {
  const background = moveTypeAccents[typeKey] ?? '#64748b'

  return {
    backgroundColor: background,
    borderColor: background,
    color: lightMoveTypeText.has(typeKey) ? '#18212f' : '#ffffff',
  }
}

function getMoveCardStyle(move) {
  return {
    '--move-accent': moveTypeAccents[move?.typeKey] ?? '#dce6f4',
  }
}

export default function TeamWorkspace({
  activeTeam,
  catalogCount,
  isCatalogLoading,
  isMovesLoading,
  isPokemonLoading,
  notice,
  onAddPokemon,
  onAssignEffortValue,
  onAssignIndividualValue,
  onAssignMoveToSlot,
  onClearTeam,
  onClearMovesFromSlot,
  onRemovePokemon,
  onResetStatSpread,
  onRenameTeam,
  onSelectSlot,
  searchQuery,
  searchResults,
  selectedPokemonMoves,
  selectedSlot,
  selectedSlotIndex,
  setSearchQuery,
  teamMembers,
}) {
  const teamPanelRef = useRef(null)
  const [openMovePickerIndex, setOpenMovePickerIndex] = useState(null)
  const [moveSearchQuery, setMoveSearchQuery] = useState('')
  const [searchPanelHeight, setSearchPanelHeight] = useState(null)
  const movePickerRefs = useRef([])
  const activePokemon = teamMembers[selectedSlotIndex] ?? null
  const activeMoveSlugs = selectedSlot?.moveSlugs ?? []
  const selectedMoveEntries = activeMoveSlugs.map(
    (moveSlug) => selectedPokemonMoves.find((entry) => entry.moveSlug === moveSlug) ?? null
  )
  const selectedMovesCount = activeMoveSlugs.filter(Boolean).length

  useEffect(() => {
    if (openMovePickerIndex === null) {
      return
    }

    function handlePointerDown(event) {
      const activePicker = movePickerRefs.current[openMovePickerIndex]

      if (activePicker && !activePicker.contains(event.target)) {
        setOpenMovePickerIndex(null)
        setMoveSearchQuery('')
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenMovePickerIndex(null)
        setMoveSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [openMovePickerIndex])

  useEffect(() => {
    setOpenMovePickerIndex(null)
    setMoveSearchQuery('')
  }, [activePokemon?.slug])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(min-width: 1201px)')

    function syncSearchPanelHeight() {
      if (!mediaQuery.matches) {
        setSearchPanelHeight(null)
        return
      }

      const nextHeight = teamPanelRef.current?.offsetHeight ?? null
      setSearchPanelHeight(nextHeight ? `${nextHeight}px` : null)
    }

    syncSearchPanelHeight()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            syncSearchPanelHeight()
          })
        : null

    if (resizeObserver && teamPanelRef.current) {
      resizeObserver.observe(teamPanelRef.current)
    }

    const handleViewportChange = () => {
      syncSearchPanelHeight()
    }

    mediaQuery.addEventListener('change', handleViewportChange)
    window.addEventListener('resize', handleViewportChange)

    return () => {
      resizeObserver?.disconnect()
      mediaQuery.removeEventListener('change', handleViewportChange)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [])

  function formatMoveOptionLabel(move) {
    return `${move.move} · ${move.type} · ${move.category}`
  }

  function formatMoveMetrics(move) {
    return [
      move.power !== null ? `Pow ${move.power}` : null,
      move.accuracy !== null ? `Acc ${move.accuracy}` : null,
      move.pp !== null ? `PP ${move.pp}` : null,
      move.priority ? `Prio ${move.priority > 0 ? `+${move.priority}` : move.priority}` : null,
    ].filter(Boolean)
  }

  function formatMoveStats(move) {
    return [move.type, move.category, ...formatMoveMetrics(move)]
  }

  function toggleMovePicker(index) {
    setMoveSearchQuery('')
    setOpenMovePickerIndex((previous) => {
      return previous === index ? null : index
    })
  }

  function handleMoveSelection(index, moveSlug) {
    onAssignMoveToSlot(index, moveSlug)
    setOpenMovePickerIndex(null)
    setMoveSearchQuery('')
  }

  return (
    <section className={styles.workspace}>
      <div className={styles.topGrid}>
        <section className={styles.teamPanel} ref={teamPanelRef}>
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
              const movesConfigured = activeTeam.slots[index]?.moveSlugs?.filter(Boolean).length ?? 0

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
                        <small className={styles.slotMeta}>{movesConfigured}/4 movimientos</small>
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

        <aside className={styles.searchSection} style={searchPanelHeight ? { height: searchPanelHeight } : undefined}>
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

      <section className={styles.buildPanel}>
        <div className={styles.buildHeader}>
          <div>
            <p className={styles.kicker}>Editor del hueco activo</p>
            <h3>{activePokemon ? activePokemon.name : `Hueco ${selectedSlotIndex + 1}`}</h3>
          </div>

          <div className={styles.buildActions}>
            <span className={styles.buildBadge}>{selectedMovesCount}/4 movimientos</span>
            {activePokemon ? (
              <button
                type="button"
                className={styles.slotSecondaryAction}
                onClick={() => onClearMovesFromSlot(selectedSlotIndex)}
              >
                Vaciar moves
              </button>
            ) : null}
          </div>
        </div>

        {activePokemon ? (
          <>
            <div className={styles.buildSummary}>
              <div className={styles.buildSummaryVisual} style={getCardStyle(activePokemon)}>
                <Image src={activePokemon.thumb} alt={activePokemon.name} width={88} height={88} loading="lazy" />
              </div>

              <div className={styles.buildSummaryCopy}>
                <strong>{activePokemon.name}</strong>
                <p>{activePokemon.types.length ? activePokemon.types.join(' / ') : 'Tipos sin cargar'}</p>
                <div className={styles.buildTags}>
                  <span>{activePokemon.role}</span>
                  <span>{selectedPokemonMoves.length} opciones de movimiento</span>
                </div>
              </div>
            </div>

            <p className={styles.buildHelperText}>
              {isMovesLoading
                ? 'Cargando learnset competitivo para este Pokemon...'
                : 'Elige un moveset base. Este paso nos servira despues para detectar hazards, prioridad, pivots y wincons del equipo.'}
            </p>

            <div className={styles.moveGrid}>
              {activeMoveSlugs.map((moveSlug, index) => {
                const selectedMove = selectedMoveEntries[index]
                const normalizedMoveSearch = moveSearchQuery.trim().toLowerCase()
                const filteredMoves = normalizedMoveSearch
                  ? selectedPokemonMoves.filter((move) => {
                      const haystack = [
                        move.move,
                        move.type,
                        move.category,
                        move.moveSlug,
                        ...move.learnMethods,
                      ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()

                      return haystack.includes(normalizedMoveSearch)
                    })
                  : selectedPokemonMoves
                const isPickerOpen = openMovePickerIndex === index

                return (
                  <article
                    key={`move-slot-${index}`}
                    className={[styles.moveCard, selectedMove ? styles.moveCardSelected : null].filter(Boolean).join(' ')}
                    style={getMoveCardStyle(selectedMove)}
                  >
                    <label className={styles.moveLabel} htmlFor={`team-move-${index}`}>
                      Movimiento {index + 1}
                    </label>

                    <div
                      className={styles.movePicker}
                      ref={(node) => {
                        movePickerRefs.current[index] = node
                      }}
                    >
                      <button
                        id={`team-move-${index}`}
                        type="button"
                        className={styles.moveSelectTrigger}
                        onClick={() => toggleMovePicker(index)}
                        aria-expanded={isPickerOpen}
                        aria-haspopup="listbox"
                        disabled={isMovesLoading}
                      >
                        <span className={styles.moveSelectContent}>
                          <strong className={styles.moveSelectTitle}>
                            {selectedMove ? selectedMove.move : 'Selecciona un movimiento'}
                          </strong>
                          <span className={styles.moveSelectMeta}>
                            {selectedMove ? (
                              <>
                                <span className={styles.moveTypeChip} style={getMoveTypeStyle(selectedMove.typeKey)}>
                                  {selectedMove.type}
                                </span>
                                <span
                                  className={[
                                    styles.moveCategoryChip,
                                    styles[`moveCategory${selectedMove.categoryKey ?? 'status'}`],
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                >
                                  {selectedMove.category}
                                </span>
                              </>
                            ) : (
                              <span className={styles.moveSelectPlaceholder}>
                                Pulsa para abrir el learnset y elegirlo con color por tipo.
                              </span>
                            )}
                          </span>
                        </span>
                        <span className={styles.moveSelectChevron}>{isPickerOpen ? '▴' : '▾'}</span>
                      </button>

                      {isPickerOpen ? (
                        <div className={styles.movePickerPopover}>
                          <div className={styles.movePickerToolbar}>
                            <input
                              className={styles.moveSearchInput}
                              type="text"
                              value={moveSearchQuery}
                              onChange={(event) => setMoveSearchQuery(event.target.value)}
                              placeholder="Filtra por nombre, tipo o categoria"
                              autoFocus
                            />
                            {moveSlug ? (
                              <button
                                type="button"
                                className={styles.moveClearButton}
                                onClick={() => handleMoveSelection(index, '')}
                              >
                                Vaciar
                              </button>
                            ) : null}
                          </div>

                          <div className={styles.moveOptionList} role="listbox" aria-label={`Opciones de movimiento ${index + 1}`}>
                            {filteredMoves.length ? (
                              filteredMoves.map((move) => {
                                const isSelected = move.moveSlug === moveSlug

                                return (
                                  <button
                                    key={`${move.moveSlug}-${move.categoryKey ?? 'none'}`}
                                    type="button"
                                    className={[styles.moveOption, isSelected ? styles.moveOptionSelected : null]
                                      .filter(Boolean)
                                      .join(' ')}
                                    onClick={() => handleMoveSelection(index, move.moveSlug)}
                                    role="option"
                                    aria-selected={isSelected}
                                  >
                                    <span className={styles.moveOptionTop}>
                                      <strong>{move.move}</strong>
                                      <span className={styles.moveOptionTags}>
                                        <span className={styles.moveTypeChip} style={getMoveTypeStyle(move.typeKey)}>
                                          {move.type}
                                        </span>
                                        <span
                                          className={[
                                            styles.moveCategoryChip,
                                            styles[`moveCategory${move.categoryKey ?? 'status'}`],
                                          ]
                                            .filter(Boolean)
                                            .join(' ')}
                                        >
                                          {move.category}
                                        </span>
                                      </span>
                                    </span>
                                    <span className={styles.moveOptionStats}>
                                      {formatMoveMetrics(move).length
                                        ? formatMoveMetrics(move).join(' · ')
                                        : formatMoveOptionLabel(move)}
                                    </span>
                                  </button>
                                )
                              })
                            ) : (
                              <p className={styles.moveOptionEmpty}>
                                No encontramos movimientos que coincidan con ese filtro.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {selectedMove ? (
                      <>
                        <strong className={styles.moveName}>{selectedMove.move}</strong>
                        <div className={styles.moveStats}>
                          {formatMoveStats(selectedMove).map((value) => (
                            <span key={`${selectedMove.moveSlug}-${value}`} className={styles.moveStatChip}>
                              {value}
                            </span>
                          ))}
                        </div>
                        <p className={styles.moveHint}>
                          {selectedMove.learnMethods.length
                            ? `Aprendizaje: ${selectedMove.learnMethods.join(', ')}`
                            : 'Movimiento listo para el analisis del equipo.'}
                        </p>
                      </>
                    ) : (
                      <p className={styles.moveHint}>
                        {isMovesLoading
                          ? 'Esperando a que termine de cargar el learnset...'
                          : 'Todavia no has elegido un movimiento para este hueco.'}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          </>
        ) : (
          <div className={styles.emptyBuildState}>
            <strong>Selecciona un Pokemon en este hueco</strong>
            <p>Cuando el hueco activo tenga Pokemon, aqui podras guardar sus cuatro movimientos base.</p>
          </div>
        )}

        <TeamStatEditor
          pokemon={activePokemon}
          selectedSlot={selectedSlot}
          onAssignEffortValue={onAssignEffortValue}
          onAssignIndividualValue={onAssignIndividualValue}
          onResetStatSpread={() => onResetStatSpread(selectedSlotIndex)}
        />
      </section>
    </section>
  )
}
