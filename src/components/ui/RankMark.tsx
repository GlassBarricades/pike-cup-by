import { Text } from '@mantine/core'

export function RankMark({ place }: { place: number }) {
  const top = place === 1 ? 'lure' : place === 2 ? 'depth' : place === 3 ? 'reed' : null

  return (
    <Text
      component="span"
      fw={800}
      size="sm"
      className="pc-tabular"
      c={top ?? undefined}
      style={{
        display: 'inline-flex',
        minWidth: 28,
        justifyContent: 'center',
        padding: '2px 6px',
        borderRadius: 'var(--mantine-radius-sm)',
        background: top
          ? `color-mix(in srgb, var(--mantine-color-${top}-5) 18%, transparent)`
          : undefined,
      }}
    >
      {place}
    </Text>
  )
}
