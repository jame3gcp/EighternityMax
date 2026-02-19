import React from 'react'

export type LogoVariant = 'a' | 'b' | 'd'

interface LogoIconProps {
  variant?: LogoVariant
  className?: string
  'aria-hidden'?: boolean
}

/** A: 8등분 원 */
const LogoA: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="16" cy="16" r="14" stroke="currentColor" fill="none" />
    <line x1="16" y1="2" x2="16" y2="16" stroke="currentColor" />
    <line x1="16" y1="16" x2="27.31" y2="8" stroke="currentColor" />
    <line x1="16" y1="16" x2="27.31" y2="24" stroke="currentColor" />
    <line x1="16" y1="16" x2="16" y2="30" stroke="currentColor" />
    <line x1="16" y1="16" x2="4.69" y2="24" stroke="currentColor" />
    <line x1="16" y1="16" x2="4.69" y2="8" stroke="currentColor" />
    <line x1="16" y1="16" x2="22.63" y2="5.37" stroke="currentColor" />
    <line x1="16" y1="16" x2="9.37" y2="5.37" stroke="currentColor" />
    <line x1="16" y1="16" x2="9.37" y2="26.63" stroke="currentColor" />
    <line x1="16" y1="16" x2="22.63" y2="26.63" stroke="currentColor" />
  </svg>
)

/** B: 무한대(∞) + 8 */
const LogoB: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" className={className} aria-hidden>
    <circle cx="16" cy="10" r="6" fill="none" />
    <circle cx="16" cy="22" r="6" fill="none" />
    <circle cx="16" cy="10" r="2.5" fill="currentColor" />
    <circle cx="16" cy="22" r="2.5" fill="currentColor" />
  </svg>
)

/** D: 8개 점이 있는 원 */
const LogoD: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
    <circle cx="16" cy="16" r="12" fill="none" />
    <circle cx="16" cy="4" r="2.2" fill="currentColor" />
    <circle cx="22.63" cy="7.37" r="2.2" fill="currentColor" />
    <circle cx="28" cy="16" r="2.2" fill="currentColor" />
    <circle cx="22.63" cy="24.63" r="2.2" fill="currentColor" />
    <circle cx="16" cy="28" r="2.2" fill="currentColor" />
    <circle cx="9.37" cy="24.63" r="2.2" fill="currentColor" />
    <circle cx="4" cy="16" r="2.2" fill="currentColor" />
    <circle cx="9.37" cy="7.37" r="2.2" fill="currentColor" />
  </svg>
)

const LogoIcon: React.FC<LogoIconProps> = ({ variant = 'b', className = '', 'aria-hidden': ariaHidden = true }) => {
  const c = `shrink-0 ${className}`.trim()
  if (variant === 'b') return <LogoB className={c} />
  if (variant === 'd') return <LogoD className={c} />
  return <LogoA className={c} />
}

export default LogoIcon
