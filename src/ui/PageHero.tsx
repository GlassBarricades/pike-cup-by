import type { ReactNode } from 'react'
import { Group, Stack, Text, Title } from '@mantine/core'

export function PageHero({
  title,
  subtitle,
  badge,
  meta,
  actions,
  children,
  mb = 'lg',
}: {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  mb?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 0
}) {
  return (
    <Stack gap="sm" mb={mb}>
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <div>
          <Group gap="sm" wrap="wrap" mb={4}>
            <Title
              order={1}
              className="pc-display"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', lineHeight: 1.05 }}
            >
              {title}
            </Title>
            {badge}
          </Group>
          {subtitle && (
            <Text size="sm" c="dimmed">
              {subtitle}
            </Text>
          )}
          {meta}
        </div>
        {actions}
      </Group>
      {children}
    </Stack>
  )
}
