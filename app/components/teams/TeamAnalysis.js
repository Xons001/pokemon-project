import { getBalanceLabel } from '../../lib/team-builder'
import { getPalette } from '../../lib/pokemon'
import styles from './TeamAnalysis.module.css'

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

function formatMultiplier(multiplier) {
  if (multiplier === null || multiplier === undefined) {
    return '--'
  }

  if (multiplier === 0.25) {
    return 'x1/4'
  }

  if (multiplier === 0.5) {
    return 'x1/2'
  }

  if (multiplier === 0) {
    return 'x0'
  }

  if (Number.isInteger(multiplier)) {
    return `x${multiplier}`
  }

  return `x${multiplier}`
}

function getMultiplierClass(multiplier) {
  if (multiplier === null || multiplier === undefined) {
    return styles.cellEmpty
  }

  if (multiplier === 0) {
    return styles.cellImmune
  }

  if (multiplier >= 4) {
    return styles.cellRiskHeavy
  }

  if (multiplier > 1) {
    return styles.cellRisk
  }

  if (multiplier <= 0.25) {
    return styles.cellSafeHeavy
  }

  if (multiplier < 1) {
    return styles.cellSafe
  }

  return styles.cellNeutral
}

function getTypeChipStyle(typeKey) {
  const palette = getPalette(typeKey)

  return {
    '--type-accent': paletteAccents[palette] ?? paletteAccents.neutral,
  }
}

function formatWeaknessChip(entry) {
  if (entry.maxMultiplier >= 4) {
    return `${entry.label} x4`
  }

  return `${entry.label} x2`
}

function formatResistanceChip(entry) {
  if (entry.immuneCount) {
    return `${entry.label} x0`
  }

  const strongestSafeMultiplier = entry.multipliers.length ? Math.min(...entry.multipliers.filter((value) => value < 1)) : 0.5

  return strongestSafeMultiplier <= 0.25 ? `${entry.label} x1/4` : `${entry.label} x1/2`
}

function summarizePokemonMatchups(multipliers) {
  const valid = multipliers.filter((value) => typeof value === 'number')
  const weakCount = valid.filter((value) => value > 1).length
  const resistCount = valid.filter((value) => value > 0 && value < 1).length
  const immuneCount = valid.filter((value) => value === 0).length

  if (!valid.length) {
    return {
      label: 'Sin datos',
      className: styles.verdictNeutral,
      weakCount,
      resistCount,
      immuneCount,
    }
  }

  if (valid.some((value) => value >= 4) || weakCount >= 6) {
    return {
      label: 'Muy expuesto',
      className: styles.verdictRiskHeavy,
      weakCount,
      resistCount,
      immuneCount,
    }
  }

  if (weakCount > resistCount + immuneCount) {
    return {
      label: 'En riesgo',
      className: styles.verdictRisk,
      weakCount,
      resistCount,
      immuneCount,
    }
  }

  if (immuneCount > 0 || resistCount > weakCount) {
    return {
      label: 'Bien cubierto',
      className: styles.verdictSafe,
      weakCount,
      resistCount,
      immuneCount,
    }
  }

  return {
    label: 'Equilibrado',
    className: styles.verdictNeutral,
    weakCount,
    resistCount,
    immuneCount,
  }
}

function getTeamTypeVerdict(entry) {
  if (entry.superWeakCount >= 2 || (entry.superWeakCount >= 1 && entry.weakCount >= 3)) {
    return {
      label: 'Muy expuesto',
      className: styles.verdictRiskHeavy,
    }
  }

  if (entry.weakCount > entry.resistCount + entry.immuneCount) {
    return {
      label: 'En riesgo',
      className: styles.verdictRisk,
    }
  }

  if (entry.immuneCount > 0 || entry.resistCount > entry.weakCount) {
    return {
      label: 'Bien cubierto',
      className: styles.verdictSafe,
    }
  }

  return {
    label: 'Equilibrado',
    className: styles.verdictNeutral,
  }
}

