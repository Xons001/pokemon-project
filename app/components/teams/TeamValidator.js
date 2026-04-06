import { useI18n } from '../i18n/LanguageProvider'
import styles from './TeamValidator.module.css'

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
  const { t } = useI18n()
  const statusLabels = {
    valid: t('team.validator.statuses.valid'),
    warning: t('team.validator.statuses.warning'),
    invalid: t('team.validator.statuses.invalid'),
    pending: t('team.validator.statuses.pending'),
  }
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
          <p className={styles.kicker}>{t('team.validator.kicker')}</p>
          <h3>{t('team.validator.title')}</h3>
        </div>

        <div className={styles.actions}>
          <label className={styles.formatField}>
            <span>{t('team.validator.format')}</span>
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
                <option value="">{t('team.validator.noFormats')}</option>
              )}
            </select>
          </label>

          <button
            type="button"
            className={styles.validateButton}
            onClick={onValidateTeam}
            disabled={isValidationLoading || !competitiveFormats.length}
          >
            {isValidationLoading ? t('team.validator.validating') : t('team.validator.validate')}
          </button>
        </div>
      </div>

      <p className={styles.helperText}>{t('team.validator.helper')}</p>

      <div className={styles.contentStack}>
        {validationError ? <p className={styles.errorBanner}>{validationError}</p> : null}

        {validationResult ? (
          <>
            <div className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span>{t('team.validator.globalStatus')}</span>
                <strong className={[styles.statusBadge, getStatusClassName(validationResult.summary.teamStatus)].join(' ')}>
                  {statusLabels[validationResult.summary.teamStatus]}
                </strong>
              </article>
              <article className={styles.summaryCard}>
                <span>{t('team.validator.checkedSlots')}</span>
                <strong>{validationResult.summary.checkedSlots}/6</strong>
              </article>
              <article className={styles.summaryCard}>
                <span>{t('team.validator.invalid')}</span>
                <strong>{validationResult.summary.invalidCount}</strong>
              </article>
              <article className={styles.summaryCard}>
                <span>{t('team.validator.warnings')}</span>
                <strong>{validationResult.summary.warningCount}</strong>
              </article>
            </div>

            <div className={styles.metaRow}>
              <span>{t('team.validator.activeFormat', { name: validationResult.format.name })}</span>
              <span>{isValidationDirty ? t('team.validator.pendingChanges') : t('team.validator.upToDate')}</span>
            </div>

            <div className={styles.slotList}>
              {validationResult.slots.map((slot) => (
                <article key={`validation-slot-${slot.slotIndex}`} className={styles.slotCard}>
                  <div className={styles.slotHeader}>
                    <div>
                      <span className={styles.slotLabel}>{t('team.validator.slot', { index: slot.slotIndex + 1 })}</span>
                      <strong>{slot.pokemonName ?? t('team.validator.emptyPokemon')}</strong>
                      {slot.tierKey ? <small>{t('team.validator.currentTier', { tier: slot.tierKey })}</small> : null}
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
            <strong>{t('team.validator.emptyTitle')}</strong>
            <p>{t('team.validator.emptyDescription')}</p>
          </div>
        )}
      </div>
    </section>
  )
}
