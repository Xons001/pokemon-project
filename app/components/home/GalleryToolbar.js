export default function GalleryToolbar({
  filteredCount,
  query,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}) {
  return (
    <div className="gallery-toolbar">
      <p className="gallery-count">
        {filteredCount} resultados
        {query ? ` para "${query}"` : ''}
      </p>

      <div className="gallery-pagination">
        <button type="button" className="page-button" disabled={currentPage === 1} onClick={onPreviousPage}>
          Anterior
        </button>
        <span className="page-indicator">
          Pagina {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          className="page-button"
          disabled={currentPage === totalPages}
          onClick={onNextPage}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
