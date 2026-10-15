import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computed = useComputedColorScheme('dark', { getInitialValueInEffect: true })
  const next = computed === 'dark' ? 'light' : 'dark'

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      radius={2}
      onClick={() => setColorScheme(next)}
      aria-label="Сменить тему"
    >
      {computed === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  )
}
