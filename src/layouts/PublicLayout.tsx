import { AppShell, useMantineTheme } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Outlet } from 'react-router-dom'
import { BottomTabBar } from './BottomTabBar'
import { SideRail } from './SideRail'
import { TopBar } from './TopBar'

export function PublicLayout() {
  const theme = useMantineTheme()
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`)

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{
        width: 200,
        breakpoint: 'md',
        collapsed: { mobile: true },
      }}
      footer={{ height: 64, collapsed: Boolean(isDesktop) }}
      padding={0}
      styles={{
        main: {
          minHeight: '100dvh',
          background: 'var(--pc-bg)',
          paddingBottom: isDesktop
            ? undefined
            : 'calc(var(--app-shell-footer-offset, 0px) + env(safe-area-inset-bottom))',
        },
        header: {
          background: 'var(--pc-bg)',
          borderBottom: 'none',
        },
        navbar: {
          background: 'var(--pc-bg)',
          borderRight: '1px solid var(--pc-line)',
        },
        footer: {
          background: 'transparent',
          borderTop: 'none',
          padding: 0,
        },
      }}
    >
      <AppShell.Header>
        <TopBar />
      </AppShell.Header>

      <AppShell.Navbar visibleFrom="md">
        <SideRail />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer hiddenFrom="md">
        <BottomTabBar />
      </AppShell.Footer>
    </AppShell>
  )
}
