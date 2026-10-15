import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { Box, Text, UnstyledButton, useComputedColorScheme } from '@mantine/core'
import { useAuth } from '../features/auth/AuthProvider'
import { getNavItems, isNavActive } from './navItems'

export function BottomNav() {
  const { pathname } = useLocation()
  const { role } = useAuth()
  const items = getNavItems(role, 'bottom')
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true })
  const isDark = colorScheme === 'dark'

  return (
    <Box
      component="nav"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        height: '100%',
        borderTop: '1px solid var(--pc-hairline)',
        background: isDark ? 'rgba(21, 26, 30, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(10px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = isNavActive(pathname, to)

        return (
          <UnstyledButton
            key={to}
            component={RouterNavLink}
            to={to}
            className={active ? 'pc-nav-active-bar' : undefined}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              minHeight: 56,
              color: active
                ? 'var(--mantine-color-depth-5)'
                : isDark
                  ? 'var(--mantine-color-dark-1)'
                  : 'var(--mantine-color-gray-6)',
              textDecoration: 'none',
              transition: 'color 150ms ease, opacity 150ms ease',
              opacity: active ? 1 : 0.85,
            }}
          >
            <Icon size={22} stroke={active ? 2 : 1.75} />
            <Text size="xs" fw={active ? 800 : 500}>
              {label}
            </Text>
          </UnstyledButton>
        )
      })}
    </Box>
  )
}
