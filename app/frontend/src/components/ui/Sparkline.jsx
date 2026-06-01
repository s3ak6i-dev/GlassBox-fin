export default function Sparkline({ data = [], width = 80, height = 24, color = 'var(--blue)' }) {
  if (!data.length) return <svg width={width} height={height} />
  const max = Math.max(...data, 1)
  const barW = width / data.length
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * height)
        return (
          <rect
            key={i}
            x={i * barW + 1}
            y={height - h}
            width={Math.max(1, barW - 2)}
            height={h}
            fill={color}
            opacity={0.7}
            rx={1}
          />
        )
      })}
    </svg>
  )
}
