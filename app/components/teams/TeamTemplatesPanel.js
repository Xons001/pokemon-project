import styles from './TeamTemplatesPanel.module.css'

export default function TeamTemplatesPanel({
  activeTemplateId,
  strongestTemplate,
  templateSummaries,
  onSelectTemplate,
}) {
  return (
    <aside className={styles.panel} id="plantillas">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>Plantillas guardadas</p>
          <h3>Elige tu equipo</h3>
        </div>
        <span className={styles.badge}>{templateSummaries.length}</span>
      </div>

      <div className={styles.templateList}>
        {templateSummaries.map((template) => {
          const isActive = template.id === activeTemplateId
          const isStrongest = strongestTemplate?.id === template.id

          return (
            <button
              key={template.id}
              type="button"
              className={[styles.templateCard, isActive ? styles.templateCardActive : null].filter(Boolean).join(' ')}
              onClick={() => onSelectTemplate(template.id)}
            >
              <div className={styles.templateHeading}>
                <strong>{template.name || 'Sin nombre'}</strong>
                {isStrongest ? <span className={styles.bestTag}>Mejor balance</span> : null}
              </div>

              <p>{template.filledSlots}/6 Pokemon asignados</p>

              <div className={styles.templateMeta}>
                <span>{template.balanceLabel}</span>
                <strong>{template.balanceScore >= 0 ? `+${template.balanceScore}` : template.balanceScore}</strong>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
