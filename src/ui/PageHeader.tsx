import type { ReactNode } from 'react'
import { Group, Title, type TitleProps } from '@mantine/core'

export function PageHeader({
  title,
  order = 2,
  status,
  rightSection,
}: {
  title: ReactNode
  order?: TitleProps['order']
  status?: ReactNode
  rightSection?: ReactNode
}) {
  return (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Group gap="sm" align="center" wrap="wrap" style={{ minWidth: 0 }}>
        <Title
          order={order}
          className="pc-display"
          style={{ fontSize: order === 2 ? '1.75rem' : undefined, lineHeight: 1.1 }}
        >
          {title}
        </Title>
        {status}
      </Group>
      {rightSection}
    </Group>
  )
}
