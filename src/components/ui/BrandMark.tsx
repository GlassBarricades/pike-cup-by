import { Group, Text } from '@mantine/core'

export function BrandMark({
  size = 'md',
  inverted,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  inverted?: boolean
}) {
  const px = size === 'sm' ? 22 : size === 'lg' ? 40 : size === 'xl' ? 56 : 28
  const textSize = size === 'sm' ? 'lg' : size === 'lg' ? 36 : size === 'xl' ? 48 : 'xl'

  return (
    <Group gap={10} wrap="nowrap" align="center">
      <img
        src="/brand/pike-mark.svg"
        alt=""
        width={px * 2}
        height={px}
        style={{
          display: 'block',
          color: inverted ? '#e6f2f1' : 'var(--mantine-color-depth-6)',
          filter: inverted ? 'invert(1) brightness(1.2)' : undefined,
        }}
      />
      <Text
        className="pc-brand"
        fw={700}
        fz={textSize}
        c={inverted ? undefined : 'depth'}
        style={inverted ? { color: '#e6f2f1' } : undefined}
        lh={1}
      >
        PikeCup
      </Text>
    </Group>
  )
}
