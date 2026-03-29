import { getBalanceLabel } from '../../lib/team-builder'
import styles from './TeamAnalysis.module.css'

function formatRiskBadge(entry) {
  if (entry.maxMultiplier >= 4) {
    return 'x4'
  }

  if (entry.maxMultiplier > 1) {
    return 'x2'
  }

  return 'x1'
}

export default function TeamAnalysis({
  activeTemplate,
  activeTemplateSummary,
  isTypeChartLoading,
  rankedResistances,
  rankedWeaknesses,
  strongestTemplate,
  teamMembers,
  templateSummaries,
  typeAnalysis,
  typeChartReady,
}) {
  const leaderPokemon = teamMembers[activeTemplate?.leaderSlot ?? 0]
  const hasReadyAnalysis = typeChartReady && activeTemplateSummary.readyMembers > 0

  return (
    <aside className={styles.analysis} id="analisis">
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
          <strong>{activeTemplateSummary.filledSlots}/6</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Balance</span>
          <strong>{getBalanceLabel(activeTemplateSummary.balanceScore)}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Lider</span>
          <strong>{leaderPokemon?.name ?? 'Sin lider'}</strong>
        </div>
      </div>

      <section className={styles.block}>
        <div className={styles.blockHeading}>
          <h4>Puntos mas debiles</h4>
          <span>{rankedWeaknesses.length}</span>
        </div>

        <div className={styles.metricList}>
          {hasReadyAnalysis && rankedWeaknesses.length ? (
            rankedWeaknesses.map((entry) => (
              <div key={entry.type} className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <strong>{entry.label}</strong>
                  <span>{formatRiskBadge(entry)}</span>
                </div>
                <p>
                  {entry.weakCount} Pokemon del equipo sufren dano aumentado
                  {entry.superWeakCount ? ` y ${entry.superWeakCount} llegan a x4.` : '.'}
                </p>
                <div className={styles.metricBarTrack}>
                  <span
                    className={styles.metricBarFillRisk}
                    style={{ width: `${Math.min(100, entry.weakCount * 18 + entry.superWeakCount * 18 + 18)}%` }}
                  />
                </div>
              </div>
            ))
          ) : !typeChartReady ? (
            <p className={styles.emptyMessage}>Cargando relaciones de tipos para calcular debilidades reales...</p>
          ) : (
            <p className={styles.emptyMessage}>Todavia no hay suficiente equipo para detectar debilidades claras.</p>
          )}
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeading}>
          <h4>Mejores resistencias</h4>
          <span>{rankedResistances.length}</span>
        </div>

        <div className={styles.metricList}>
          {hasReadyAnalysis && rankedResistances.length ? (
            rankedResistances.map((entry) => (
              <div key={entry.type} className={styles.metricCard}>
                <div className={styles.metricTop}>
                  <strong>{entry.label}</strong>
                  <span>{entry.immuneCount ? `${entry.immuneCount} inmunes` : `${entry.resistCount} resisten`}</span>
                </div>
                <p>
                  {entry.resistCount} resistentes
                  {entry.immuneCount ? ` y ${entry.immuneCount} inmunes` : ''} frente a este tipo atacante.
                </p>
                <div className={styles.metricBarTrack}>
                  <span
                    className={styles.metricBarFillSafe}
                    style={{ width: `${Math.min(100, entry.resistCount * 18 + entry.immuneCount * 24 + 18)}%` }}
                  />
                </div>
              </div>
            ))
          ) : !typeChartReady ? (
            <p className={styles.emptyMessage}>Esperando a la tabla de tipos para medir las resistencias del equipo.</p>
          ) : (
            <p className={styles.emptyMessage}>Completa mas slots para ver coberturas y resistencias del equipo.</p>
          )}
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeading}>
          <h4>Lectura rapida por tipo</h4>
          <span>{typeAnalysis.length}</span>
        </div>

        <div className={styles.typeGrid}>
          {hasReadyAnalysis ? (
            typeAnalysis.map((entry) => (
              <div key={entry.type} className={styles.typeTile}>
                <strong>{entry.label}</strong>
                <span>Debiles: {entry.weakCount}</span>
                <span>Resisten: {entry.resistCount}</span>
                <span>Inmunes: {entry.immuneCount}</span>
              </div>
            ))
          ) : (
            <p className={styles.emptyMessage}>Anade Pokemon y espera a que terminen de cargar los tipos para ver esta matriz.</p>
          )}
        </div>
      </section>

      <section className={styles.block}>
        <div className={styles.blockHeading}>
          <h4>Comparativa de plantillas</h4>
          <span>{templateSummaries.length}</span>
        </div>

        <div className={styles.templateRanking}>
          {templateSummaries.map((template) => (
            <div
              key={template.id}
              className={[styles.rankCard, strongestTemplate?.id === template.id ? styles.rankCardBest : null]
                .filter(Boolean)
                .join(' ')}
            >
              <div>
                <strong>{template.name || 'Sin nombre'}</strong>
                <p>{template.filledSlots}/6 slots ocupados</p>
              </div>
              <div className={styles.rankMeta}>
                <span>{template.balanceLabel}</span>
                <strong>{template.balanceScore >= 0 ? `+${template.balanceScore}` : template.balanceScore}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
