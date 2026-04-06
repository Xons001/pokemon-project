'use client'

import { useI18n } from '../i18n/LanguageProvider'
import {
  DAMAGE_GLOBAL_FIELD_OPTIONS,
  DAMAGE_RUIN_OPTIONS,
  DAMAGE_SIDE_FIELD_OPTIONS,
  getDamageSwitchingOptions,
  getDamageTerrainOptions,
  getDamageWeatherOptions,
} from '../../lib/damage-calculator'
import styles from './DamageCalculatorPage.module.css'

function renderButtonGroup(options, activeValue, onSelect, className = '') {
  return (
    <div className={[styles.pillGrid, className].filter(Boolean).join(' ')}>
      {options.map((option) => {
        const isActive = option.value === activeValue

        return (
          <button
            key={option.value || option.label}
            type="button"
            className={[styles.pillButton, isActive ? styles.pillButtonActive : null].filter(Boolean).join(' ')}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ToggleCluster({ title, options, values, onToggle }) {
  return (
    <div className={styles.fieldGroup}>
      <p className={styles.fieldGroupTitle}>{title}</p>
      <div className={styles.toggleGrid}>
        {options.map((option) => {
          const isActive = Boolean(values[option.key])

          return (
            <button
              key={option.key}
              type="button"
              className={[styles.toggleButton, isActive ? styles.toggleButtonActive : null].filter(Boolean).join(' ')}
              onClick={() => onToggle(option.key)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function DamageBattlefieldPanel({
  activeFormat,
  formats,
  field,
  selectedMove,
  onSetFormatKey,
  onToggleFieldFlag,
  onSetFieldValue,
  onToggleFieldSideFlag,
  onSetFieldSideValue,
  onSetSelectedMoveOption,
}) {
  const { t, locale } = useI18n()
  const copy = t('damagePage.battlefield')
  const weatherOptions = getDamageWeatherOptions(locale)
  const terrainOptions = getDamageTerrainOptions(locale)
  const switchingOptions = getDamageSwitchingOptions(locale)

  return (
    <section className={styles.battlefieldPanel}>
      <div className={styles.sideHeader}>
        <div>
          <p className={styles.kicker}>{copy.kicker}</p>
          <h3>{activeFormat?.headline ?? copy.fallbackTitle}</h3>
        </div>

        <div className={styles.summaryStack}>
          <span className={styles.summaryBadge}>{activeFormat?.battleModeLabel ?? t('damage.battleMode.singles')}</span>
          {activeFormat?.name ? <span className={styles.summaryBadgeMuted}>{activeFormat.name}</span> : null}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>{copy.activeFormat}</p>
        <div className={styles.formatGrid}>
          {formats.map((format) => {
            const isActive = format.key === activeFormat?.key

            return (
              <button
                key={format.key}
                type="button"
                className={[styles.formatCard, isActive ? styles.formatCardActive : null].filter(Boolean).join(' ')}
                onClick={() => onSetFormatKey(format.key)}
              >
                <strong>{format.headline}</strong>
                <span>{format.battleModeLabel}</span>
                <small>{format.name}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>{copy.weather}</p>
        {renderButtonGroup(weatherOptions, field.weather, (value) => onSetFieldValue('weather', value))}
      </div>

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>{copy.terrain}</p>
        {renderButtonGroup(terrainOptions, field.terrain, (value) => onSetFieldValue('terrain', value))}
      </div>

      <ToggleCluster title={copy.globalConditions} options={DAMAGE_GLOBAL_FIELD_OPTIONS} values={field} onToggle={onToggleFieldFlag} />
      <ToggleCluster title={copy.auraAndRuin} options={DAMAGE_RUIN_OPTIONS} values={field} onToggle={onToggleFieldFlag} />

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>{copy.selectedMove}</p>
        <div className={styles.selectedMoveTools}>
          <button
            type="button"
            className={[styles.toggleButton, selectedMove.isCrit ? styles.toggleButtonActive : null].filter(Boolean).join(' ')}
            onClick={() => onSetSelectedMoveOption('isCrit', !selectedMove.isCrit)}
          >
            {copy.criticalHit}
          </button>

          <label className={styles.numberField}>
            <span>{copy.hits}</span>
            <select value={selectedMove.hits} onChange={(event) => onSetSelectedMoveOption('hits', event.target.value)}>
              <option value="">{copy.auto}</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
        </div>
      </div>

      <div className={styles.sideFieldGrid}>
        {[
          { key: 'attackerSide', label: copy.sideOne },
          { key: 'defenderSide', label: copy.sideTwo },
        ].map((side) => (
          <article key={side.key} className={styles.sideFieldCard}>
            <div className={styles.sideFieldHeader}>
              <strong>{side.label}</strong>
              <small>{side.key === 'attackerSide' ? t('damagePage.attacker') : t('damagePage.defender')}</small>
            </div>

            <div className={styles.sideFieldControls}>
              <label className={styles.numberField}>
                <span>{copy.spikes}</span>
                <select
                  value={field[side.key].spikes}
                  onChange={(event) => onSetFieldSideValue(side.key, 'spikes', Number(event.target.value))}
                >
                  {[0, 1, 2, 3].map((value) => (
                    <option key={`${side.key}-spikes-${value}`} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.numberField}>
                <span>{copy.switching}</span>
                <select
                  value={field[side.key].isSwitching}
                  onChange={(event) => onSetFieldSideValue(side.key, 'isSwitching', event.target.value)}
                >
                  {switchingOptions.map((option) => (
                    <option key={`${side.key}-switching-${option.value || 'idle'}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.toggleGrid}>
              {DAMAGE_SIDE_FIELD_OPTIONS.map((option) => {
                const isActive = Boolean(field[side.key][option.key])

                return (
                  <button
                    key={`${side.key}-${option.key}`}
                    type="button"
                    className={[styles.toggleButton, isActive ? styles.toggleButtonActive : null].filter(Boolean).join(' ')}
                    onClick={() => onToggleFieldSideFlag(side.key, option.key)}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
