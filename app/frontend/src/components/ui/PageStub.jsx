import Card from './Card.jsx'

export default function PageStub({ title, sub, icon = '◈', note }) {
  return (
    <div className="gb-page">
      <div className="gb-page-header">
        <div>
          <h1 className="gb-page-title">{title}</h1>
          {sub && <p className="gb-page-sub">{sub}</p>}
        </div>
      </div>
      <Card brackets>
        <div className="gb-empty">
          <span className="gb-empty-icon">{icon}</span>
          <div className="gb-empty-title">Coming up</div>
          <p style={{ maxWidth: 380, color: 'var(--ink-3)' }}>
            {note || 'This screen is part of an upcoming build session.'}
          </p>
        </div>
      </Card>
    </div>
  )
}
