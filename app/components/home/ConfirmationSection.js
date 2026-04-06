import { useI18n } from '../i18n/LanguageProvider'
import sharedStyles from './shared.module.css'
import styles from './ConfirmationSection.module.css'

export default function ConfirmationSection({ pokemon, onViewCard, onBackToList }) {
  const { t } = useI18n()
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
            <p className={sharedStyles.eyebrow}>{t('home.confirmation.eyebrow')}</p>
            <h2 className={`${sharedStyles.sectionTitle} ${styles.confirmationTitle}`}>
              {t('home.confirmation.title', { name: pokemon.name })}
            </h2>
            <p className={sharedStyles.sectionText}>
              {t('home.confirmation.description')}
            </p>
          </div>
        </div>

        <div className={styles.learnsetGrid}>
          <section className={styles.infoPanel} aria-label={t('home.confirmation.levelMovesAria')}>
            <div className={styles.panelHeading}>
              <h3>{t('home.confirmation.levelMovesTitle')}</h3>
              <span>{pokemon.levelMoves.length}</span>
            </div>

            <div className={styles.moveList}>
              {hasLevelMoves ? (
                pokemon.levelMoves.map((move) => (
                  <div key={`${move.name}-${move.level}`} className={styles.moveRow}>
                    <span className={styles.moveLevel}>{t('home.confirmation.levelLabel', { level: move.level })}</span>
                    <strong>{move.name}</strong>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  {pokemon.isPlaceholder
                    ? t('home.confirmation.loadingLevelMoves')
                    : t('home.confirmation.noLevelMoves')}
                </p>
              )}
            </div>
          </section>

          <section className={styles.infoPanel} aria-label={t('home.confirmation.heldItemsAria')}>
            <div className={styles.panelHeading}>
              <h3>{t('home.confirmation.heldItemsTitle')}</h3>
              <span>{pokemon.heldItems.length}</span>
            </div>

            <div className={styles.itemList}>
              {hasHeldItems ? (
                pokemon.heldItems.map((item) => (
                  <div key={item.name} className={styles.itemCard}>
                    <strong>{item.name}</strong>
                    <span>{item.rarity ? t('home.confirmation.rarity', { rarity: item.rarity }) : t('home.confirmation.rarityUnknown')}</span>
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>
                  {pokemon.isPlaceholder
                    ? t('home.confirmation.loadingItems')
                    : t('home.confirmation.noItems')}
                </p>
              )}
            </div>
          </section>
        </div>

        <div className={styles.confirmationActions}>
          <button type="button" className={styles.confirmationPrimary} onClick={onViewCard}>
            {t('home.confirmation.goToTeams')}
          </button>
          <button type="button" className={styles.confirmationSecondary} onClick={onBackToList}>
            {t('home.confirmation.backToList')}
          </button>
        </div>
      </div>
    </section>
  )
}
