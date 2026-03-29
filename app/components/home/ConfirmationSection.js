import sharedStyles from './shared.module.css'
import styles from './ConfirmationSection.module.css'

export default function ConfirmationSection({ pokemon, onViewCard, onBackToList }) {
  const hasLevelMoves = pokemon.levelMoves.length > 0
  const hasHeldItems = pokemon.heldItems.length > 0

  return (
    <section className={styles.confirmationSection}>
      <div className={styles.confirmationShell}>
        <div className={styles.confirmationContent}>
          <div className={styles.confirmationIcon} aria-hidden="true">
            <span className={styles.confirmationIconBall} />
          </div>

          <div className={styles.confirmationMessage}>
            <p className={sharedStyles.eyebrow}>Aprendizaje</p>
            <h2 className={`${sharedStyles.sectionTitle} ${styles.confirmationTitle}`}>
              Ataques y objetos de {pokemon.name}
            </h2>
            <p className={sharedStyles.sectionText}>
              Consulta los movimientos que aprende por nivel, los objetos asociados y salta a la pagina de equipos para
              usarlo como futuro lider.
            </p>
          </div>
        </div>

        <div className={styles.learnsetGrid}>
          <section className={styles.infoPanel} aria-label="Movimientos por nivel">
            <div className={styles.panelHeading}>
              <h3>Movimientos por nivel</h3>
              <span>{pokemon.levelMoves.length}</span>
            </div>

            <div className={styles.moveList}>
              {hasLevelMoves ? (
                pokemon.levelMoves.map((move) => (
                  <div key={`${move.name}-${move.level}`} className={styles.moveRow}>
                    <span className={styles.moveLevel}>Nv. {move.level}</span>
                    <strong>{move.name}</strong>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  {pokemon.isPlaceholder
                    ? 'Cargando movimientos aprendidos por nivel...'
                    : 'No hay movimientos por nivel registrados para este Pokemon.'}
                </p>
              )}
            </div>
          </section>

          <section className={styles.infoPanel} aria-label="Objetos posibles">
            <div className={styles.panelHeading}>
              <h3>Objetos posibles</h3>
              <span>{pokemon.heldItems.length}</span>
            </div>

            <div className={styles.itemList}>
              {hasHeldItems ? (
                pokemon.heldItems.map((item) => (
                  <div key={item.name} className={styles.itemCard}>
                    <strong>{item.name}</strong>
                    <span>{item.rarity ? `Rareza ${item.rarity}` : 'Rareza sin dato'}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  {pokemon.isPlaceholder
                    ? 'Cargando objetos posibles...'
                    : 'Este Pokemon no suele llevar objetos asociados.'}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.confirmationActions}>
          <button type="button" className={styles.confirmationPrimary} onClick={onViewCard}>
            Ir a equipos
          </button>
          <button type="button" className={styles.confirmationSecondary} onClick={onBackToList}>
            Volver a la lista
          </button>
        </div>
      </div>
    </section>
  )
}
