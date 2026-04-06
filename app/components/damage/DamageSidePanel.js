'use client'

import Image from 'next/image'

import { useI18n } from '../i18n/LanguageProvider'
import TeamSelectPicker from '../teams/TeamSelectPicker'
import {
  DAMAGE_BOOST_OPTIONS,
  DAMAGE_STAT_CONFIG,
  getDamageStatusOptions,
  DAMAGE_TERA_TYPE_KEYS,
} from '../../lib/damage-calculator'
import { calculateBattleStat, getTeamNatures } from '../../lib/team-builder'
import { formatResourceName, translateType } from '../../lib/pokemon'
import styles from './DamageCalculatorPage.module.css'

function formatBoostLabel(value) {
  if (!value) {
    return '0'
  }

  return value > 0 ? `+${value}` : String(value)
}

function toNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function buildTeraOptions(locale) {
  return DAMAGE_TERA_TYPE_KEYS.map((typeKey) => ({
    value: typeKey,
    label: translateType(typeKey, locale),
    meta: 'Tera',
    keywords: [typeKey],
  }))
}

export default function DamageSidePanel({
  sideKey,
  sideState,
  pokemon,
  detail,
  moveCatalog,
  pokemonOptions,
  itemOptions,
  onSetPokemon,
  onSetValue,
  onSetMove,
  onSetStat,
  selectedMove,
}) {
  const { locale, t } = useI18n()
  const sidePanelCopy = t('damagePage.sidePanel')
  const workspaceCopy = t('team.workspace')
  const abilityPickerCopy = t('team.workspace.abilityPicker')
  const itemPickerCopy = t('team.workspace.itemPicker')
  const naturePickerCopy = t('team.workspace.naturePicker')
  const sideLabels = {
    attacker: t('damagePage.attacker'),
    defender: t('damagePage.defender'),
  }
  const teraOptions = buildTeraOptions(locale)
  const natureOptions = getTeamNatures(locale).map((nature) => ({
    value: nature.key,
    label: nature.label,
    meta: nature.summary.replace(`${nature.label} `, '').replace(/^\(|\)$/g, '') || workspaceCopy.neutralNature,
    keywords: [nature.summary],
  }))
  const statusOptions = getDamageStatusOptions(locale)
  const abilityOptions = (detail?.abilities ?? []).map((ability) => ({
    value: ability.slug,
    label: ability.label,
    meta: ability.isHidden ? workspaceCopy.hiddenAbilityLabel : workspaceCopy.baseAbilityLabel,
    keywords: [ability.slug],
  }))
  const moveOptions = moveCatalog.map((move) => ({
    value: move.moveSlug,
    label: move.move,
    meta: [move.type, move.category, move.power ? `Pow ${move.power}` : null].filter(Boolean).join(' | '),
    keywords: [move.moveSlug, move.type, move.category, ...(move.learnMethods ?? [])].filter(Boolean),
  }))
  const selectedMoveLookup = new Map(selectedMove.map((entry) => [entry.slot, entry]))
  const statRows = DAMAGE_STAT_CONFIG.map((stat) => {
    const base = toNumber(pokemon?.[stat.key], 0)
    const ev = toNumber(sideState.evs?.[stat.key], 0)
    const iv = toNumber(sideState.ivs?.[stat.key], stat.key === 'hp' ? 31 : 31)

    return {
      ...stat,
      base,
      ev,
      iv,
      total: calculateBattleStat({
        base,
        ev,
        iv,
        statKey: stat.key,
        natureKey: sideState.natureKey,
        level: sideState.level,
      }),
      boost: stat.key === 'hp' ? null : toNumber(sideState.boosts?.[stat.key], 0),
    }
  })

  return (
    <section className={styles.sidePanel}>
      <div className={styles.sideHeader}>
        <div>
          <p className={styles.kicker}>{sideLabels[sideKey]}</p>
          <h3>{pokemon?.name ?? sidePanelCopy.selectPokemon}</h3>
        </div>

        {pokemon ? (
          <div className={styles.sideVisual}>
            <Image src={pokemon.thumb} alt={pokemon.name} width={88} height={88} loading="lazy" />
          </div>
        ) : null}
      </div>

      <div className={styles.sideIdentity}>
        <div className={styles.configField}>
          <span>{sidePanelCopy.pokemon}</span>
          <TeamSelectPicker
            ariaLabel={`${sidePanelCopy.pokemon} ${sideLabels[sideKey]}`}
            value={sideState.pokemonSlug}
            onChange={(value) => onSetPokemon(sideKey, value)}
            options={pokemonOptions}
            placeholderTitle={sidePanelCopy.selectPokemon}
            placeholderMeta={sidePanelCopy.pokemonCatalogMeta}
            searchPlaceholder={sidePanelCopy.pokemonSearchPlaceholder}
            emptyMessage={sidePanelCopy.pokemonEmptyMessage}
          />
        </div>

        <div className={styles.identitySummary}>
          {pokemon ? (
            <>
              <div className={styles.identityTypes}>
                {pokemon.types.map((typeLabel) => (
                  <span key={`${pokemon.slug}-${typeLabel}`} className={styles.typeChip}>
                    {typeLabel}
                  </span>
                ))}
              </div>
              <p>{detail?.description ?? pokemon.description}</p>
            </>
          ) : (
            <p>{sidePanelCopy.emptyPokemonHint}</p>
          )}
        </div>
      </div>

      <div className={styles.sideConfigGrid}>
        <div className={styles.configField}>
          <span>{sidePanelCopy.ability}</span>
          <TeamSelectPicker
            ariaLabel={`${sidePanelCopy.ability} ${sideLabels[sideKey]}`}
            value={sideState.abilitySlug}
            onChange={(value) => onSetValue(sideKey, 'abilitySlug', value)}
            options={abilityOptions}
            placeholderTitle={abilityPickerCopy.selectTitle}
            placeholderMeta={abilityPickerCopy.placeholderMeta}
            searchPlaceholder={abilityPickerCopy.searchPlaceholder}
            emptyMessage={abilityPickerCopy.emptyHelp}
          />
        </div>

        <div className={styles.configField}>
          <span>{sidePanelCopy.item}</span>
          <TeamSelectPicker
            ariaLabel={`${sidePanelCopy.item} ${sideLabels[sideKey]}`}
            value={sideState.itemSlug}
            onChange={(value) => onSetValue(sideKey, 'itemSlug', value)}
            options={itemOptions}
            placeholderTitle={itemPickerCopy.selectTitle}
            placeholderMeta={itemPickerCopy.placeholderMeta}
            searchPlaceholder={itemPickerCopy.searchPlaceholder}
            emptyMessage={itemPickerCopy.emptyMessage}
          />
        </div>

        <div className={styles.configField}>
          <span>{sidePanelCopy.nature}</span>
          <TeamSelectPicker
            ariaLabel={`${sidePanelCopy.nature} ${sideLabels[sideKey]}`}
            value={sideState.natureKey}
            onChange={(value) => onSetValue(sideKey, 'natureKey', value)}
            options={natureOptions}
            placeholderTitle={naturePickerCopy.placeholderTitle}
            placeholderMeta={naturePickerCopy.placeholderMeta}
            searchPlaceholder={naturePickerCopy.searchPlaceholder}
            emptyMessage={naturePickerCopy.emptyMessage}
          />
        </div>

        <div className={styles.configField}>
          <span>{sidePanelCopy.teraType}</span>
          <TeamSelectPicker
            ariaLabel={`${sidePanelCopy.teraType} ${sideLabels[sideKey]}`}
            value={sideState.teraType}
            onChange={(value) => onSetValue(sideKey, 'teraType', value)}
            options={teraOptions}
            placeholderTitle={sidePanelCopy.noTeraType}
            placeholderMeta={sidePanelCopy.optional}
            searchPlaceholder={workspaceCopy.searchPlaceholder}
            emptyMessage={sidePanelCopy.pokemonEmptyMessage}
          />
        </div>
      </div>

      <div className={styles.supportRow}>
        <div className={styles.configField}>
          <span>{sidePanelCopy.status}</span>
          <TeamSelectPicker
            ariaLabel={`${sidePanelCopy.status} ${sideLabels[sideKey]}`}
            value={sideState.status}
            onChange={(value) => onSetValue(sideKey, 'status', value)}
            options={statusOptions}
            placeholderTitle={statusOptions[0]?.label ?? ''}
            placeholderMeta={statusOptions[0]?.meta ?? ''}
            searchPlaceholder={workspaceCopy.searchPlaceholder}
            emptyMessage={sidePanelCopy.pokemonEmptyMessage}
          />
        </div>

        <label className={styles.numberField}>
          <span>{sidePanelCopy.level}</span>
          <input
            type="number"
            min="1"
            max="100"
            value={sideState.level}
            onChange={(event) => onSetValue(sideKey, 'level', Number(event.target.value))}
          />
        </label>

        <div className={styles.hpField}>
          <div className={styles.hpHeader}>
            <span>{sidePanelCopy.currentHp}</span>
            <strong>{sideState.currentHpPercent}%</strong>
          </div>
          <input
            className={styles.hpSlider}
            type="range"
            min="1"
            max="100"
            value={sideState.currentHpPercent}
            onChange={(event) => onSetValue(sideKey, 'currentHpPercent', Number(event.target.value))}
          />
        </div>
      </div>

      <div className={styles.moveConfigGrid}>
        {sideState.moveSlugs.map((moveSlug, slot) => {
          const moveResult = selectedMoveLookup.get(slot)
          const isSelected = moveResult && moveResult.slot === slot

          return (
            <article
              key={`${sideKey}-move-${slot}`}
              className={[styles.moveCard, isSelected ? styles.moveCardSelected : null].filter(Boolean).join(' ')}
            >
              <div className={styles.moveCardHeader}>
                <span>{t('damagePage.sidePanel.move', { index: slot + 1 })}</span>
                {moveResult ? (
                  <span className={styles.moveRangePill}>{moveResult.minPercent}% - {moveResult.maxPercent}%</span>
                ) : null}
              </div>

              <TeamSelectPicker
                ariaLabel={`${t('damagePage.sidePanel.move', { index: slot + 1 })} ${sideLabels[sideKey]}`}
                value={moveSlug}
                onChange={(value) => onSetMove(sideKey, slot, value)}
                options={moveOptions}
                placeholderTitle={workspaceCopy.move.selectTitle}
                placeholderMeta="Learnset local"
                searchPlaceholder={workspaceCopy.move.searchPlaceholder}
                emptyMessage={workspaceCopy.move.noResults}
              />

              <small className={styles.moveHint}>
                {moveResult
                  ? `${moveResult.rangeLabel}${moveResult.koText ? ` | ${moveResult.koText}` : ''}`
                  : moveSlug
                    ? t('damagePage.sidePanel.loadedMove', { move: formatResourceName(moveSlug) })
                    : sidePanelCopy.chooseMoves}
              </small>
            </article>
          )
        })}
      </div>

      <div className={styles.statsTable}>
        <div className={styles.statsHead}>
          <span>{sidePanelCopy.stats.stat}</span>
          <span>{sidePanelCopy.stats.base}</span>
          <span>{sidePanelCopy.stats.ev}</span>
          <span>{sidePanelCopy.stats.iv}</span>
          <span>{sidePanelCopy.stats.total}</span>
          <span>{sidePanelCopy.stats.boost}</span>
        </div>

        {statRows.map((stat) => (
          <div key={`${sideKey}-${stat.key}`} className={styles.statRow}>
            <span className={styles.statKey}>{stat.label}</span>
            <span>{stat.base}</span>
            <input
              className={styles.statInput}
              type="number"
              min="0"
              max="252"
              step="4"
              value={stat.ev}
              onChange={(event) => onSetStat(sideKey, 'evs', stat.key, Number(event.target.value))}
            />
            <input
              className={styles.statInput}
              type="number"
              min="0"
              max="31"
              step="1"
              value={stat.iv}
              onChange={(event) => onSetStat(sideKey, 'ivs', stat.key, Number(event.target.value))}
            />
            <strong>{stat.total}</strong>
            {stat.boost === null ? (
              <span className={styles.boostPlaceholder}>-</span>
            ) : (
              <select
                className={styles.boostSelect}
                value={stat.boost}
                onChange={(event) => onSetStat(sideKey, 'boosts', stat.key, Number(event.target.value))}
              >
                {DAMAGE_BOOST_OPTIONS.map((boostValue) => (
                  <option key={`${sideKey}-${stat.key}-${boostValue}`} value={boostValue}>
                    {formatBoostLabel(boostValue)}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
