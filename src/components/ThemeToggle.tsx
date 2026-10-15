import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isDark = computed === 'dark'

  return (
    <Tooltip label={isDark ? 'Светлая тема' : 'Тёмная тема'} withArrow>
      <ActionIcon
        variant="subtle"
        color="depth"
        size="lg"
        radius="md"
        aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
        onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <IconSun size={18} stroke={1.75} /> : <IconMoon size={18} stroke={1.75} />}
      </ActionIcon>
    </Tooltip>
  )
}
