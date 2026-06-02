import { useState } from 'react'

// Inline "ⓘ What's this?" affordance for a screen. Drop into a page header.
export default function PageHint({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontFamily: 'var(--font-mono)', fontSize: 12, color: open ? 'var(--cyan)' : 'var(--ink-3)',
          display: 'inline-flex', alignItems: 'center', gap: 5,
        }}
      >
        ⓘ What's this?
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: 26, left: 0, zIndex: 41, width: 340,
            background: 'rgba(10,13,21,0.98)', border: '1px solid var(--line-2)',
            borderRadius: 'var(--r-sm)', padding: '14px 16px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.6)', animation: 'fade-in 0.15s ease',
          }}>
            <div style={{
              fontFamily: 'var(--font-prose)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)',
            }}>
              {children}
            </div>
          </div>
        </>
      )}
    </span>
  )
}
