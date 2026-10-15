import { AppShell, Group, Text, useComputedColorScheme, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'
import { useActiveTournament } from '../features/tournament/hooks'
import { BrandMark } from './ui'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'
import { ThemeToggle } from './ThemeToggle'

export function AppLayout() {
  const theme = useMantineTheme()
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`)
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isDark = colorScheme === 'dark'
  const { data: active } = useActiveTournament()
  const showLive = active?.status === 'live'

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 248,
        breakpoint: 'md',
        collapsed: { mobile: true },
      }}
      footer={{ height: 64, collapsed: Boolean(isDesktop) }}
      padding="md"
      styles={{
        main: {
          minHeight: '100dvh',
          paddingBottom: isDesktop
            ? undefined
            : 'calc(var(--app-shell-footer-offset, 0px) + env(safe-area-inset-bottom))',
        },
        header: {
          background: isDark ? 'rgba(15, 22, 21, 0.94)' : 'rgba(247, 250, 249, 0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--pc-hairline)',
        },
        navbar: {
          background: isDark ? 'rgba(15, 22, 21, 0.98)' : 'rgba(247, 250, 249, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid var(--pc-hairline)',
        },
        footer: {
          background: 'transparent',
          borderTop: 'none',
          padding: 0,
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <BrandMark size="sm" />
            {showLive && (
              <Text
                size="xs"
                fw={800}
                tt="uppercase"
                c="lure"
                style={{
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  border: '1px solid var(--mantine-color-lure-5)',
                  borderRadius: 'var(--mantine-radius-sm)',
                }}
              >
                LIVE
              </Text>
            )}
            <Text size="xs" c="dimmed" visibleFrom="sm">
              Республика Беларусь
            </Text>
          </Group>
          <ThemeToggle />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar visibleFrom="md">
        <SideNav />
      </AppShell.Navbar>

      <AppShell.Main className="pc-shell-bg">
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer hiddenFrom="md">
        <BottomNav />
      </AppShell.Footer>
    </AppShell>
  )
}
