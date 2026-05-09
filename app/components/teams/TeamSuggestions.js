import { useI18n } from '../i18n/LanguageProvider'
import { FALLBACK_POKEMON_IMAGE } from '../../lib/pokemon'
import { getNatureLabel, normalizeNatureKey } from '../../lib/team-builder'
import PokemonImage from './PokemonImage'
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

function formatUsageEntryPercent(entry) {
  if (typeof entry?.value === 'number' && entry.value >= 0 && entry.value <= 1) {
    return formatUsagePercent(entry.value)
  }

  return formatShare(entry?.share)
}

function formatDisplayName(entry, isSpanish) {
  if (!entry) {
    return ''
  }

  if (isSpanish && entry.localizedLabel && entry.localizedLabel !== entry.label) {
    return `${entry.localizedLabel} (${entry.label})`
  }

  return entry.label
}

function formatBuildEntryName(entry, isSpanish) {
  if (!entry) {
    return ''
  }

  if (isSpanish) {
    const [firstToken, ...rest] = String(entry.label ?? '').split(' ')
    const natureKey = normalizeNatureKey(firstToken)

    if (natureKey && rest.some((token) => /[0-9/]/.test(token))) {
      return [getNatureLabel(natureKey, 'es'), ...rest].join(' ')
    }
  }

  return formatDisplayName(entry, isSpanish)
}

function getTypeChipStyle(typeKey) {
  const background = typeAccents[typeKey] ?? '#64748b'

  return {
    backgroundColor: background,
    borderColor: background,
    color: lightTypeText.has(typeKey) ? '#18212f' : '#ffffff',
  }
}

function renderBuildEntry(entry, className, isSpanish) {
  if (!entry) {
    return null
  }

  return (
    <span key={`${className}-${entry.showdownId}`} className={[styles.buildChip, className].filter(Boolean).join(' ')}>
      <strong>{formatBuildEntryName(entry, isSpanish)}</strong>
      {formatUsageEntryPercent(entry) ? <small>{formatUsageEntryPercent(entry)}</small> : null}
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
  const { t, isSpanish } = useI18n()
  const featuredSuggestion = suggestionsResult?.items?.[0] ?? null
  const otherSuggestions = suggestionsResult?.items?.slice(1) ?? []
  const helperMonth = suggestionsResult?.format?.latestMonth

  return (
    <section className={styles.suggestions}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>{t('team.suggestions.kicker')}</p>
          <h3>{t('team.suggestions.title')}</h3>
        </div>
        <span className={styles.statusBadge}>
          {isSuggestionsLoading ? t('team.suggestions.updating') : t('team.suggestions.picks', { count: suggestionsResult?.summary?.suggestionCount ?? 0 })}
        </span>
      </div>

      <p className={styles.helperText}>
        {helperMonth
          ? t('team.suggestions.helperWithMonth', { format: suggestionsResult.format.name, month: helperMonth })
          : t('team.suggestions.helperWithoutMonth')}
      </p>

      {suggestionsError ? <p className={styles.errorBanner}>{suggestionsError}</p> : null}

      {featuredSuggestion ? (
        <div className={styles.contentStack}>
          <article className={styles.featuredCard}>
            <div className={styles.featuredTop}>
              <div className={styles.featuredIdentity}>
                <span className={styles.featuredThumb}>
                  <PokemonImage
                    src={featuredSuggestion.thumb ?? featuredSuggestion.image ?? FALLBACK_POKEMON_IMAGE}
                    alt={featuredSuggestion.pokemonName}
                    width={72}
                    height={72}
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
                      <span className={styles.metaChip}>{t('team.suggestions.usage', { value: formatUsagePercent(featuredSuggestion.usagePercent) })}</span>
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
                {featuredSuggestion.pokemonSlug
                  ? t('team.suggestions.addToSlot', { index: selectedSlotIndex + 1 })
                  : t('team.suggestions.noLocalSlug')}
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
                <span className={styles.blockLabel}>{t('team.suggestions.buildMeta')}</span>
                <div className={styles.buildWrap}>
                  {featuredSuggestion.recommendedBuild.abilities.map((entry) => renderBuildEntry(entry, styles.buildAbility, isSpanish))}
                  {featuredSuggestion.recommendedBuild.items.map((entry) => renderBuildEntry(entry, styles.buildItem, isSpanish))}
                  {featuredSuggestion.recommendedBuild.teraType ? renderBuildEntry(featuredSuggestion.recommendedBuild.teraType, styles.buildTera, isSpanish) : null}
                  {featuredSuggestion.recommendedBuild.spread ? renderBuildEntry(featuredSuggestion.recommendedBuild.spread, styles.buildSpread, isSpanish) : null}
                </div>
              </div>

              <div className={styles.buildSection}>
                <span className={styles.blockLabel}>{t('team.suggestions.frequentMoves')}</span>
                <div className={styles.moveWrap}>
                  {featuredSuggestion.recommendedBuild.moves.map((move) => (
                    <span key={`${featuredSuggestion.showdownPokemonId}-${move.showdownId}`} className={styles.moveChip}>
                      <strong>{formatDisplayName(move, isSpanish)}</strong>
                      {formatUsageEntryPercent(move) ? <small>{formatUsageEntryPercent(move)}</small> : null}
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
                <h4>{t('team.suggestions.otherStrongPicks')}</h4>
                <span>{otherSuggestions.length}</span>
              </div>

              <div className={styles.rankingList}>
                {otherSuggestions.map((suggestion) => (
                  <article key={suggestion.showdownPokemonId} className={styles.rankingCard}>
                    <div className={styles.rankingMain}>
                      <span className={styles.rankingThumb}>
                        <PokemonImage
                          src={suggestion.thumb ?? suggestion.image ?? FALLBACK_POKEMON_IMAGE}
                          alt={suggestion.pokemonName}
                          width={48}
                          height={48}
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
                      {t('team.suggestions.add')}
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
            <strong>{isSuggestionsLoading ? t('team.suggestions.calculating') : t('team.suggestions.emptyTitle')}</strong>
            <p>{t('team.suggestions.emptyDescription')}</p>
          </div>
        </div>
      )}
    </section>
  )
}
