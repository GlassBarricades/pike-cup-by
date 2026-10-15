import type { ComponentType, CSSProperties } from 'react'
import { Text, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'
import { ScoreSurface } from './ScoreSurface'

type IconProps = { size?: number | string; stroke?: number; color?: string }

export function HubTile({
  to,
  title,
  description,
  icon: Icon,
  disabled,
}: {
  to: string
  title: string
  description?: string
  icon?: ComponentType<IconProps>
  disabled?: boolean
}) {
  const surfaceStyle: CSSProperties = {
    height: '100%',
    opacity: disabled ? 0.5 : 1,
    transition: 'border-color 150ms ease',
  }

  const body = (
    <ScoreSurface p="md" style={surfaceStyle} className="pc-hub-tile">
      {Icon && <Icon size={22} stroke={1.6} color="var(--mantine-color-depth-5)" />}
      <Text fw={700} mt={Icon ? 8 : 0}>
        {title}
      </Text>
      {description && (
        <Text size="sm" c="dimmed" mt={4}>
          {description}
        </Text>
      )}
    </ScoreSurface>
  )

  if (disabled) {
    return <div style={{ display: 'block', height: '100%' }}>{body}</div>
  }

  return (
    <UnstyledButton component={Link} to={to} style={{ display: 'block', height: '100%' }}>
      {body}
    </UnstyledButton>
  )
}
