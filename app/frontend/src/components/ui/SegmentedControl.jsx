export default function SegmentedControl({ options, value, onChange, size = 'md' }) {
  return (
    <div className={`gb-seg ${size === 'sm' ? 'gb-seg-sm' : ''}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`gb-seg-opt ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
