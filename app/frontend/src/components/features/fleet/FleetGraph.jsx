import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide,
} from 'd3-force'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'
import { money } from '../../../lib/format.js'

const STATUS_COLOR = {
  healthy:  '#3fd99a',
  warning:  '#ffb454',
  critical: '#ff5d6c',
  idle:     '#6b7488',
}

function agentRadius(n) {
  return 22 + Math.min(16, Math.log(n.trace_count + 1) * 5)
}
function vendorRadius(n) {
  return 24 + Math.min(14, Math.log(n.call_count + 1) * 4)
}
function hexPoints(r) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6
    pts.push(`${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export default function FleetGraph({ data, width, height, onSelect, selectedId }) {
  const svgRef = useRef(null)
  const simRef = useRef(null)
  const dragRef = useRef(null)
  const [, setTick] = useState(0)
  const [tf, setTf] = useState({ k: 1, x: 0, y: 0 })
  const [hover, setHover] = useState(null)

  const { nodes, links } = useMemo(() => {
    const ns = data.nodes.map(n => ({ ...n }))
    const byId = Object.fromEntries(ns.map(n => [n.id, n]))
    const ls = data.links
      .filter(l => byId[l.source] && byId[l.target])
      .map(l => ({ ...l, source: byId[l.source], target: byId[l.target] }))
    return { nodes: ns, links: ls }
  }, [data])

  useEffect(() => {
    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-520))
      .force('link', forceLink(links).id(d => d.id).distance(d => d.target.type === 'vendor' ? 140 : 110).strength(0.35))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(d => (d.type === 'agent' ? agentRadius(d) : vendorRadius(d)) + 14))
      .on('tick', () => setTick(t => t + 1))
    simRef.current = sim
    return () => sim.stop()
  }, [nodes, links, width, height])

  // zoom / pan
  useEffect(() => {
    const sel = select(svgRef.current)
    const z = d3zoom().scaleExtent([0.4, 2.5]).filter((e) => {
      // allow wheel + background drag, but not when starting on a node
      return !e.target.closest('[data-node]')
    }).on('zoom', (e) => setTf(e.transform))
    sel.call(z)
    return () => sel.on('.zoom', null)
  }, [])

  // manual node drag (screen → graph coords through current zoom transform)
  function toGraph(e) {
    const r = svgRef.current.getBoundingClientRect()
    return { x: (e.clientX - r.left - tf.x) / tf.k, y: (e.clientY - r.top - tf.y) / tf.k }
  }
  function onNodeDown(node, e) {
    e.stopPropagation()
    dragRef.current = node
    node.fx = node.x; node.fy = node.y
    simRef.current?.alphaTarget(0.3).restart()
  }
  useEffect(() => {
    function move(e) {
      if (!dragRef.current) return
      const p = toGraph(e)
      dragRef.current.fx = p.x; dragRef.current.fy = p.y
    }
    function up() {
      if (!dragRef.current) return
      dragRef.current.fx = null; dragRef.current.fy = null
      dragRef.current = null
      simRef.current?.alphaTarget(0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [tf])

  const adjacency = useMemo(() => {
    const m = {}
    links.forEach(l => {
      ;(m[l.source.id] ||= new Set()).add(l.target.id)
      ;(m[l.target.id] ||= new Set()).add(l.source.id)
    })
    return m
  }, [links])

  const dimmed = (id) => {
    if (!hover) return false
    if (hover === id) return false
    return !(adjacency[hover]?.has(id))
  }

  const screen = (n) => ({ x: n.x * tf.k + tf.x, y: n.y * tf.k + tf.y })
  const hoverNode = hover ? nodes.find(n => n.id === hover) : null

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <svg ref={svgRef} width={width} height={height} style={{ display: 'block', cursor: 'grab' }}>
        <g transform={`translate(${tf.x},${tf.y}) scale(${tf.k})`}>
          {/* edges */}
          {links.map((l, i) => {
            const lit = hover && (l.source.id === hover || l.target.id === hover)
            const op = hover ? (lit ? 0.9 : 0.08) : 0.5
            return (
              <line
                key={i}
                x1={l.source.x} y1={l.source.y} x2={l.target.x} y2={l.target.y}
                stroke={l.has_violation ? 'var(--critical)' : 'rgba(255,160,120,0.55)'}
                strokeWidth={l.has_violation ? 2 : Math.max(1, Math.min(4, l.call_count / 3))}
                strokeDasharray={l.has_violation ? '6 6' : undefined}
                style={l.has_violation ? { animation: 'dash-flow 0.7s linear infinite', opacity: op } : { opacity: op }}
              />
            )
          })}

          {/* nodes */}
          {nodes.map((n) => {
            const isAgent = n.type === 'agent'
            const r = isAgent ? agentRadius(n) : vendorRadius(n)
            const color = isAgent ? (STATUS_COLOR[n.status] || STATUS_COLOR.idle) : 'var(--ink-2)'
            const op = dimmed(n.id) ? 0.18 : 1
            const sel = n.id === selectedId
            return (
              <g
                key={n.id}
                data-node
                transform={`translate(${n.x},${n.y})`}
                style={{ cursor: 'pointer', opacity: op, transition: 'opacity 0.2s' }}
                onPointerDown={(e) => onNodeDown(n, e)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                onClick={(e) => { e.stopPropagation(); onSelect?.(n) }}
              >
                {isAgent ? (
                  <rect
                    x={-r} y={-r} width={r * 2} height={r * 2} rx={10}
                    fill="rgba(255,255,255,0.04)"
                    stroke={color}
                    strokeWidth={sel ? 3 : 1.5}
                    style={n.status === 'critical' ? { animation: 'node-flag 1.6s ease-in-out infinite' } : undefined}
                  />
                ) : (
                  <polygon
                    points={hexPoints(r)}
                    fill="rgba(120,150,200,0.06)"
                    stroke={color}
                    strokeWidth={sel ? 3 : 1.5}
                  />
                )}
                {/* status dot for agents */}
                {isAgent && (
                  <circle cx={r - 8} cy={-r + 8} r={4} fill={color}
                    style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
                )}
                {/* icon glyph */}
                <text textAnchor="middle" dy="0.35em" fontSize={isAgent ? 13 : 12}
                  fill={color} fontFamily="var(--font-mono)" style={{ pointerEvents: 'none' }}>
                  {isAgent ? '●' : '⬡'}
                </text>
                {/* label */}
                <text textAnchor="middle" y={r + 16} fontSize={11}
                  fill="var(--ink-2)" fontFamily="var(--font-mono)" style={{ pointerEvents: 'none' }}>
                  {n.name.length > 18 ? n.name.slice(0, 17) + '…' : n.name}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* hover tooltip */}
      {hoverNode && (() => {
        const s = screen(hoverNode)
        return (
          <div style={{
            position: 'absolute', left: s.x, top: s.y - 12,
            transform: 'translate(-50%, -100%)', pointerEvents: 'none', zIndex: 5,
            background: 'rgba(8,11,18,0.96)', border: '1px solid var(--line-2)',
            borderRadius: 8, padding: '10px 12px', minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)', animation: 'fade-in 0.12s ease',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--ink)', marginBottom: 6 }}>
              {hoverNode.name}
            </div>
            {hoverNode.type === 'agent' ? (
              <>
                <Row k="status" v={hoverNode.status} c={STATUS_COLOR[hoverNode.status]} />
                <Row k="traces" v={hoverNode.trace_count} />
                <Row k="violations" v={`${hoverNode.violation_count}${hoverNode.critical_count ? ` · ${hoverNode.critical_count} crit` : ''}`} c={hoverNode.critical_count ? 'var(--critical)' : undefined} />
                <Row k="spend" v={money(hoverNode.spend)} />
                {hoverNode.has_hold && <Row k="hold" v="pending" c="var(--warn)" />}
              </>
            ) : (
              <>
                <Row k="vendor" v="LLM provider" />
                <Row k="calls" v={hoverNode.call_count} />
                <Row k="tokens" v={hoverNode.tokens.toLocaleString()} />
                <Row k="spend" v={money(hoverNode.spend)} />
              </>
            )}
          </div>
        )
      })()}
    </div>
  )
}

function Row({ k, v, c }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
      <span style={{ color: 'var(--ink-faint)' }}>{k}</span>
      <span style={{ color: c || 'var(--ink-2)' }}>{v}</span>
    </div>
  )
}
