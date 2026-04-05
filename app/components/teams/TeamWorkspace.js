import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

import { formatDexNumber, formatResourceName } from '../../lib/pokemon'
import {
  TEAM_NATURES,
  createFallbackMoveEntry,
  getNatureSummary,
  normalizeTeamResourceId,
} from '../../lib/team-builder'
import TeamSelectPicker from './TeamSelectPicker'
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

function getNatureMetaLabel(nature) {
  if (!nature?.increasedStat || !nature?.decreasedStat) {
    return 'Neutral'
  }

  return nature.summary.replace(`${nature.label} `, '').replace(/^\(|\)$/g, '')
}

export default function TeamWorkspace({
  activeTeam,
  catalogCount,
  isCatalogLoading,
  itemCatalog,
  isItemsLoading,
  isMovesLoading,
  isPokemonLoading,
  notice,
  onAddPokemon,
  onAssignAbilityToSlot,
  onAssignItemToSlot,
  onAssignNatureToSlot,
  onAssignEffortValue,
  onAssignIndividualValue,
  onAssignMoveToSlot,
  onClearTeam,
  onClearMovesFromSlot,
  onGenerateTeamExportText,
  onImportTeamText,
  onRemovePokemon,
  onResetStatSpread,
  onRenameTeam,
  onSelectSlot,
  onSetSearchPage,
  searchPage,
  searchQuery,
  searchResults,
  searchResultsSummary,
  selectedPokemonDetail,
  selectedPokemonMoves,
  selectedSlot,
  selectedSlotIndex,
  setSearchQuery,
  teamMembers,
}) {
  const teamPanelRef = useRef(null)
  const searchInputRef = useRef(null)
  const searchResultsRef = useRef(null)
  const movePickerRefs = useRef([])
  const [openMovePickerIndex, setOpenMovePickerIndex] = useState(null)
  const [moveSearchQuery, setMoveSearchQuery] = useState('')
  const [searchPanelHeight, setSearchPanelHeight] = useState(null)
  const [transferText, setTransferText] = useState('')
  const [transferMessage, setTransferMessage] = useState('')

  const activePokemon = teamMembers[selectedSlotIndex] ?? null
  const activeMoveSlugs = selectedSlot?.moveSlugs ?? []
  const selectedAbilitySlug = selectedSlot?.abilitySlug ?? ''
  const selectedNatureKey = selectedSlot?.natureKey ?? ''
  const selectedMovesCount = activeMoveSlugs.filter(Boolean).length
  const selectedMoveEntries = activeMoveSlugs.map((moveSlug) => {
    if (!moveSlug) {
      return null
    }

    return selectedPokemonMoves.find((entry) => entry.moveSlug === moveSlug) ?? createFallbackMoveEntry(moveSlug)
  })
  const selectedAbilityOptions = useMemo(() => {
    return selectedPokemonDetail?.abilities ?? []
  }, [selectedPokemonDetail?.abilities])
  const abilityPickerOptions = useMemo(() => {
    return selectedAbilityOptions.map((ability) => ({
      value: ability.slug,
      label: ability.label,
      meta: ability.isHidden ? 'Oculta' : 'Base',
      keywords: [ability.slug],
    }))
  }, [selectedAbilityOptions])
  const itemLookup = useMemo(() => {
    const lookup = new Map()

    itemCatalog.forEach((item) => {
      const itemSlug = normalizeTeamResourceId(item.slug)
      const itemLabelKey = normalizeTeamResourceId(item.label)

      if (itemSlug) {
        lookup.set(itemSlug, item)
      }

      if (itemLabelKey) {
        lookup.set(itemLabelKey, item)
      }
    })

    return lookup
  }, [itemCatalog])
  const itemPickerOptions = useMemo(() => {
    return itemCatalog.map((item) => ({
      value: item.slug,
      label: item.label,
      meta: formatResourceName(item.category ?? 'item'),
      keywords: [item.slug, item.category ?? 'item'],
    }))
  }, [itemCatalog])
  const naturePickerOptions = useMemo(() => {
    return TEAM_NATURES.map((nature) => ({
      value: nature.key,
      label: nature.label,
      meta: getNatureMetaLabel(nature),
      keywords: [nature.summary],
    }))
  }, [])

  function getItemLabel(itemSlug) {
    if (!itemSlug) {
      return ''
    }

    return itemLookup.get(itemSlug)?.label ?? formatResourceName(itemSlug)
  }

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
    return `${move.move} | ${move.type} | ${move.category}`
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
    return [move.type, move.category, ...formatMoveMetrics(move)].filter(Boolean)
  }

  function toggleMovePicker(index) {
    setMoveSearchQuery('')
    setOpenMovePickerIndex((previous) => (previous === index ? null : index))
  }

  function handleMoveSelection(index, moveSlug) {
    onAssignMoveToSlot(index, moveSlug)
    setOpenMovePickerIndex(null)
    setMoveSearchQuery('')
  }

  function clearSearchQuery() {
    setSearchQuery('')
    searchInputRef.current?.focus()
  }

  function buildVisibleSearchPages() {
    const totalPages = searchResultsSummary?.totalPages ?? 1
    const currentPage = searchPage ?? 1

    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5]
    }

    if (currentPage >= totalPages - 2) {
      return Array.from({ length: 5 }, (_, index) => totalPages - 4 + index)
    }

    return Array.from({ length: 5 }, (_, index) => currentPage - 2 + index)
  }

  function handleSearchPageChange(nextPage) {
    onSetSearchPage(nextPage)
    searchResultsRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleCopyExport() {
    const nextText = onGenerateTeamExportText()

    if (!nextText.trim()) {
      setTransferMessage('Todavia no hay sets completos que exportar.')
      return
    }

    try {
      await navigator.clipboard.writeText(nextText)
      setTransferText(nextText)
      setTransferMessage('Equipo copiado al portapapeles en formato Showdown.')
    } catch {
      setTransferText(nextText)
      setTransferMessage('No se pudo copiar automaticamente, pero ya tienes el texto preparado.')
    }
  }

  function handleGenerateExport() {
    const nextText = onGenerateTeamExportText()
    setTransferText(nextText)
    setTransferMessage(nextText.trim() ? 'Texto de exportacion actualizado.' : 'Todavia no hay sets completos que exportar.')
  }

  function handleImport() {
    try {
      onImportTeamText(transferText)
      setTransferMessage('Equipo importado correctamente.')
    } catch (error) {
      setTransferMessage(error instanceof Error ? error.message : 'No se pudo importar el texto.')
    }
  }

  const visibleSearchPages = buildVisibleSearchPages()

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
              const itemLabel = getItemLabel(activeTeam.slots[index]?.itemSlug)

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
                        <small className={styles.slotMeta}>
                          {movesConfigured}/4 movimientos
                          {itemLabel ? ` | ${itemLabel}` : ''}
                        </small>
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
            <span className={styles.searchInputShell}>
              <input
                id="team-search"
                ref={searchInputRef}
                className={styles.searchInputField}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Busca por nombre, numero o tipo"
              />
              {searchQuery ? (
                <button
                  type="button"
                  className={styles.searchClearButton}
                  onClick={clearSearchQuery}
                  aria-label="Limpiar busqueda"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              ) : null}
            </span>
          </label>

          <p className={styles.helperText}>
            {isPokemonLoading
              ? 'Sincronizando datos del Pokemon activo para editar su build...'
              : 'Haz clic en un resultado para colocarlo en el hueco seleccionado.'}
          </p>

          <div className={styles.searchResults} ref={searchResultsRef}>
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

          <div className={styles.searchFooter}>
            <p className={styles.searchSummary}>
              {searchResultsSummary.total
                ? `Mostrando ${searchResultsSummary.from}-${searchResultsSummary.to} de ${searchResultsSummary.total} Pokemon`
                : '0 Pokemon en esta busqueda'}
            </p>

            {searchResultsSummary.totalPages > 1 ? (
              <nav className={styles.searchPagination} aria-label="Paginacion del buscador del equipo">
                <button
                  type="button"
                  className={styles.searchPaginationButton}
                  onClick={() => handleSearchPageChange(searchPage - 1)}
                  disabled={searchPage <= 1}
                >
                  Anterior
                </button>

                <div className={styles.searchPaginationPages}>
                  {visibleSearchPages.map((page) => (
                    <button
                      key={`search-page-${page}`}
                      type="button"
                      className={[
                        styles.searchPaginationPage,
                        page === searchPage ? styles.searchPaginationPageActive : null,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleSearchPageChange(page)}
                      aria-current={page === searchPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.searchPaginationButton}
                  onClick={() => handleSearchPageChange(searchPage + 1)}
                  disabled={searchPage >= searchResultsSummary.totalPages}
                >
                  Siguiente
                </button>
              </nav>
            ) : null}
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
                  <span>{selectedSlot?.itemSlug ? getItemLabel(selectedSlot.itemSlug) : 'Sin item'}</span>
                  <span>{getNatureSummary(selectedSlot?.natureKey)}</span>
                </div>
              </div>
            </div>

            <p className={styles.buildHelperText}>
              {isMovesLoading
                ? 'Cargando learnset competitivo para este Pokemon...'
                : 'Ahora puedes fijar habilidad, item, naturaleza y moveset base para alimentar el analisis del equipo y el validador.'}
            </p>

            <div className={styles.buildConfigGrid}>
              <div className={styles.configField}>
                <span>Habilidad</span>
                <TeamSelectPicker
                  ariaLabel="Opciones de habilidad"
                  value={selectedAbilitySlug}
                  onChange={onAssignAbilityToSlot}
                  options={abilityPickerOptions}
                  disabled={!selectedAbilityOptions.length && isPokemonLoading}
                  placeholderTitle={isPokemonLoading ? 'Cargando habilidades...' : 'Selecciona una habilidad'}
                  placeholderMeta="La habilidad influye en la validacion del set."
                  searchPlaceholder="Filtra por nombre de habilidad"
                  emptyMessage="No encontramos habilidades que coincidan con ese filtro."
                />
                <small>
                  {selectedAbilityOptions.length
                    ? 'La habilidad seleccionada se validara contra el meta elegido.'
                    : isPokemonLoading
                      ? 'Cargando habilidades disponibles...'
                      : 'Todavia no tenemos habilidades cargadas para este Pokemon.'}
                </small>
              </div>

              <div className={styles.configField}>
                <span>Item</span>
                <TeamSelectPicker
                  ariaLabel="Opciones de item"
                  value={selectedSlot?.itemSlug ?? ''}
                  onChange={onAssignItemToSlot}
                  options={itemPickerOptions}
                  disabled={isItemsLoading}
                  placeholderTitle={isItemsLoading ? 'Cargando items...' : 'Selecciona un item'}
                  placeholderMeta="Prioriza el meta actual y conserva las megapiedras del scope competitivo."
                  searchPlaceholder="Filtra por nombre o categoria"
                  emptyMessage="No encontramos items que coincidan con ese filtro."
                />
                <small>
                  {isItemsLoading
                    ? 'Sincronizando el catalogo de items...'
                    : 'El catalogo prioriza items vistos en el meta actual y mantiene tambien las megapiedras del scope competitivo activo.'}
                </small>
              </div>

              <div className={styles.configField}>
                <span>Naturaleza</span>
                <TeamSelectPicker
                  ariaLabel="Opciones de naturaleza"
                  value={selectedNatureKey}
                  onChange={onAssignNatureToSlot}
                  options={naturePickerOptions}
                  placeholderTitle="Sin naturaleza"
                  placeholderMeta="Ajusta el boost y el drop del set."
                  searchPlaceholder="Filtra por naturaleza o stat"
                  emptyMessage="No encontramos naturalezas que coincidan con ese filtro."
                />
                <small>La naturaleza afecta los totales del radar y la tabla de stats en este mismo panel.</small>
              </div>
            </div>

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
                                {selectedMove.typeKey ? (
                                  <span className={styles.moveTypeChip} style={getMoveTypeStyle(selectedMove.typeKey)}>
                                    {selectedMove.type}
                                  </span>
                                ) : null}
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
                        <span className={styles.moveSelectChevron}>{isPickerOpen ? '^' : 'v'}</span>
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
                                        ? formatMoveMetrics(move).join(' | ')
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
                            : 'Movimiento importado o pendiente de sincronizar en el learnset local.'}
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
            <p>Cuando el hueco activo tenga Pokemon, aqui podras guardar habilidad, item, naturaleza y cuatro movimientos base.</p>
          </div>
        )}

        <section className={styles.transferPanel}>
          <div className={styles.transferHeader}>
            <div>
              <p className={styles.kicker}>Importar y exportar</p>
              <h3>Texto Showdown / Pokepaste</h3>
            </div>

            <div className={styles.transferActions}>
              <button type="button" className={styles.transferButton} onClick={handleGenerateExport}>
                Generar
              </button>
              <button type="button" className={styles.transferButton} onClick={handleCopyExport}>
                Copiar
              </button>
              <button type="button" className={[styles.transferButton, styles.transferButtonPrimary].join(' ')} onClick={handleImport}>
                Importar
              </button>
            </div>
          </div>

          <p className={styles.transferHelper}>
            Pega aqui un equipo en formato Showdown para reemplazar el actual, o genera el texto desde tu build para llevartelo fuera.
          </p>

          <textarea
            className={styles.transferTextarea}
            value={transferText}
            onChange={(event) => setTransferText(event.target.value)}
            placeholder="Dragapult @ Choice Specs&#10;Ability: Infiltrator&#10;Timid Nature&#10;EVs: 4 Def / 252 SpA / 252 Spe&#10;- Draco Meteor&#10;- Shadow Ball"
            spellCheck="false"
          />

          {transferMessage ? <p className={styles.transferMessage}>{transferMessage}</p> : null}
        </section>

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
