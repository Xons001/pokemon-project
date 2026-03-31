import Image from 'next/image'

import styles from './TeamSuggestions.module.css'

const typeAccents = {
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

const lightTypeText = new Set(['normal', 'electric', 'grass', 'ice', 'ground', 'bug', 'steel'])

function formatUsagePercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`
}

function formatShare(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  return `${Math.round(value * 100)}%`
}

function getTypeChipStyle(typeKey) {
  const background = typeAccents[typeKey] ?? '#64748b'

  return {
    backgroundColor: background,
    borderColor: background,
    color: lightTypeText.has(typeKey) ? '#18212f' : '#ffffff',
  }
}

function renderBuildEntry(entry, className) {
  if (!entry) {
    return null
  }

  return (
    <span key={`${className}-${entry.showdownId}`} className={[styles.buildChip, className].filter(Boolean).join(' ')}>
      <strong>{entry.label}</strong>
      {formatShare(entry.share) ? <small>{formatShare(entry.share)}</small> : null}
    </span>
  )
}

export default function TeamSuggestions({
  isSuggestionsLoading,
  onAddPokemon,
  selectedSlotIndex,
  suggestionsError,
  suggestionsResult,
}) {
  const featuredSuggestion = suggestionsResult?.items?.[0] ?? null
  const otherSuggestions = suggestionsResult?.items?.slice(1) ?? []
  const helperMonth = suggestionsResult?.format?.latestMonth

  return (
    <section className={styles.suggestions}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Suggestions</p>
          <h3>Quien completa mejor el equipo</h3>
        </div>
        <span className={styles.statusBadge}>{isSuggestionsLoading ? 'Actualizando...' : `${suggestionsResult?.summary?.suggestionCount ?? 0} picks`}</span>
      </div>

      <p className={styles.helperText}>
        {helperMonth
          ? `Cruza teammates, usage y build meta de ${suggestionsResult.format.name} (${helperMonth}) para proponerte el mejor siguiente pick.`
          : 'Cruza teammates, usage y build meta para proponerte el mejor siguiente pick del equipo.'}
      </p>

      {suggestionsError ? <p className={styles.errorBanner}>{suggestionsError}</p> : null}

      {featuredSuggestion ? (
        <div className={styles.contentStack}>
          <article className={styles.featuredCard}>
            <div className={styles.featuredTop}>
              <div className={styles.featuredIdentity}>
                <span className={styles.featuredThumb}>
                  <Image
                    src={featuredSuggestion.thumb ?? featuredSuggestion.image ?? '/placeholder-pokemon.png'}
                    alt={featuredSuggestion.pokemonName}
                    width={72}
                    height={72}
                    loading="lazy"
                  />
                </span>

                <div className={styles.featuredCopy}>
                  <div className={styles.titleRow}>
                    <strong>{featuredSuggestion.pokemonName}</strong>
                    <span className={styles.scoreBadge}>{featuredSuggestion.fitPercent}%</span>
                  </div>

                  <div className={styles.typeRow}>
                    {featuredSuggestion.types.map((type) => (
                      <span key={`${featuredSuggestion.showdownPokemonId}-${type.key}`} className={styles.typeChip} style={getTypeChipStyle(type.key)}>
                        {type.label}
                      </span>
                    ))}
                    {formatUsagePercent(featuredSuggestion.usagePercent) ? (
                      <span className={styles.metaChip}>Uso {formatUsagePercent(featuredSuggestion.usagePercent)}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.addButton}
                onClick={() => featuredSuggestion.pokemonSlug && onAddPokemon(featuredSuggestion.pokemonSlug)}
                disabled={!featuredSuggestion.pokemonSlug}
              >
                {featuredSuggestion.pokemonSlug ? `Anadir al hueco ${selectedSlotIndex + 1}` : 'Sin slug local'}
              </button>
            </div>

            <div className={styles.reasonList}>
              {featuredSuggestion.reasons.map((reason) => (
                <p key={`${featuredSuggestion.showdownPokemonId}-${reason}`} className={styles.reasonItem}>
                  {reason}
                </p>
              ))}
            </div>

            <div className={styles.featuredMetaGrid}>
              <div className={styles.buildSection}>
                <span className={styles.blockLabel}>Build meta</span>
                <div className={styles.buildWrap}>
                  {featuredSuggestion.recommendedBuild.abilities.map((entry) => renderBuildEntry(entry, styles.buildAbility))}
                  {featuredSuggestion.recommendedBuild.items.map((entry) => renderBuildEntry(entry, styles.buildItem))}
                  {featuredSuggestion.recommendedBuild.teraType ? renderBuildEntry(featuredSuggestion.recommendedBuild.teraType, styles.buildTera) : null}
                  {featuredSuggestion.recommendedBuild.spread ? renderBuildEntry(featuredSuggestion.recommendedBuild.spread, styles.buildSpread) : null}
                </div>
              </div>

              <div className={styles.buildSection}>
                <span className={styles.blockLabel}>Moves frecuentes</span>
                <div className={styles.moveWrap}>
                  {featuredSuggestion.recommendedBuild.moves.map((move) => (
                    <span key={`${featuredSuggestion.showdownPokemonId}-${move.showdownId}`} className={styles.moveChip}>
                      <strong>{move.label}</strong>
                      {move.typeLabel ? (
                        <small className={styles.moveType} style={move.typeKey ? getTypeChipStyle(move.typeKey) : undefined}>
                          {move.typeLabel}
                        </small>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {otherSuggestions.length ? (
            <div className={styles.ranking}>
              <div className={styles.rankingHeader}>
                <h4>Otros picks fuertes</h4>
                <span>{otherSuggestions.length}</span>
              </div>

              <div className={styles.rankingList}>
                {otherSuggestions.map((suggestion) => (
                  <article key={suggestion.showdownPokemonId} className={styles.rankingCard}>
                    <div className={styles.rankingMain}>
                      <span className={styles.rankingThumb}>
                        <Image
                          src={suggestion.thumb ?? suggestion.image ?? '/placeholder-pokemon.png'}
                          alt={suggestion.pokemonName}
                          width={48}
                          height={48}
                          loading="lazy"
                        />
                      </span>

                      <div className={styles.rankingCopy}>
                        <div className={styles.titleRow}>
                          <strong>{suggestion.pokemonName}</strong>
                          <span className={styles.scoreBadgeSmall}>{suggestion.fitPercent}%</span>
                        </div>

                        <div className={styles.typeRow}>
                          {suggestion.types.map((type) => (
                            <span key={`${suggestion.showdownPokemonId}-${type.key}`} className={styles.typeChipSmall} style={getTypeChipStyle(type.key)}>
                              {type.label}
                            </span>
                          ))}
                        </div>

                        <p className={styles.rankingReason}>{suggestion.reasons[0]}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={styles.inlineAddButton}
                      onClick={() => suggestion.pokemonSlug && onAddPokemon(suggestion.pokemonSlug)}
                      disabled={!suggestion.pokemonSlug}
                    >
                      Anadir
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.contentStack}>
          <div className={styles.emptyState}>
            <strong>{isSuggestionsLoading ? 'Calculando sugerencias...' : 'Completa al menos un Pokemon del equipo'}</strong>
            <p>
              Cuando haya base suficiente, aqui veras el pick con mejor encaje competitivo segun tus miembros actuales,
              sus builds y el meta activo.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
