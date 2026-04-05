'use client'

import {
  TEAM_MAX_EVS,
  TEAM_MAX_EVS_PER_STAT,
  TEAM_MAX_IVS_PER_STAT,
  TEAM_STAT_LEVEL,
  calculateBattleStat,
  getEffortValueTotal,
  getNatureModifier,
  getNatureSummary,
} from '../../lib/team-builder'
import styles from './TeamStatEditor.module.css'

const statConfig = [
  { key: 'hp', label: 'HP', color: '#d4a017' },
  { key: 'attack', label: 'ATK', color: '#e85d04' },
  { key: 'defense', label: 'DEF', color: '#f4a261' },
  { key: 'specialAttack', label: 'SPA', color: '#f72585' },
  { key: 'specialDefense', label: 'SPD', color: '#4cc9f0' },
  { key: 'speed', label: 'SPE', color: '#4361ee' },
]

function buildRadarPoint(cx, cy, radius, index, total) {
  const angle = -Math.PI / 2 + (index * (Math.PI * 2)) / total

  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  }
}

function formatStatValue(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function buildPolygonPath(points) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export default function TeamStatEditor({
  pokemon,
  selectedSlot,
  onAssignEffortValue,
  onAssignIndividualValue,
  onResetStatSpread,
}) {
  if (!pokemon) {
    return null
  }

  const evs = selectedSlot?.evs ?? {}
  const ivs = selectedSlot?.ivs ?? {}
  const natureKey = selectedSlot?.natureKey ?? null
  const effortTotal = getEffortValueTotal(evs)
  const radarCenter = 130
  const radarRadius = 96

  const statRows = statConfig.map((stat) => {
    const base = formatStatValue(pokemon[stat.key])
    const ev = formatStatValue(evs[stat.key])
    const iv = formatStatValue(ivs[stat.key])
    const baseTotal = calculateBattleStat({
      base,
      iv: 0,
      ev: 0,
      statKey: stat.key,
      natureKey,
    })
    const total = calculateBattleStat({
      base,
      iv,
      ev,
      statKey: stat.key,
      natureKey,
    })
    const maxTotal = calculateBattleStat({
      base,
      iv: TEAM_MAX_IVS_PER_STAT,
      ev: TEAM_MAX_EVS_PER_STAT,
      statKey: stat.key,
      natureKey,
    })
    const natureModifier = getNatureModifier(natureKey, stat.key)

    return {
      ...stat,
      base,
      ev,
      iv,
      baseTotal,
      total,
      maxTotal,
      natureModifier,
    }
  })

  const axisPoints = statRows.map((stat, index) => {
    return buildRadarPoint(radarCenter, radarCenter, radarRadius, index, statRows.length)
  })

  const gridLevels = [0.25, 0.5, 0.75, 1]
  const adjustedPolygonPoints = statRows.map((stat, index) => {
    const ratio = stat.maxTotal ? Math.max(0.14, stat.total / stat.maxTotal) : 0.14
    return buildRadarPoint(radarCenter, radarCenter, radarRadius * ratio, index, statRows.length)
  })

  const basePolygonPoints = statRows.map((stat, index) => {
    const ratio = stat.maxTotal ? Math.max(0.1, stat.baseTotal / stat.maxTotal) : 0.1
    return buildRadarPoint(radarCenter, radarCenter, radarRadius * ratio, index, statRows.length)
  })

  return (
    <section className={styles.editor}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Ajuste de stats</p>
          <h3>EVs e IVs del hueco activo</h3>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.summaryBadge}>EV total {effortTotal}/{TEAM_MAX_EVS}</span>
          <span className={styles.summaryBadge}>Totales Lv.{TEAM_STAT_LEVEL}</span>
          <span className={[styles.summaryBadge, styles.natureBadge].join(' ')}>{getNatureSummary(natureKey)}</span>
          <button type="button" className={styles.resetButton} onClick={onResetStatSpread}>
            Reset stats
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        <article className={styles.radarPanel}>
          <div className={styles.radarLegend}>
            <span className={[styles.legendChip, styles.legendChipBase].join(' ')}>Base</span>
            <span className={[styles.legendChip, styles.legendChipAdjusted].join(' ')}>Ajustado</span>
          </div>

          <div className={styles.radarFrame}>
            <svg viewBox="0 0 260 260" className={styles.radarSvg} aria-label={`Radar de stats de ${pokemon.name}`}>
              {gridLevels.map((level) => {
                const levelPoints = statRows.map((_, index) => {
                  return buildRadarPoint(radarCenter, radarCenter, radarRadius * level, index, statRows.length)
                })

                return (
                  <polygon
                    key={`grid-${level}`}
                    className={styles.radarGrid}
                    points={buildPolygonPath(levelPoints)}
                  />
                )
              })}

              {axisPoints.map((point, index) => (
                <line
                  key={`axis-${statRows[index].key}`}
                  className={styles.radarAxis}
                  x1={radarCenter}
                  y1={radarCenter}
                  x2={point.x}
                  y2={point.y}
                />
              ))}

              <polygon className={styles.radarAreaBase} points={buildPolygonPath(basePolygonPoints)} />
              <polygon className={styles.radarAreaAdjusted} points={buildPolygonPath(adjustedPolygonPoints)} />

              {adjustedPolygonPoints.map((point, index) => (
                <circle
                  key={`dot-${statRows[index].key}`}
                  className={styles.radarDot}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  style={{ '--dot-color': statRows[index].color }}
                />
              ))}

              {axisPoints.map((point, index) => {
                const labelPoint = buildRadarPoint(radarCenter, radarCenter, radarRadius + 24, index, statRows.length)

                return (
                  <text
                    key={`label-${statRows[index].key}`}
                    className={styles.radarLabel}
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {statRows[index].label}
                  </text>
                )
              })}
            </svg>
          </div>
          <p className={styles.radarCaption}>
            El radar refleja los totales calculados a nivel {TEAM_STAT_LEVEL} con la distribucion actual de EVs e IVs.
          </p>
        </article>

        <div className={styles.statTable}>
          <div className={styles.statTableHead}>
            <span>Stat</span>
            <span>Base</span>
            <span>EVs</span>
            <span>IVs</span>
            <span>Total</span>
          </div>

          {statRows.map((stat) => (
            <article key={stat.key} className={styles.statRow} style={{ '--stat-accent': stat.color }}>
              <div className={styles.statLabelCell}>
                <span
                  className={[
                    styles.statKey,
                    stat.natureModifier > 1 ? styles.statKeyBoost : null,
                    stat.natureModifier < 1 ? styles.statKeyDrop : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {stat.label}
                  {stat.natureModifier > 1 ? ' +' : stat.natureModifier < 1 ? ' -' : ''}
                </span>
              </div>

              <div className={styles.baseCell}>
                <div className={styles.baseMeta}>
                  <span>0</span>
                  <strong>{stat.base}</strong>
                  <span>255</span>
                </div>
                <div className={styles.baseMeter}>
                  <span
                    className={styles.baseMeterFill}
                    style={{ width: `${Math.max(6, (stat.base / 255) * 100)}%` }}
                  />
                </div>
              </div>

              <div className={styles.controlCell}>
                <div className={styles.sliderMeta}>
                  <span>0</span>
                  <strong className={styles.valuePill}>{stat.ev}</strong>
                  <span>{TEAM_MAX_EVS_PER_STAT}</span>
                </div>
                <div className={styles.sliderRow}>
                  <input
                    className={styles.range}
                    type="range"
                    min="0"
                    max={TEAM_MAX_EVS_PER_STAT}
                    step="4"
                    value={stat.ev}
                    onChange={(event) => onAssignEffortValue(stat.key, Number(event.target.value))}
                  />
                </div>
              </div>

              <div className={styles.controlCell}>
                <div className={styles.sliderMeta}>
                  <span>0</span>
                  <strong className={styles.valuePill}>{stat.iv}</strong>
                  <span>{TEAM_MAX_IVS_PER_STAT}</span>
                </div>
                <div className={styles.sliderRow}>
                  <input
                    className={styles.range}
                    type="range"
                    min="0"
                    max={TEAM_MAX_IVS_PER_STAT}
                    step="1"
                    value={stat.iv}
                    onChange={(event) => onAssignIndividualValue(stat.key, Number(event.target.value))}
                  />
                </div>
              </div>

              <strong className={styles.statTotal}>{stat.total}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
