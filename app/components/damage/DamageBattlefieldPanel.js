'use client'

import {
  DAMAGE_GLOBAL_FIELD_OPTIONS,
  DAMAGE_RUIN_OPTIONS,
  DAMAGE_SIDE_FIELD_OPTIONS,
  DAMAGE_SWITCHING_OPTIONS,
  DAMAGE_TERRAIN_OPTIONS,
  DAMAGE_WEATHER_OPTIONS,
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
  return (
    <section className={styles.battlefieldPanel}>
      <div className={styles.sideHeader}>
        <div>
          <p className={styles.kicker}>Battlefield</p>
          <h3>{activeFormat?.headline ?? 'Damage Calculator'}</h3>
        </div>

        <div className={styles.summaryStack}>
          <span className={styles.summaryBadge}>{activeFormat?.battleModeLabel ?? 'Combate individual'}</span>
          {activeFormat?.name ? <span className={styles.summaryBadgeMuted}>{activeFormat.name}</span> : null}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>Formato activo</p>
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
        <p className={styles.fieldGroupTitle}>Clima</p>
        {renderButtonGroup(DAMAGE_WEATHER_OPTIONS, field.weather, (value) => onSetFieldValue('weather', value))}
      </div>

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>Terreno</p>
        {renderButtonGroup(DAMAGE_TERRAIN_OPTIONS, field.terrain, (value) => onSetFieldValue('terrain', value))}
      </div>

      <ToggleCluster title="Condiciones globales" options={DAMAGE_GLOBAL_FIELD_OPTIONS} values={field} onToggle={onToggleFieldFlag} />
      <ToggleCluster title="Aura y Ruin" options={DAMAGE_RUIN_OPTIONS} values={field} onToggle={onToggleFieldFlag} />

      <div className={styles.fieldGroup}>
        <p className={styles.fieldGroupTitle}>Movimiento seleccionado</p>
        <div className={styles.selectedMoveTools}>
          <button
            type="button"
            className={[styles.toggleButton, selectedMove.isCrit ? styles.toggleButtonActive : null].filter(Boolean).join(' ')}
            onClick={() => onSetSelectedMoveOption('isCrit', !selectedMove.isCrit)}
          >
            Golpe critico
          </button>

          <label className={styles.numberField}>
            <span>Golpes</span>
            <select value={selectedMove.hits} onChange={(event) => onSetSelectedMoveOption('hits', event.target.value)}>
              <option value="">Auto</option>
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
          { key: 'attackerSide', label: 'Lado 1' },
          { key: 'defenderSide', label: 'Lado 2' },
        ].map((side) => (
          <article key={side.key} className={styles.sideFieldCard}>
            <div className={styles.sideFieldHeader}>
              <strong>{side.label}</strong>
              <small>{side.key === 'attackerSide' ? 'Atacante' : 'Defensor'}</small>
            </div>

            <div className={styles.sideFieldControls}>
              <label className={styles.numberField}>
                <span>Spikes</span>
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
                <span>Switching</span>
                <select
                  value={field[side.key].isSwitching}
                  onChange={(event) => onSetFieldSideValue(side.key, 'isSwitching', event.target.value)}
                >
                  {DAMAGE_SWITCHING_OPTIONS.map((option) => (
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
