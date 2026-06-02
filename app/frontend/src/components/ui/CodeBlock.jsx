import { useState } from 'react'

export default function CodeBlock({ code, lang = 'python', label }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div style={{
      border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', overflow: 'hidden',
      background: 'linear-gradient(180deg, rgba(13,17,26,0.9), rgba(8,11,18,0.95))',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderBottom: '1px solid var(--line)', background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
          {label || lang}
        </span>
        <button onClick={copy} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: copied ? 'var(--cyan)' : 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11.5,
        }}>
          {copied ? '✓ copied' : '⧉ copy'}
        </button>
      </div>
      <pre style={{
        margin: 0, padding: '16px 18px', overflowX: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--ink)',
      }}>{code}</pre>
    </div>
  )
}
