import { Group, Text } from '@mantine/core'

export function LiveBadge({ label = 'Live' }: { label?: string }) {
  return (
    <Group
      gap={6}
      px={10}
      py={4}
      style={{
        border: '1px solid var(--pc-signal)',
        borderRadius: 'var(--pc-radius)',
        background: 'color-mix(in srgb, var(--pc-signal) 12%, transparent)',
      }}
    >
      <span className="pc-live-dot" />
      <Text
        size="xs"
        fw={800}
        className="pc-display"
        style={{ color: 'var(--pc-signal)', letterSpacing: '0.1em' }}
      >
        {label}
      </Text>
    </Group>
  )
}
