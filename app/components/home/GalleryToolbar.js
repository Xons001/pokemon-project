import { useI18n } from '../i18n/LanguageProvider'
import styles from './PokedexHub.module.css'

export default function GalleryToolbar({
  filteredCount,
  query,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}) {
  const { t } = useI18n()

  return (
    <div className={styles.galleryToolbar}>
      <p className={styles.galleryCount}>
        {t('home.gallery.results', { count: filteredCount })}
        {query ? t('home.gallery.resultsFor', { query }) : ''}
      </p>

      <div className={styles.galleryPagination}>
        <button type="button" className={styles.pageButton} disabled={currentPage === 1} onClick={onPreviousPage}>
          {t('home.gallery.previous')}
        </button>
        <span className={styles.pageIndicator}>
          {t('home.gallery.page', { current: currentPage, total: totalPages })}
        </span>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage === totalPages}
          onClick={onNextPage}
        >
          {t('home.gallery.next')}
        </button>
      </div>
    </div>
  )
}
