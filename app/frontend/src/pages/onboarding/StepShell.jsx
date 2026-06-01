import styles from './Onboarding.module.css'

const STEPS = ['Organization', 'Vendors', 'Agent', 'Ruleset', 'Go live']

export default function StepShell({ step, title, sub, children, footer }) {
  return (
    <div className={`${styles.page} gb-backdrop`}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <b>glass</b>box<span style={{ color: 'var(--cyan)' }}>·</span>fin
        </div>

        {/* progress */}
        <div className={styles.progress}>
          {STEPS.map((label, i) => (
            <div key={label} className={styles.progressItem}>
              <div
                className={[
                  styles.dot,
                  i < step && styles.dotDone,
                  i === step && styles.dotActive,
                ].filter(Boolean).join(' ')}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`${styles.progressLabel} ${i === step ? styles.progressLabelActive : ''}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`${styles.bar} ${i < step ? styles.barDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* card */}
        <div className={styles.card}>
          <span className="gb-bracket gb-bracket-tl" />
          <span className="gb-bracket gb-bracket-br" />
          <div className={styles.stepNum}>Step {step + 1} of {STEPS.length}</div>
          <h1 className={styles.title}>{title}</h1>
          {sub && <p className={styles.sub}>{sub}</p>}
          <div className={styles.body}>{children}</div>
        </div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
