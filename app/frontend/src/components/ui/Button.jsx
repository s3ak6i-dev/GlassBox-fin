export default function Button({
  children,
  variant = 'default',
  size = 'md',
  disabled,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const cls = [
    'gb-btn',
    variant === 'primary' && 'gb-btn-primary',
    variant === 'danger'  && 'gb-btn-danger',
    variant === 'approve' && 'gb-btn-approve',
    size === 'sm'         && 'gb-btn-sm',
    size === 'lg'         && 'gb-btn-lg',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
