import type { CSSProperties, ReactNode } from 'react'
import { Box } from '@mantine/core'

export function ScoreSurface({
  children,
  p = 'md',
  className,
  style,
  accent,
}: {
  children: ReactNode
  p?: string | number
  className?: string
  style?: CSSProperties
  /** Left accent bar: depth | reed | lure | none */
  accent?: 'depth' | 'reed' | 'lure' | 'lake' | null
}) {
  const accentColor =
    accent === 'reed'
      ? 'var(--mantine-color-reed-5)'
      : accent === 'lure'
        ? 'var(--mantine-color-lure-5)'
        : accent === 'depth' || accent === 'lake'
          ? 'var(--mantine-color-depth-5)'
          : undefined

  return (
    <Box
      p={p}
      className={className}
      style={{
        background: 'var(--pc-surface)',
        border: '1px solid var(--pc-hairline)',
        borderRadius: 'var(--mantine-radius-sm)',
        borderLeft: accentColor ? `3px solid ${accentColor}` : undefined,
        ...style,
      }}
    >
      {children}
    </Box>
  )
}
