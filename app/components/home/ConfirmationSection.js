export default function ConfirmationSection({ pokemon, onViewCard, onBackToList }) {
  return (
    <section className="confirmation-section">
      <div className="confirmation-shell">
        <div className="confirmation-content">
          <div className="confirmation-icon" aria-hidden="true">
            <span className="confirmation-icon-ball" />
          </div>

          <div className="confirmation-message">
            <p className="eyebrow">Registro completado</p>
            <h2 className="section-title">{pokemon.name} se ha anadido correctamente a tu equipo.</h2>
            <p className="section-text">La ficha, la carta y la landing inferior siguen al Pokemon seleccionado.</p>
          </div>
        </div>

        <div className="confirmation-actions">
          <button type="button" className="confirmation-primary" onClick={onViewCard}>
            Ver ficha
          </button>
          <button type="button" className="confirmation-secondary" onClick={onBackToList}>
            Volver a la lista
          </button>
        </div>
      </div>
    </section>
  )
}
