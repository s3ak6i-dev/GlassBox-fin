import { useAuth } from '../../hooks/useAuth.js'
import styles from './Topbar.module.css'

export default function Topbar({ title }) {
  const { user } = useAuth()
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {title && <span className={styles.title}>{title}</span>}
      </div>
      <div className={styles.right}>
        {user && (
          <div className={styles.user}>
            <span className={styles.avatar}>
              {(user.email || 'U')[0].toUpperCase()}
            </span>
            <span className={styles.email}>{user.email}</span>
          </div>
        )}
      </div>
    </header>
  )
}
