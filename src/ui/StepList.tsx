import { Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'
import { IconCheck, IconCircle } from '@tabler/icons-react'

export type StepItem = {
  to: string
  title: string
  status: string
  done: boolean
  warn?: boolean
}

export function StepList({ steps }: { steps: StepItem[] }) {
  return (
    <Stack gap={0}>
      {steps.map((step, i) => (
        <UnstyledButton
          key={step.to}
          component={Link}
          to={step.to}
          style={{
            display: 'block',
            padding: '14px 0',
            borderBottom: i < steps.length - 1 ? '1px solid var(--pc-line)' : undefined,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <Group justify="space-between" wrap="nowrap" gap="md">
            <Group gap="sm" wrap="nowrap">
              {step.done ? (
                <IconCheck size={20} style={{ color: 'var(--pc-signal)', flexShrink: 0 }} />
              ) : (
                <IconCircle size={20} style={{ color: 'var(--pc-muted)', flexShrink: 0 }} />
              )}
              <div>
                <Text className="pc-display" style={{ fontSize: '1.05rem' }}>
                  {i + 1}. {step.title}
                </Text>
                <Text size="xs" c={step.warn ? 'signal' : 'dimmed'}>
                  {step.status}
                </Text>
              </div>
            </Group>
            <Text size="xs" c="dimmed" className="pc-display">
              →
            </Text>
          </Group>
        </UnstyledButton>
      ))}
    </Stack>
  )
}
