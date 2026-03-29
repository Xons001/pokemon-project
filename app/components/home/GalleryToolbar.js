import styles from './PokedexHub.module.css'

export default function GalleryToolbar({
  filteredCount,
  query,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <div className={styles.galleryToolbar}>
      <p className={styles.galleryCount}>
        {filteredCount} resultados
        {query ? ` para "${query}"` : ''}
      </p>

      <div className={styles.galleryPagination}>
        <button type="button" className={styles.pageButton} disabled={currentPage === 1} onClick={onPreviousPage}>
          Anterior
        </button>
        <span className={styles.pageIndicator}>
          Pagina {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          className={styles.pageButton}
          disabled={currentPage === totalPages}
          onClick={onNextPage}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
