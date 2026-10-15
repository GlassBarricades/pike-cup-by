import { Text } from '@mantine/core'
import { Link } from 'react-router-dom'

export function BrandMark({
  size = 'md',
  link = true,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  link?: boolean
}) {
  const fontSize = size === 'xl' ? '2rem' : size === 'lg' ? '1.5rem' : size === 'sm' ? '1.05rem' : '1.25rem'

  const mark = (
    <Text
      className="pc-display"
      style={{
        fontSize,
        letterSpacing: '0.08em',
        color: 'var(--pc-text)',
        lineHeight: 1,
      }}
    >
      Pike
      <Text span style={{ color: 'var(--pc-signal)' }}>
        Cup
      </Text>
    </Text>
  )

  if (!link) return mark

  return (
    <Link to="/" style={{ textDecoration: 'none' }}>
      {mark}
    </Link>
  )
}
