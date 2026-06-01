export default function Card({ children, brackets = false, className = '', style, onClick }) {
  return (
    <div
      className={`gb-card ${className}`}
      style={style}
      onClick={onClick}
    >
      {brackets && (
        <>
          <span className="gb-bracket gb-bracket-tl" />
          <span className="gb-bracket gb-bracket-tr" />
          <span className="gb-bracket gb-bracket-bl" />
          <span className="gb-bracket gb-bracket-br" />
        </>
      )}
      {children}
    </div>
  )
}
