export default function LiveBadge({ label = 'Live' }) {
  return (
    <span className="gb-live">
      <span className="gb-live-dot" />
      {label}
    </span>
  )
}
