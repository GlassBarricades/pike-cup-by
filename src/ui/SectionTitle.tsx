import type { ReactNode } from 'react'
import { Group, Text } from '@mantine/core'

export function SectionTitle({
  children,
  action,
  id,
}: {
  children: ReactNode
  action?: ReactNode
  id?: string
}) {
  return (
    <Group
      id={id}
      justify="space-between"
      align="flex-end"
      wrap="wrap"
      gap="sm"
      mb="sm"
      pb={8}
      style={{ borderBottom: '1px solid var(--pc-line)' }}
    >
      <Text
        component="h2"
        className="pc-display"
        style={{ fontSize: '1.35rem', margin: 0, letterSpacing: '0.06em' }}
      >
        {children}
      </Text>
      {action}
    </Group>
  )
}
