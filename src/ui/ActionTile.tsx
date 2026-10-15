import type { ReactNode } from 'react'
import { Text, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { Icon } from '@tabler/icons-react'

export function ActionTile({
  to,
  title,
  description,
  icon: Icon,
  disabled,
  onClick,
}: {
  to?: string
  title: string
  description?: string
  icon?: Icon
  disabled?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      {Icon && <Icon size={22} stroke={1.75} style={{ color: 'var(--pc-signal)', marginBottom: 8 }} />}
      <Text className="pc-display" style={{ fontSize: '1.1rem' }}>
        {title}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" mt={4}>
          {description}
        </Text>
      )}
    </>
  )

  const style = {
    display: 'block' as const,
    width: '100%',
    textAlign: 'left' as const,
    padding: '1rem',
    background: 'var(--pc-panel)',
    border: '1px solid var(--pc-line)',
    borderRadius: 'var(--pc-radius)',
    textDecoration: 'none',
    color: 'inherit',
    opacity: disabled ? 0.45 : 1,
    pointerEvents: disabled ? ('none' as const) : undefined,
  }

  if (to && !disabled) {
    return (
      <UnstyledButton component={Link} to={to} style={style}>
        {content}
      </UnstyledButton>
    )
  }

  return (
    <UnstyledButton onClick={onClick} disabled={disabled} style={style}>
      {content as ReactNode}
    </UnstyledButton>
  )
}
