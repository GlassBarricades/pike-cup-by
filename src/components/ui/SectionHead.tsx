import type { ReactNode } from 'react'
import { Stack, Text, Title } from '@mantine/core'

export function SectionHead({
  title,
  description,
  action,
  order = 2,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  order?: 2 | 3 | 4
}) {
  return (
    <Stack gap={4}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Title order={order}>{title}</Title>
        {action}
      </div>
      {description != null && (
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      )}
    </Stack>
  )
}
