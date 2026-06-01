const MAP = {
  CRITICAL: 'gb-badge-critical',
  HIGH:     'gb-badge-high',
  MEDIUM:   'gb-badge-medium',
  LOW:      'gb-badge-low',
  pending:  'gb-badge-pending',
  approved: 'gb-badge-pass',
  denied:   'gb-badge-critical',
  logged:   'gb-badge-low',
}

export default function SeverityBadge({ severity, className = '' }) {
  const key = (severity || '').toUpperCase()
  const variant = MAP[key] || MAP[severity] || 'gb-badge-low'
  return <span className={`gb-badge ${variant} ${className}`}>{severity}</span>
}
