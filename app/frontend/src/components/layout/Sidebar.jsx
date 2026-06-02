import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import styles from './Sidebar.module.css'

const NAV = [
  {
    items: [
      { to: '/app',            tour: 'home',       icon: '⌂', label: 'Home', end: true },
      { to: '/app/overview',   tour: 'overview',   icon: '◈', label: 'Overview' },
      { to: '/app/holds',      tour: 'holds',      icon: '⏸', label: 'Holds', badge: true },
      { to: '/app/traces',     tour: 'traces',     icon: '≡', label: 'Trace Explorer' },
      { to: '/app/violations', tour: 'violations', icon: '△', label: 'Violations' },
    ],
  },
  {
    label: 'Fleet',
    items: [
      { to: '/app/fleets', tour: 'fleets', icon: '⬡', label: 'Fleets' },
      { to: '/app/agents', tour: 'agents', icon: '●', label: 'Agents' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/app/spend',   tour: 'spend',   icon: '$', label: 'Spend' },
      { to: '/app/rules',   tour: 'rules',   icon: '⊞', label: 'Rules' },
      { to: '/app/reports', tour: 'reports', icon: '↧', label: 'Reports' },
    ],
  },
  {
    items: [
      { to: '/app/docs',     tour: 'docs',     icon: '◳', label: 'Connect agent' },
      { to: '/app/settings', tour: 'settings', icon: '⚙', label: 'Settings' },
    ],
  },
]

export default function Sidebar({ holdCount = 0 }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className={styles.sidebar}>
      <NavLink to="/app" end className={styles.brand}>
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
                end={item.end}
                data-tour={item.tour}
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
