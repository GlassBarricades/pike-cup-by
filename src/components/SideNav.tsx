import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { NavLink, Stack, Text } from '@mantine/core'
import { useAuth } from '../features/auth/AuthProvider'
import { getNavItems, isNavActive } from './navItems'

export function SideNav() {
  const { pathname } = useLocation()
  const { role } = useAuth()
  const items = getNavItems(role, 'side')

  return (
    <Stack gap={4} p="sm" h="100%">
      <Text size="xs" tt="uppercase" c="dimmed" fw={800} mb={6} px={8} style={{ letterSpacing: '0.06em' }}>
        Меню
      </Text>
      {items.map(({ to, label, icon: Icon }) => {
        const active = isNavActive(pathname, to)

        return (
          <NavLink
            key={to}
            component={RouterNavLink}
            to={to}
            label={label}
            leftSection={<Icon size={18} stroke={active ? 2 : 1.75} />}
            active={active}
            color="depth"
            styles={{
              root: {
                borderRadius: 'var(--mantine-radius-sm)',
                fontWeight: active ? 800 : 500,
                borderLeft: active
                  ? '3px solid var(--mantine-color-depth-5)'
                  : '3px solid transparent',
                background: active
                  ? 'color-mix(in srgb, var(--mantine-color-depth-5) 12%, transparent)'
                  : 'transparent',
              },
            }}
          />
        )
      })}
    </Stack>
  )
}
