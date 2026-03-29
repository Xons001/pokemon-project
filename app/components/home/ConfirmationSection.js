import sharedStyles from './shared.module.css'
import styles from './ConfirmationSection.module.css'

export default function ConfirmationSection({ pokemon, onViewCard, onBackToList }) {
  return (
    <section className={styles.confirmationSection}>
      <div className={styles.confirmationShell}>
        <div className={styles.confirmationContent}>
          <div className={styles.confirmationIcon} aria-hidden="true">
            <span className={styles.confirmationIconBall} />
          </div>

          <div className={styles.confirmationMessage}>
            <p className={sharedStyles.eyebrow}>Registro completado</p>
            <h2 className={`${sharedStyles.sectionTitle} ${styles.confirmationTitle}`}>
              {pokemon.name} se ha anadido correctamente a tu equipo.
            </h2>
            <p className={sharedStyles.sectionText}>La ficha, la carta y la landing inferior siguen al Pokemon seleccionado.</p>
          </div>
        </div>

        <div className={styles.confirmationActions}>
          <button type="button" className={styles.confirmationPrimary} onClick={onViewCard}>
            Ver ficha
          </button>
          <button type="button" className={styles.confirmationSecondary} onClick={onBackToList}>
            Volver a la lista
          </button>
        </div>
      </div>
    </section>
  )
}
