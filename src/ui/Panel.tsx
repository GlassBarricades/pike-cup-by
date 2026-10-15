import type { CSSProperties, ReactNode } from 'react'

export function Panel({
  children,
  p = 'md',
  style,
  className,
}: {
  children: ReactNode
  p?: number | string
  style?: CSSProperties
  className?: string
}) {
  const padding =
    typeof p === 'number' ? `${p}px` : p === 'md' ? '1rem' : p === 'sm' ? '0.75rem' : p === 'lg' ? '1.25rem' : p

  return (
    <div
      className={className}
      style={{
        background: 'var(--pc-panel)',
        border: '1px solid var(--pc-line)',
        borderRadius: 'var(--pc-radius)',
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
