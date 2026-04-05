import styles from './TeamValidator.module.css'

const statusLabels = {
  valid: 'OK',
  warning: 'Aviso',
  invalid: 'Ilegal',
  pending: 'Pendiente',
}

function getStatusClassName(status) {
  return styles[`status${status}`] ?? styles.statuspending
}

export default function TeamValidator({
  competitiveFormats,
  isFormatsLoading,
  isValidationDirty,
  isValidationLoading,
  onSetFormatKey,
  onValidateTeam,
  selectedFormatKey,
  validationError,
  validationResult,
}) {
  const availableFormatKeys = new Set(competitiveFormats.map((format) => format.key))
  const hasSelectedFormat = availableFormatKeys.has(selectedFormatKey)
  const selectValue = competitiveFormats.length
    ? hasSelectedFormat
      ? selectedFormatKey
      : competitiveFormats[0].key
    : ''

  return (
    <section className={styles.validator}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Validador competitivo</p>
          <h3>Legalidad y encaje en el meta</h3>
        </div>

        <div className={styles.actions}>
          <label className={styles.formatField}>
            <span>Formato</span>
            <select
              value={selectValue}
              onChange={(event) => onSetFormatKey(event.target.value)}
              disabled={isFormatsLoading || !competitiveFormats.length}
            >
              {competitiveFormats.length ? (
                competitiveFormats.map((format) => (
                  <option key={format.key} value={format.key}>
                    {format.name}
                  </option>
                ))
              ) : (
                <option value="">Sin metas disponibles</option>
              )}
            </select>
          </label>

          <button
            type="button"
            className={styles.validateButton}
            onClick={onValidateTeam}
            disabled={isValidationLoading || !competitiveFormats.length}
          >
            {isValidationLoading ? 'Validando...' : 'Validar equipo'}
          </button>
        </div>
      </div>

      <p className={styles.helperText}>
        Esta version valida Pokemon, habilidad, item y movimientos con datos locales de Showdown. Teratipo y reglas mas
        complejas iran despues para no mentirte con falsos positivos.
      </p>

      <div className={styles.contentStack}>
        {validationError ? <p className={styles.errorBanner}>{validationError}</p> : null}

        {validationResult ? (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span>Estado global</span>
                <strong className={[styles.statusBadge, getStatusClassName(validationResult.summary.teamStatus)].join(' ')}>
                  {statusLabels[validationResult.summary.teamStatus]}
                </strong>
              </article>
              <article className={styles.summaryCard}>
                <span>Slots revisados</span>
                <strong>{validationResult.summary.checkedSlots}/6</strong>
              </article>
              <article className={styles.summaryCard}>
                <span>Ilegales</span>
                <strong>{validationResult.summary.invalidCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span>Avisos</span>
                <strong>{validationResult.summary.warningCount}</strong>
              </article>
            </div>

            <div className={styles.metaRow}>
              <span>Formato activo: {validationResult.format.name}</span>
              <span>{isValidationDirty ? 'Cambios pendientes de revalidar' : 'Resultados al dia'}</span>
            </div>

            <div className={styles.slotList}>
              {validationResult.slots.map((slot) => (
                <article key={`validation-slot-${slot.slotIndex}`} className={styles.slotCard}>
                  <div className={styles.slotHeader}>
                    <div>
                      <span className={styles.slotLabel}>Hueco {slot.slotIndex + 1}</span>
                      <strong>{slot.pokemonName ?? 'Sin Pokemon'}</strong>
                      {slot.tierKey ? <small>Tier actual: {slot.tierKey}</small> : null}
                    </div>
                    <span className={[styles.statusBadge, getStatusClassName(slot.status)].join(' ')}>
                      {statusLabels[slot.status]}
                    </span>
                  </div>

                  <div className={styles.checkList}>
                    {slot.checks.map((check) => (
                      <div key={check.key} className={styles.checkItem}>
                        <span className={[styles.checkStatus, getStatusClassName(check.status)].join(' ')}>
                          {statusLabels[check.status]}
                        </span>
                        <div className={styles.checkCopy}>
                          <strong>{check.label}</strong>
                          <p>{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <strong>Elige un formato y pulsa validar</strong>
            <p>Cuando tengas al menos un Pokemon con build, aqui veras si algo esta baneado, incompleto o listo para jugar.</p>
          </div>
        )}
      </div>
    </section>
  )
}
