import type { ReactNode } from 'react'
import { Stack, Text } from '@mantine/core'
import { Panel } from './Panel'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <Panel>
      <Stack gap="sm" py="md" align="flex-start">
        <Text className="pc-display" style={{ fontSize: '1.25rem' }}>
          {title}
        </Text>
        {description && (
          <Text size="sm" c="dimmed">
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Panel>
  )
}
