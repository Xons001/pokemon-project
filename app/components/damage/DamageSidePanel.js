'use client'

import Image from 'next/image'

import TeamSelectPicker from '../teams/TeamSelectPicker'
import {
  DAMAGE_BOOSTABLE_STAT_CONFIG,
  DAMAGE_BOOST_OPTIONS,
  DAMAGE_STAT_CONFIG,
  DAMAGE_STATUS_OPTIONS,
  DAMAGE_TERA_TYPE_KEYS,
} from '../../lib/damage-calculator'
import { TEAM_NATURES, calculateBattleStat } from '../../lib/team-builder'
import { formatResourceName, translateType } from '../../lib/pokemon'
import styles from './DamageCalculatorPage.module.css'

const sideLabels = {
  attacker: 'Atacante',
  defender: 'Defensor',
}

function formatBoostLabel(value) {
  if (!value) {
    return '0'
  }

  return value > 0 ? `+${value}` : String(value)
}

function toNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

function buildTeraOptions() {
  return DAMAGE_TERA_TYPE_KEYS.map((typeKey) => ({
    value: typeKey,
    label: translateType(typeKey),
    meta: 'Tera',
    keywords: [typeKey],
  }))
}

const teraOptions = buildTeraOptions()
const natureOptions = TEAM_NATURES.map((nature) => ({
  value: nature.key,
  label: nature.label,
  meta: nature.summary.replace(`${nature.label} `, '').replace(/^\(|\)$/g, '') || 'Neutral',
  keywords: [nature.summary],
}))

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
  const abilityOptions = (detail?.abilities ?? []).map((ability) => ({
    value: ability.slug,
    label: ability.label,
    meta: ability.isHidden ? 'Oculta' : 'Base',
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
          <h3>{pokemon?.name ?? 'Selecciona un Pokemon'}</h3>
        </div>

        {pokemon ? (
          <div className={styles.sideVisual}>
            <Image src={pokemon.thumb} alt={pokemon.name} width={88} height={88} loading="lazy" />
          </div>
        ) : null}
      </div>

      <div className={styles.sideIdentity}>
        <div className={styles.configField}>
          <span>Pokemon</span>
          <TeamSelectPicker
            ariaLabel={`Pokemon ${sideLabels[sideKey]}`}
            value={sideState.pokemonSlug}
            onChange={(value) => onSetPokemon(sideKey, value)}
            options={pokemonOptions}
            placeholderTitle="Selecciona un Pokemon"
            placeholderMeta="Catalogo competitivo local"
            searchPlaceholder="Busca por nombre, tipo o habilidad"
            emptyMessage="No hemos encontrado Pokemon para ese filtro."
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
            <p>Elige un Pokemon para cargar sus habilidades, learnset y stats base en la calculadora.</p>
          )}
        </div>
      </div>

      <div className={styles.sideConfigGrid}>
        <div className={styles.configField}>
          <span>Habilidad</span>
          <TeamSelectPicker
            ariaLabel={`Habilidad ${sideLabels[sideKey]}`}
            value={sideState.abilitySlug}
            onChange={(value) => onSetValue(sideKey, 'abilitySlug', value)}
            options={abilityOptions}
            placeholderTitle="Selecciona una habilidad"
            placeholderMeta="Se cargan desde la ficha local"
            searchPlaceholder="Filtra habilidades"
            emptyMessage="Este Pokemon no tiene habilidades cargadas todavia."
          />
        </div>

        <div className={styles.configField}>
          <span>Item</span>
          <TeamSelectPicker
            ariaLabel={`Item ${sideLabels[sideKey]}`}
            value={sideState.itemSlug}
            onChange={(value) => onSetValue(sideKey, 'itemSlug', value)}
            options={itemOptions}
            placeholderTitle="Selecciona un item"
            placeholderMeta="Scope competitivo activo"
            searchPlaceholder="Filtra items"
            emptyMessage="No hay items para este scope."
          />
        </div>

        <div className={styles.configField}>
          <span>Naturaleza</span>
          <TeamSelectPicker
            ariaLabel={`Naturaleza ${sideLabels[sideKey]}`}
            value={sideState.natureKey}
            onChange={(value) => onSetValue(sideKey, 'natureKey', value)}
            options={natureOptions}
            placeholderTitle="Sin naturaleza"
            placeholderMeta="Modifica los totales"
            searchPlaceholder="Filtra por naturaleza o stat"
            emptyMessage="No encontramos naturalezas para ese filtro."
          />
        </div>

        <div className={styles.configField}>
          <span>Teratipo</span>
          <TeamSelectPicker
            ariaLabel={`Teratipo ${sideLabels[sideKey]}`}
            value={sideState.teraType}
            onChange={(value) => onSetValue(sideKey, 'teraType', value)}
            options={teraOptions}
            placeholderTitle="Sin teratipo"
            placeholderMeta="Opcional"
            searchPlaceholder="Filtra por tipo"
            emptyMessage="No encontramos ese tipo."
          />
        </div>
      </div>

      <div className={styles.supportRow}>
        <div className={styles.configField}>
          <span>Estado</span>
          <TeamSelectPicker
            ariaLabel={`Estado ${sideLabels[sideKey]}`}
            value={sideState.status}
            onChange={(value) => onSetValue(sideKey, 'status', value)}
            options={DAMAGE_STATUS_OPTIONS}
            placeholderTitle="Sano"
            placeholderMeta="Sin estado alterado"
            searchPlaceholder="Busca un estado"
            emptyMessage="No hay estados para ese filtro."
          />
        </div>

        <label className={styles.numberField}>
          <span>Nivel</span>
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
            <span>HP actual</span>
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
                <span>Movimiento {slot + 1}</span>
                {moveResult ? (
                  <span className={styles.moveRangePill}>{moveResult.minPercent}% - {moveResult.maxPercent}%</span>
                ) : null}
              </div>

              <TeamSelectPicker
                ariaLabel={`Movimiento ${slot + 1} ${sideLabels[sideKey]}`}
                value={moveSlug}
                onChange={(value) => onSetMove(sideKey, slot, value)}
                options={moveOptions}
                placeholderTitle="Selecciona un movimiento"
                placeholderMeta="Learnset local"
                searchPlaceholder="Filtra por nombre, tipo o categoria"
                emptyMessage="No encontramos movimientos para ese filtro."
              />

              <small className={styles.moveHint}>
                {moveResult
                  ? `${moveResult.rangeLabel}${moveResult.koText ? ` | ${moveResult.koText}` : ''}`
                  : moveSlug
                    ? `Movimiento cargado: ${formatResourceName(moveSlug)}`
                    : 'Elige hasta cuatro movimientos para evaluar el matchup.'}
              </small>
            </article>
          )
        })}
      </div>

      <div className={styles.statsTable}>
        <div className={styles.statsHead}>
          <span>Stat</span>
          <span>Base</span>
          <span>EV</span>
          <span>IV</span>
          <span>Total</span>
          <span>Boost</span>
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
