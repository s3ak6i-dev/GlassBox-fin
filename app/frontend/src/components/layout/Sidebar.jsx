import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import styles from './Sidebar.module.css'

const NAV = [
  {
    items: [
      { to: '/',           icon: '◈', label: 'Overview' },
      { to: '/holds',      icon: '⏸', label: 'Holds',          badge: true },
      { to: '/traces',     icon: '≡', label: 'Trace Explorer' },
      { to: '/violations', icon: '△', label: 'Violations' },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { to: '/fleets', icon: '⬡', label: 'Fleets' },
      { to: '/agents', icon: '●', label: 'Agents' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/spend',   icon: '$', label: 'Spend' },
      { to: '/rules',   icon: '⊞', label: 'Rules' },
      { to: '/reports', icon: '↧', label: 'Reports' },
    ],
  },
  {
    items: [
      { to: '/docs', icon: '◳', label: 'Connect agent' },
      { to: '/settings', icon: '⚙', label: 'Settings' },
    ],
  },
]

export default function Sidebar({ holdCount = 0 }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className={styles.sidebar}>
      <NavLink to="/" className={styles.brand}>
        <b>glass</b>box<span className={styles.dot}>·</span>fin
      </NavLink>

      <nav className={styles.nav}>
        {NAV.map((section, si) => (
          <div key={si} className={styles.section}>
            {section.label && (
              <div className={styles.sectionLabel}>{section.label}</div>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.icon}>{item.icon}</span>
                {item.label}
                {item.badge && holdCount > 0 && (
                  <span className={styles.badge}>{holdCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login') }}>
          ← Logout
        </button>
      </div>
    </aside>
  )
}