export default function TeamAnalysis({
  isTypeChartLoading,
  teamMembers,
  teamSummary,
  typeAnalysis,
  typeChartReady,
}) {
  const hasReadyAnalysis = typeChartReady && teamSummary.readyMembers > 0
  const hasSelectedMembers = teamSummary.filledSlots > 0
  const leadingWeaknesses = teamSummary.weaknesses.slice(0, 4)
  const leadingResistances = teamSummary.resistances.slice(0, 4)
  const readyTeamMembers = teamMembers.filter(Boolean)
  const longestPokemonNameLength = readyTeamMembers.reduce((maximum, pokemon) => {
    return Math.max(maximum, pokemon.name.length)
  }, 'Pokemon'.length)
  const pokemonProfiles = readyTeamMembers.map((pokemon, rowIndex) => {
    const rowMultipliers = typeAnalysis.map((entry) => entry.slotMultipliers[rowIndex] ?? null)

    return {
      pokemon,
      summary: summarizePokemonMatchups(rowMultipliers),
    }
  })
  const matrixStyle = {
    '--matrix-first-column': 'clamp(7.5rem, 9vw, 8.75rem)',
    '--matrix-pokemon-column': `clamp(10.25rem, ${Math.max(13, Math.min(Math.ceil(longestPokemonNameLength * 0.92), 24))}ch, 14rem)`,
    '--matrix-summary-column': 'clamp(8.5rem, 10vw, 10rem)',
  }

  return (
    <section className={styles.analysis} id="analisis">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Analisis del equipo</p>
          <h3>Compatibilidad y quimica</h3>
        </div>
        <span className={styles.statusBadge}>
          {isTypeChartLoading ? 'Calculando...' : typeChartReady ? 'Tipos listos' : 'Pendiente'}
        </span>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Slots ocupados</span>
          <strong>{teamSummary.filledSlots}/6</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Balance</span>
          <strong>{getBalanceLabel(teamSummary.balanceScore)}</strong>
        </div>
      </div>

      <section className={styles.block}>
        <div className={styles.blockHeading}>
          <h4>Lectura rapida</h4>
          <span>{hasReadyAnalysis ? 'Activa' : 'Vacia'}</span>
        </div>

        <div className={styles.highlightGrid}>
          <article className={styles.highlightPanel}>
            <div className={styles.panelHeading}>
              <h5>Tipos mas peligrosos</h5>
              <span>{leadingWeaknesses.length}</span>
            </div>

            {hasReadyAnalysis && leadingWeaknesses.length ? (
              <div className={styles.chipWrap}>
                {leadingWeaknesses.map((entry) => (
                  <span key={entry.type} className={[styles.statChip, styles.chipRisk].join(' ')}>
                    {formatWeaknessChip(entry)}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.emptyMessage}>
                {hasSelectedMembers
                  ? 'Estamos sincronizando a tu equipo para detectar las amenazas reales.'
                  : 'Completa al menos un Pokemon para detectar las amenazas reales del equipo.'}
              </p>
            )}
          </article>

          <article className={styles.highlightPanel}>
            <div className={styles.panelHeading}>
              <h5>Mejores coberturas</h5>
              <span>{leadingResistances.length}</span>
            </div>

            {hasReadyAnalysis && leadingResistances.length ? (
              <div className={styles.chipWrap}>
                {leadingResistances.map((entry) => (
                  <span key={entry.type} className={[styles.statChip, styles.chipSafe].join(' ')}>
                    {formatResistanceChip(entry)}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.emptyMessage}>
                {hasSelectedMembers
                  ? 'Cuando termine la sincronizacion veras aqui las resistencias clave del equipo.'
                  : 'Cuando carguen tipos y miembros, aqui veras las resistencias clave del equipo.'}
              </p>
            )}
          </article>
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeading}>
          <h4>Tabla de compatibilidad</h4>
          <span>{typeAnalysis.length}</span>
        </div>

        {hasReadyAnalysis ? (
          <>
            <div className={styles.legend}>
              <span className={styles.legendLabel}>Leyenda</span>
              <div className={styles.legendList}>
                <span className={[styles.legendItem, styles.legendRiskHeavy].join(' ')}>x4</span>
                <span className={[styles.legendItem, styles.legendRisk].join(' ')}>x2</span>
                <span className={[styles.legendItem, styles.legendNeutral].join(' ')}>x1</span>
                <span className={[styles.legendItem, styles.legendSafe].join(' ')}>x1/2</span>
                <span className={[styles.legendItem, styles.legendSafeHeavy].join(' ')}>x1/4</span>
                <span className={[styles.legendItem, styles.legendImmune].join(' ')}>x0</span>
              </div>
            </div>

            <div className={styles.tableWrap} style={matrixStyle}>
              <table className={styles.matrixTable}>
                <thead>
                  <tr>
                    <th className={styles.axisHeader} scope="col">
                      Tipos
                    </th>

                    {readyTeamMembers.map((pokemon) => (
                      <th key={`pokemon-header-${pokemon.slug}`} className={styles.pokemonColumnHeader} scope="col">
                        <div className={styles.pokemonColumnCard}>
                          <strong title={pokemon.name}>{pokemon.name}</strong>
                          <div className={styles.typeChipGroup}>
                            {pokemon.typeKeys.map((typeKey, typeIndex) => (
                              <span key={`${pokemon.slug}-${typeKey}-${typeIndex}`} className={styles.typeChip} style={getTypeChipStyle(typeKey)}>
                                {pokemon.types[typeIndex]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </th>
                    ))}

                    <th className={styles.summaryHeader} scope="col">
                      Equipo
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {typeAnalysis.map((entry) => {
                    const verdict = getTeamTypeVerdict(entry)

                    return (
                      <tr key={entry.type}>
                        <th scope="row" className={styles.typeRowHeader}>
                          <div className={styles.typeRowCard}>
                            <span className={styles.typeHeaderBadge} style={getTypeChipStyle(entry.type)}>
                              {entry.label}
                            </span>
                          </div>
                        </th>

                        {readyTeamMembers.map((pokemon, index) => (
                          <td key={`${entry.type}-${pokemon.slug}`} className={styles.matrixCell}>
                            <span className={[styles.matchupBadge, getMultiplierClass(entry.slotMultipliers[index] ?? null)].join(' ')}>
                              {formatMultiplier(entry.slotMultipliers[index] ?? null)}
                            </span>
                          </td>
                        ))}

                        <td className={styles.overviewCell}>
                          <div className={styles.overviewStack}>
                            <span className={[styles.verdictBadge, verdict.className].join(' ')}>
                              {verdict.label}
                            </span>
                            <div className={styles.overviewList}>
                              <span>{entry.weakCount} debiles</span>
                              <span>{entry.resistCount} resisten</span>
                              <span>{entry.immuneCount} inmunes</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                <tfoot>
                  <tr>
                    <th className={styles.teamFooterLabel} scope="row">
                      Perfil
                    </th>

                    {pokemonProfiles.map(({ pokemon, summary }) => (
                      <td key={`profile-${pokemon.slug}`} className={styles.footerCell}>
                        <div className={styles.overviewStack}>
                          <span className={[styles.verdictBadge, summary.className].join(' ')}>
                            {summary.label}
                          </span>
                          <div className={styles.overviewList}>
                            <span>{summary.weakCount} debiles</span>
                            <span>{summary.resistCount} resisten</span>
                            <span>{summary.immuneCount} inmunes</span>
                          </div>
                        </div>
                      </td>
                    ))}

                    <td className={styles.footerCell}>
                      <div className={styles.overviewStack}>
                        <span className={[styles.verdictBadge, styles.verdictNeutral].join(' ')}>
                          {getBalanceLabel(teamSummary.balanceScore)}
                        </span>
                        <div className={styles.overviewList}>
                          <span>{teamSummary.weaknesses.length} riesgos</span>
                          <span>{teamSummary.resistances.length} coberturas</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <p className={styles.emptyMessage}>
            {!typeChartReady
              ? 'Cargando la tabla de tipos para calcular las relaciones reales del equipo.'
              : hasSelectedMembers
                ? 'Sincronizando los Pokemon del equipo para rellenar la tabla de compatibilidades.'
                : 'Anade Pokemon al equipo para rellenar la tabla de compatibilidades.'}
          </p>
        )}
      </section>
    </section>
  )
}
