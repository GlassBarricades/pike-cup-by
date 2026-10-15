import { Stack, Text } from '@mantine/core'

export function Stat({
  value,
  label,
  accent,
}: {
  value: string | number
  label: string
  accent?: boolean
}) {
  return (
    <Stack gap={2}>
      <Text
        className="pc-display pc-tabular"
        style={{
          fontSize: '1.75rem',
          lineHeight: 1,
          color: accent ? 'var(--pc-signal)' : undefined,
        }}
      >
        {value}
      </Text>
      <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.08em' }}>
        {label}
      </Text>
    </Stack>
  )
}
