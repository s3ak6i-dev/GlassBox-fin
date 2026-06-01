export default function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`gb-filter-pill ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
