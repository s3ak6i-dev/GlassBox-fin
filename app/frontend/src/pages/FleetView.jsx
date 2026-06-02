import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { graphApi } from '../api/graph.js'
import Card from '../components/ui/Card.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import FleetGraph from '../components/features/fleet/FleetGraph.jsx'
import FleetGrid from '../components/features/fleet/FleetGrid.jsx'
import NodeDrawer from '../components/features/fleet/NodeDrawer.jsx'
import PageHint from '../components/ui/PageHint.jsx'
import { money } from '../lib/format.js'

export default function FleetView() {
  const { token, workspace } = useAuth()
  const [data, setData] = useState({ nodes: [], links: [], fleets: [] })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('graph')
  const [fleet, setFleet] = useState('all')
  const [selected, setSelected] = useState(null)
  const containerRef = useRef(null)
  const [dims, setDims] = useState({ w: 800, h: 560 })

  useEffect(() => {
    if (!workspace) return
    graphApi.get(token, workspace.id).then(setData).finally(() => setLoading(false))
  }, [token, workspace])

  // measure graph container
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0].contentRect
      setDims({ w: Math.max(320, e.width), h: Math.max(420, e.height) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [view, loading])

  // fleet filter
  const filtered = useMemo(() => {
    if (fleet === 'all') return data
    const agents = data.nodes.filter(n => n.type === 'agent' && n.fleet_id === fleet)
    const agentIds = new Set(agents.map(a => a.id))
    const links = data.links.filter(l => agentIds.has(l.source))
    const vendorIds = new Set(links.map(l => l.target))
    const vendors = data.nodes.filter(n => n.type === 'vendor' && vendorIds.has(n.id))
    return { nodes: [...agents, ...vendors], links, fleets: data.fleets }
  }, [data, fleet])

  const agents = filtered.nodes.filter(n => n.type === 'agent')
  const vendors = filtered.nodes.filter(n => n.type === 'vendor')
  const critical = agents.filter(a => a.status === 'critical').length
  const totalSpend = filtered.nodes.reduce((s, n) => s + (n.type === 'agent' ? n.spend : 0), 0)

  const fleetTabs = [
    { value: 'all', label: `All · ${data.nodes.filter(n => n.type === 'agent').length}` },
    ...data.fleets.map(f => ({ value: f.id, label: `${f.name} · ${f.agent_count}` })),
  ]

  return (
    <div className="gb-page" style={{ maxWidth: 1400 }}>
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">Fleet</h1>
          <p className="gb-page-sub">Compliance topology — agents, the vendors they call, and where violations flow</p>
          <PageHint>
            Squares are agents (coloured by health), hexagons are LLM vendors. Solid edges are
            API calls; dashed arrows are agent-to-agent delegation; red animated edges carry a
            critical violation. Drag to rearrange, scroll to zoom, click a node to inspect it.
          </PageHint>
        </div>
        <SegmentedControl
          options={[{ value: 'graph', label: '◉ Graph' }, { value: 'grid', label: '⊞ Grid' }]}
          value={view}
          onChange={setView}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        <StatCard label="Agents" value={agents.length} sub={`${agents.filter(a => a.status === 'healthy').length} healthy`} />
        <StatCard label="Vendors" value={vendors.length} sub="LLM providers" />
        <StatCard label="Need attention" value={critical} sub="critical or held" danger={critical > 0} />
        <StatCard label="Fleet spend" value={money(totalSpend)} sub="all-time" />
      </div>

      {data.fleets.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SegmentedControl options={fleetTabs} value={fleet} onChange={(f) => { setFleet(f); setSelected(null) }} size="sm" />
        </div>
      )}

      <Card brackets style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="gb-spinner" /></div>
        ) : agents.length === 0 ? (
          <div className="gb-empty" style={{ padding: 80 }}>
            <span className="gb-empty-icon">⬡</span>
            <div className="gb-empty-title">No agents in this fleet</div>
            <p style={{ color: 'var(--ink-3)' }}>Register agents and they'll appear here, wired to the vendors they call.</p>
          </div>
        ) : view === 'graph' ? (
          <>
            <div ref={containerRef} style={{ width: '100%', height: 560, position: 'relative' }}
              onClick={() => setSelected(null)}>
              <FleetGraph
                data={filtered}
                width={dims.w}
                height={dims.h}
                onSelect={setSelected}
                selectedId={selected?.id}
              />
            </div>
            <Legend />
            <NodeDrawer node={selected} onClose={() => setSelected(null)} />
          </>
        ) : (
          <div style={{ padding: 20, position: 'relative' }}>
            <FleetGrid nodes={filtered.nodes} onSelect={setSelected} selectedId={selected?.id} />
            <NodeDrawer node={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </Card>
    </div>
  )
}

function Legend() {
  const items = [
    { c: '#3fd99a', t: 'healthy' },
    { c: '#ffb454', t: 'warning' },
    { c: '#ff5d6c', t: 'critical / hold' },
    { c: 'var(--ink-2)', t: '⬡ vendor', hex: true },
    { c: 'var(--ink-2)', t: '⇢ delegation', hex: true },
  ]
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: 14, display: 'flex', gap: 16,
      padding: '8px 14px', background: 'rgba(8,11,18,0.7)', borderRadius: 8,
      border: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 10.5,
    }}>
      {items.map(i => (
        <span key={i.t} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)' }}>
          {!i.hex && <span style={{ width: 8, height: 8, borderRadius: 2, background: i.c }} />}
          {i.t}
        </span>
      ))}
      <span style={{ color: 'var(--ink-faint)' }}>· drag nodes · scroll to zoom · click to inspect</span>
    </div>
  )
}
